import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, TemplateRef } from '@angular/core';
import { getJwtPayload } from 'src/app/utils/jwt.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { concatMap, finalize, forkJoin, from, Observable, of } from 'rxjs';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormulaService } from '../formula-medica/service/formula.service';
import { MedicamentoService } from '../medicamento/service/medicamento.service';
import { Medicamento } from 'src/app/models/medicamento';
import { Formula } from 'src/app/models/formula';
import { HistoriaService } from './service/historia.service';
import { AnotacionHistoriaService } from './service/anotacion-historia.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { CitaService } from '../cita/service/cita.service';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { Cita } from 'src/app/models/cita';
import { HistoriaRq } from 'src/app/models/historia-rq';
import { AnotacionHistoriaRq } from 'src/app/models/anotacion-historia-rq';

type ColumnaOrden = 'fecha' | 'mascota' | 'cliente' | 'veterinario' | 'motivo' | 'diagnostico' | 'observaciones' | 'estado';
type FilaHistoria = Record<ColumnaOrden, string> & { fechaOrden: number; detalle: HistoriaMedica };
type ModalInst = { show(): void; hide(): void };
type WindowBoot = Window & { bootstrap: { Modal: new (el: Element, opts?: object) => ModalInst } };

interface FilaFormula {
  medicamento: Medicamento | null;
  dosis: string;
  frecuencia: string;
  duracion: string;
  cantidad: string;
  viaAdministracion: string;
  indicaciones: string;
}

@Component({
  selector: 'app-historia',
  imports: [CommonModule, NgbModalModule, ReactiveFormsModule, FormsModule],
  templateUrl: './historia.component.html',
  styleUrl: './historia.component.scss'
})
export class HistoriaComponent implements OnInit {

  listHistorias: HistoriaMedica[] = [];
  cargandoHistorias = false;
  errorHistorias = '';
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  readonly columnas: { clave: ColumnaOrden; titulo: string }[] = [
    { clave: 'fecha', titulo: 'Fecha de creación' },
    { clave: 'mascota', titulo: 'Mascota' },
    { clave: 'cliente', titulo: 'Cliente' },
    { clave: 'veterinario', titulo: 'Veterinario' },
    { clave: 'motivo', titulo: 'Motivo de consulta' },
    { clave: 'diagnostico', titulo: 'Diagnóstico' },
    { clave: 'observaciones', titulo: 'Observaciones' },
    { clave: 'estado', titulo: 'Estado' }
  ];
  columnaOrden: ColumnaOrden = 'fecha';
  direccionOrden: 'asc' | 'desc' = 'desc';
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formulaService = inject(FormulaService);
  private readonly medicamentoService = inject(MedicamentoService);
  private modalDetalle?: NgbModalRef;
  private modalFormulario?: NgbModalRef;

  // --- Atención desde cita ---
  citaAtendida: Cita | null = null;
  historiaParaAtencion: HistoriaMedica | null = null;
  formulasEnAtencion: FilaFormula[] = [];
  listMedicamentosAtencion: Medicamento[] = [];
  guardandoAtencion = false;
  errorAtencion = '';
  finalizarCita = false;
  private modalAtencionInst: ModalInst | null = null;
  historiaDetalle: HistoriaMedica | null = null;

  private readonly formBuilder = inject(FormBuilder);
  private readonly anotacionHistoriaService = inject(AnotacionHistoriaService);
  private readonly mascotaService = inject(MascotaService);
  private readonly citaService = inject(CitaService);
  readonly formHistoria = this.formBuilder.group({
    mascotaId: this.formBuilder.control<number | null>(null, Validators.required)
  });
  readonly formAnotacion = this.formBuilder.nonNullable.group({
    anotaciones: this.formBuilder.array([this.crearFilaAnotacion()])
  });
  readonly TIPOS_SERVICIO = ['CONSULTA', 'CIRUGIA', 'VACUNACION', 'GROOMING', 'EXAMEN', 'OTRO'];

  readonly formAtencionRapida = this.formBuilder.nonNullable.group({
    tipoServicio: ['CONSULTA', Validators.required],
    descripcion: ['', [Validators.required, Validators.pattern(/\S/)]],
    diagnostico: ['', [Validators.required, Validators.pattern(/\S/)]],
    observaciones: ['']
  });
  historiaAnotacion: HistoriaMedica | null = null;
  listMascotas: Mascota[] = [];
  listCitas: Cita[] = [];
  cargandoCatalogos = false;
  errorCatalogos = '';
  respuestaError = '';
  guardando = false;

  constructor(private readonly historiaService: HistoriaService) {
    this.destroyRef.onDestroy(() => {
      this.modalDetalle?.dismiss();
      this.modalFormulario?.dismiss();
    });
    this.listarHistorias();
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const citaId = params['citaId'] ? +params['citaId'] : null;
      if (citaId) {
        this.router.navigate([], { replaceUrl: true, queryParams: {} });
        // Esperar a que las historias carguen y luego abrir
        setTimeout(() => this.abrirAtencionDesdeCita(citaId), 300);
      }
    });
  }

  get anotacionesForm() {
    return this.formAnotacion.controls.anotaciones;
  }

  agregarAnotacion(): void {
    if (!this.guardando) {
      this.anotacionesForm.push(this.crearFilaAnotacion());
    }
  }

  quitarAnotacion(indice: number): void {
    if (!this.guardando && this.anotacionesForm.length > 1) {
      this.anotacionesForm.removeAt(indice);
    }
  }

  private crearFilaAnotacion() {
    const fila = this.formBuilder.nonNullable.group({
      citaId: this.formBuilder.control<number | null>(null, Validators.required),
      medicoId: this.formBuilder.control<number | null>(null, Validators.required),
      descripcion: ['', [Validators.required, Validators.pattern(/\S/)]],
      diagnostico: ['', [Validators.required, Validators.pattern(/\S/)]],
      observaciones: ['', [Validators.required, Validators.pattern(/\S/)]]
    });
    // El veterinario de la anotación es siempre el asignado a la cita seleccionada.
    fila.controls.citaId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(citaId => {
      fila.controls.medicoId.setValue(this.medicosDeCita(citaId)[0]?.id ?? null);
    });
    return fila;
  }

  listarHistorias(): void {
    if (this.cargandoHistorias) {
      return;
    }
    this.cargandoHistorias = true;
    this.errorHistorias = '';
    const payload = getJwtPayload();
    const esMedico = payload?.rol && payload.rol.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') === 'medico';
    const obs$ = esMedico && payload?.medicoId
      ? this.historiaService.listarPorMedico(payload.medicoId)
      : this.historiaService.listar();
    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (historias) => {
        this.listHistorias = historias;
        this.cargandoHistorias = false;
        this.paginaActual = Math.min(this.paginaActual, this.totalPaginas || 1);
      },
      error: (err) => {
        this.cargandoHistorias = false;
        this.errorHistorias = 'No fue posible cargar las historias médicas.';
        console.error('Error al listar historias médicas:', err);
      }
    });
  }

  get historiasFiltradas(): FilaHistoria[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filas = this.listHistorias.map((detalle): FilaHistoria => {
      const { historia, anotaciones } = detalle;
      const ultimaAnotacion = anotaciones.reduce<typeof anotaciones[number] | undefined>(
        (ultima, anotacion) => !ultima || new Date(anotacion.fecha).getTime() > new Date(ultima.fecha).getTime()
          ? anotacion : ultima,
        undefined
      );
      const mascota = historia.mascota;
      const cliente = mascota.cliente;
      const medico = ultimaAnotacion?.medico;
      const cita = ultimaAnotacion?.cita;

      return {
        detalle,
        fecha: formatDate(historia.fechaCreacion, 'yyyy-MM-dd', 'en-US'),
        fechaOrden: new Date(historia.fechaCreacion).getTime(),
        mascota: mascota.nombreMascota || mascota.nombre || 'No informado',
        cliente: `${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`.trim() || 'No informado',
        veterinario: `${medico?.nombres ?? ''} ${medico?.apellidos ?? ''}`.trim() || 'No informado',
        motivo: cita?.motivo?.trim() || 'No informado',
        diagnostico: ultimaAnotacion?.diagnostico?.trim() || 'No informado',
        observaciones: ultimaAnotacion?.observaciones?.trim() || 'No informado',
        estado: mascota.activo == null ? 'No informado' : mascota.activo ? 'Activo' : 'Inactivo'
      };
    });
    const filtradas = filas.filter(fila =>
      this.columnas.some(({ clave }) => this.normalizarTexto(fila[clave]).includes(termino)) ||
      fila.detalle.anotaciones.some(anotacion =>
        [anotacion.diagnostico, anotacion.observaciones].some(texto =>
          this.normalizarTexto(texto ?? '').includes(termino)))
    );

    return filtradas.sort((filaA, filaB) => {
      const comparacion = this.columnaOrden === 'fecha'
        ? filaA.fechaOrden - filaB.fechaOrden
        : filaA[this.columnaOrden].localeCompare(filaB[this.columnaOrden], 'es', {
          numeric: true, sensitivity: 'base'
        });
      return this.direccionOrden === 'asc' ? comparacion : -comparacion;
    });
  }

  ordenarPor(columna: ColumnaOrden): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }
    this.paginaActual = 1;
  }

  get historiasPaginadas(): FilaHistoria[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.historiasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.historiasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  actualizarBusqueda(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.terminoBusqueda = event.target.value;
      this.paginaActual = 1;
    }
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  verDetalle(historia: HistoriaMedica, contenido: TemplateRef<unknown>): void {
    this.historiaDetalle = historia;
    this.modalDetalle = this.modalService.open(contenido, {
      size: 'lg',
      scrollable: true,
      ariaLabelledBy: 'detalleHistoriaTitulo'
    });
    this.modalDetalle.hidden.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.historiaDetalle = null;
      this.modalDetalle = undefined;
    });
  }

  /** Mascotas activas que todavía no tienen historia médica. */
  get mascotasDisponibles(): Mascota[] {
    const conHistoria = new Set(this.listHistorias.map(({ historia }) => historia.mascota?.mascotaId));
    return this.listMascotas.filter(mascota =>
      mascota.mascotaId != null && mascota.activo !== false && !conHistoria.has(mascota.mascotaId));
  }

  /** Veterinario asignado a la cita indicada (lista vacía si no hay cita o no tiene médico). */
  medicosDeCita(citaId: number | null | undefined): Medico[] {
    const medico = citaId == null ? undefined : this.citasDisponibles.find(cita => cita.id === citaId)?.medico;
    return medico?.id != null ? [medico] : [];
  }

  /** Citas asignadas a la mascota de la historia (el backend ya las filtra por mascota). */
  get citasDisponibles(): Cita[] {
    return this.historiaAnotacion ? this.listCitas.filter(cita => cita.id != null) : [];
  }

  /** Indica si la cita ya está asociada a alguna anotación de la historia seleccionada. */
  citaConAnotacion(cita: Cita): boolean {
    return !!this.historiaAnotacion?.anotaciones.some(anotacion => anotacion.cita?.id === cita.id);
  }

  nombreCompleto(persona?: { nombres?: string; apellidos?: string } | null): string {
    return `${persona?.nombres ?? ''} ${persona?.apellidos ?? ''}`.trim() || 'No informado';
  }

  abrirNuevaHistoria(contenido: TemplateRef<unknown>): void {
    if (this.guardando) {
      return;
    }
    this.formHistoria.reset({ mascotaId: null });
    this.historiaAnotacion = null;
    this.abrirFormulario(contenido, 'formHistoriaTitulo');
    this.cargarCatalogos(forkJoin({ mascotas: this.mascotaService.listarMascotas() }));
  }

  abrirNuevaAnotacion(historia: HistoriaMedica, contenido: TemplateRef<unknown>): void {
    if (this.guardando) {
      return;
    }
    this.historiaAnotacion = historia;
    this.listCitas = [];
    this.anotacionesForm.clear();
    this.anotacionesForm.push(this.crearFilaAnotacion());

    const mascotaId = historia.historia.mascota?.mascotaId;
    if (mascotaId == null) {
      this.errorCatalogos = 'La historia no tiene una mascota asociada para consultar sus citas.';
      return;
    }
    this.cargarCatalogos(forkJoin({ citas: this.citaService.listarCitasPorMascota(mascotaId) }));
    this.abrirFormulario(contenido, 'formAnotacionTitulo');
  }

  cerrarFormulario(): void {
    if (!this.guardando) {
      this.modalFormulario?.close();
    }
  }

  guardarHistoria(): void {
    if (this.guardando) {
      return;
    }
    this.formHistoria.markAllAsTouched();
    const mascotaId = this.formHistoria.controls.mascotaId.value;
    if (mascotaId == null || !this.mascotasDisponibles.some(mascota => mascota.mascotaId === mascotaId)) {
      this.respuestaError = 'Selecciona una mascota disponible.';
      return;
    }
    const solicitud: HistoriaRq = { mascotaId };
    this.enviar(this.historiaService.crearHistoria(solicitud), 'La historia médica fue creada correctamente.');
  }

  guardarAnotacion(): void {
    if (this.guardando) {
      return;
    }
    this.formAnotacion.markAllAsTouched();
    const historiaId = this.historiaAnotacion?.historia.id;
    const filas = this.anotacionesForm.getRawValue();
    if (this.formAnotacion.invalid || historiaId == null || filas.length === 0) {
      this.respuestaError = 'Completa los campos obligatorios de todas las anotaciones.';
      return;
    }
    const solicitudes: AnotacionHistoriaRq[] = [];
    for (const { medicoId, citaId, descripcion, diagnostico, observaciones } of filas) {
      if (medicoId == null || citaId == null ||
        !this.medicosDeCita(citaId).some(medico => medico.id === medicoId)) {
        this.respuestaError = 'Cada anotación debe tener una cita con su veterinario asignado.';
        return;
      }
      solicitudes.push({
        historiaId, medicoId, citaId, descripcion: descripcion.trim(),
        diagnostico: diagnostico.trim(), observaciones: observaciones.trim()
      });
    }

    // Se guardan en orden; si una falla, se retiran del formulario las ya creadas para no duplicarlas al reintentar.
    let guardadas = 0;
    this.guardando = true;
    this.respuestaError = '';
    from(solicitudes).pipe(
      concatMap(solicitud => this.anotacionHistoriaService.crearAnotacionHistoria(solicitud)),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.guardando = false)
    ).subscribe({
      next: () => guardadas++,
      complete: () => {
        this.guardando = false;
        this.cerrarFormulario();
        this.listarHistorias();
        void Swal.fire('Operación exitosa', guardadas === 1
          ? 'La anotación fue creada correctamente.'
          : `Se crearon ${guardadas} anotaciones correctamente.`, 'success');
      },
      error: error => {
        for (let i = 0; i < guardadas; i++) {
          this.anotacionesForm.removeAt(0);
        }
        const detalle = error?.error?.message || 'No fue posible guardar la anotación. Intenta nuevamente.';
        this.respuestaError = guardadas > 0
          ? `Se guardaron ${guardadas} anotación(es); las restantes no se guardaron: ${detalle}`
          : detalle;
        if (guardadas > 0) {
          this.listarHistorias();
        }
        console.error('Error al guardar anotaciones de historia médica:', error);
      }
    });
  }

  private abrirFormulario(contenido: TemplateRef<unknown>, titulo: string): void {
    this.respuestaError = '';
    const modal = this.modalService.open(contenido, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      ariaLabelledBy: titulo
    });
    this.modalFormulario = modal;
    modal.hidden.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.modalFormulario === modal) {
        this.modalFormulario = undefined;
        this.historiaAnotacion = null;
      }
    });
  }

  private cargarCatalogos(peticion: Observable<{ mascotas?: Mascota[]; citas?: Cita[] }>): void {
    this.cargandoCatalogos = true;
    this.errorCatalogos = '';
    peticion.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargandoCatalogos = false)
    ).subscribe({
      next: ({ mascotas, citas }) => {
        this.listMascotas = mascotas ?? this.listMascotas;
        this.listCitas = citas ?? this.listCitas;
      },
      error: error => {
        this.errorCatalogos = 'No fue posible cargar la información del formulario.';
        console.error('Error al cargar catálogos de historia médica:', error);
      }
    });
  }

  private enviar(solicitud: Observable<unknown>, mensaje: string): void {
    this.guardando = true;
    this.respuestaError = '';
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.guardando = false)
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarFormulario();
        this.listarHistorias();
        void Swal.fire('Operación exitosa', mensaje, 'success');
      },
      error: error => {
        this.respuestaError = error?.error?.message || 'No fue posible guardar la información. Intenta nuevamente.';
        console.error('Error al guardar en historia médica:', error);
      }
    });
  }

  // ----------------------------------------------------------------
  // Flujo Atenci\u00f3n desde Cita
  // ----------------------------------------------------------------

  abrirAtencionDesdeCita(citaId: number): void {
    this.citaService.listarCitas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: citas => {
        const cita = citas.find(c => c.id === citaId);
        if (!cita) { void Swal.fire('Error', 'No se encontr\u00f3 la cita solicitada.', 'error'); return; }
        this.citaAtendida = cita;
        const mascotaId = cita.mascota?.mascotaId;
        this.historiaParaAtencion = mascotaId
          ? (this.listHistorias.find(h => h.historia.mascota?.mascotaId === mascotaId) ?? null)
          : null;
        this.formulasEnAtencion = [];
        this.formAtencionRapida.reset();
        this.errorAtencion = '';
        this.finalizarCita = false;
        this.medicamentoService.listarMedicamentos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: meds => { this.listMedicamentosAtencion = meds; },
          error: () => { this.listMedicamentosAtencion = []; }
        });
        const el = document.getElementById('modalAtencionCita');
        if (el) {
          this.modalAtencionInst = new (window as unknown as WindowBoot).bootstrap.Modal(el, { backdrop: 'static' });
          this.modalAtencionInst.show();
        }
      },
      error: () => void Swal.fire('Error', 'No se pudo cargar la informaci\u00f3n de la cita.', 'error')
    });
  }

  cerrarModalAtencion(): void {
    this.modalAtencionInst?.hide();
    this.citaAtendida = null;
    this.historiaParaAtencion = null;
    this.formulasEnAtencion = [];
    this.errorAtencion = '';
    this.finalizarCita = false;
  }

  /** Stock disponible del medicamento de una fila (0 si no hay). */
  stockDeFila(fila: FilaFormula): number {
    return fila.medicamento?.cantidadActual ?? 0;
  }

  /** Cantidad numérica pedida en la fila (0 si no es un número). */
  cantidadNumerica(fila: FilaFormula): number {
    const n = Number(fila.cantidad);
    return isNaN(n) || n <= 0 ? 0 : n;
  }

  /** true: stock = 0 → no se puede formular. */
  sinStock(fila: FilaFormula): boolean {
    return !!fila.medicamento && this.stockDeFila(fila) <= 0;
  }

  /** true: hay stock pero la cantidad pedida lo supera. */
  excedeCantidad(fila: FilaFormula): boolean {
    const stock = this.stockDeFila(fila);
    const pedido = this.cantidadNumerica(fila);
    return !!fila.medicamento && stock > 0 && pedido > 0 && pedido > stock;
  }

  /** true: alguna fila tiene stock = 0, bloquea guardar. */
  get hayFormulaSinStock(): boolean {
    return this.formulasEnAtencion.some(f => this.sinStock(f));
  }

  agregarFilaFormula(): void {
    this.formulasEnAtencion.push({
      medicamento: null, dosis: '', frecuencia: '', duracion: '',
      cantidad: '', viaAdministracion: '', indicaciones: ''
    });
  }

  quitarFilaFormula(i: number): void {
    this.formulasEnAtencion.splice(i, 1);
  }

  guardarAtencionCompleta(): void {
    this.formAtencionRapida.markAllAsTouched();
    if (this.formAtencionRapida.invalid) {
      this.errorAtencion = 'Completa los campos obligatorios de atenci\u00f3n.';
      return;
    }
    const sinStockFilas = this.formulasEnAtencion.filter(f => this.sinStock(f));
    if (sinStockFilas.length > 0) {
      this.errorAtencion = `Sin stock: ${sinStockFilas.map(f => f.medicamento!.nombre).join(', ')}. Ret\u00edralos antes de guardar.`;
      return;
    }
    const cita = this.citaAtendida!;
    const medicoId = cita.medico?.id;
    if (!medicoId) { this.errorAtencion = 'La cita no tiene m\u00e9dico asignado.'; return; }

    this.guardandoAtencion = true;
    this.errorAtencion = '';

    const historia$ = this.historiaParaAtencion
      ? of(this.historiaParaAtencion.historia)
      : this.historiaService.crearHistoria({ mascotaId: cita.mascota!.mascotaId! });

    historia$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: historia => {
        const rq: AnotacionHistoriaRq = {
          historiaId: historia.id,
          medicoId,
          citaId: cita.id!,
          tipoServicio: this.formAtencionRapida.value.tipoServicio,
          descripcion: this.formAtencionRapida.value.descripcion!.trim(),
          diagnostico: this.formAtencionRapida.value.diagnostico!.trim(),
          observaciones: this.formAtencionRapida.value.observaciones?.trim() ?? ''
        };
        this.anotacionHistoriaService.crearAnotacionHistoria(rq).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            const finalizarYGuardar = () => {
              const validas = this.formulasEnAtencion.filter(f => f.medicamento && f.dosis && f.frecuencia && f.duracion);
              if (validas.length > 0) {
                this.guardarFormulasAtencion(cita, validas);
              } else {
                this.guardandoAtencion = false;
                this.cerrarModalAtencion();
                this.listarHistorias();
                void Swal.fire('\u00c9xito', 'Atenci\u00f3n registrada correctamente.', 'success');
              }
            };
            if (this.finalizarCita) {
              this.citaService.finalizarCita(cita.id!).pipe(
                takeUntilDestroyed(this.destroyRef)
              ).subscribe({
                next: () => finalizarYGuardar(),
                error: () => finalizarYGuardar()
              });
            } else {
              finalizarYGuardar();
            }
          },
          error: err => {
            this.guardandoAtencion = false;
            this.errorAtencion = err?.error?.message ?? 'Error al guardar la anotaci\u00f3n.';
          }
        });
      },
      error: err => {
        this.guardandoAtencion = false;
        this.errorAtencion = err?.error?.message ?? 'Error al preparar la historia cl\u00ednica.';
      }
    });
  }

  private guardarFormulasAtencion(cita: Cita, filas: FilaFormula[]): void {
    let saved = 0;
    from(filas).pipe(
      concatMap(f => this.formulaService.crearFormula({
        cita, citaId: cita.id,
        medicamento: f.medicamento!,
        medicamentoId: f.medicamento!.id,
        dosis: f.dosis, frecuencia: f.frecuencia, duracion: f.duracion,
        cantidad: f.cantidad, viaAdministracion: f.viaAdministracion, indicaciones: f.indicaciones
      })),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.guardandoAtencion = false; })
    ).subscribe({
      next: () => saved++,
      complete: () => {
        this.cerrarModalAtencion();
        this.listarHistorias();
        void Swal.fire('\u00c9xito', `Atenci\u00f3n y ${saved} f\u00f3rmula(s) registradas.`, 'success');
      },
      error: err => {
        this.errorAtencion = err?.error?.message ?? `Atenci\u00f3n guardada. Error en f\u00f3rmulas (${saved} guardada(s)).`;
        this.listarHistorias();
      }
    });
  }

  generarFormulaPDF(): void {
    const cita = this.citaAtendida!;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(13, 110, 253);
    doc.text('CL\u00cdNICA VETERINARIA', 105, 18, { align: 'center' });
    doc.setFontSize(13); doc.setTextColor(0);
    doc.text('F\u00d3RMULA M\u00c9DICA', 105, 26, { align: 'center' });
    doc.setDrawColor(200); doc.line(14, 30, 196, 30);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 38);
    doc.text(`Paciente: ${cita.mascota?.nombreMascota ?? cita.mascota?.nombre ?? ''}`, 14, 44);
    doc.text(`Propietario: ${this.nombreCompleto(cita.cliente ?? cita.mascota?.cliente)}`, 14, 50);
    doc.text(`M\u00e9dico: Dr/a. ${this.nombreCompleto(cita.medico)}`, 110, 38);
    doc.text(`Cita No.: ${cita.id}`, 110, 44);
    doc.line(14, 54, 196, 54);
    const rows = this.formulasEnAtencion.filter(f => f.medicamento).map(f => [
      f.medicamento!.nombre,
      `Stock: ${f.medicamento!.cantidadActual ?? 0}`,
      f.dosis || '\u2014', f.frecuencia || '\u2014', f.duracion || '\u2014',
      f.viaAdministracion || '\u2014', f.cantidad || '\u2014', f.indicaciones || '\u2014'
    ]);
    autoTable(doc, {
      startY: 58,
      head: [['Medicamento', 'Disponibilidad', 'Dosis', 'Frecuencia', 'Duraci\u00f3n', 'V\u00eda', 'Cantidad', 'Indicaciones']],
      body: rows, theme: 'striped',
      headStyles: { fillColor: [13, 110, 253] }, styles: { fontSize: 7 }
    });
    doc.save(`Formula-Cita${cita.id}-${Date.now()}.pdf`);
  }

  generarPrefacturaPDF(): void {
    const cita = this.citaAtendida!;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(40, 167, 69);
    doc.text('CL\u00cdNICA VETERINARIA', 105, 18, { align: 'center' });
    doc.setFontSize(13); doc.setTextColor(0);
    doc.text('PRE-FACTURA DE SERVICIOS', 105, 26, { align: 'center' });
    doc.setDrawColor(200); doc.line(14, 30, 196, 30);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 38);
    doc.text(`Cita No.: ${cita.id} \u2014 ${cita.fechaHora ? new Date(cita.fechaHora).toLocaleDateString('es-CO') : ''}`, 14, 44);
    doc.text(`Paciente: ${cita.mascota?.nombreMascota ?? cita.mascota?.nombre ?? ''}`, 14, 50);
    doc.text(`Propietario: ${this.nombreCompleto(cita.cliente ?? cita.mascota?.cliente)}`, 110, 38);
    doc.text(`M\u00e9dico: Dr/a. ${this.nombreCompleto(cita.medico)}`, 110, 44);
    doc.line(14, 54, 196, 54);
    const servicios: string[][] = [['Consulta veterinaria', cita.motivo ?? 'General', '1', 'Ver tarifa']];
    const medicamentos: string[][] = this.formulasEnAtencion.filter(f => f.medicamento).map(f => [
      `Medicamento: ${f.medicamento!.nombre}`,
      f.medicamento!.presentacion ?? '',
      f.cantidad || '1',
      f.medicamento!.precioVenta != null ? `$${f.medicamento!.precioVenta.toLocaleString('es-CO')}` : 'Ver precio'
    ]);
    autoTable(doc, {
      startY: 58,
      head: [['Descripci\u00f3n', 'Detalle', 'Cant.', 'Precio unit.']],
      body: [...servicios, ...medicamentos], theme: 'striped',
      headStyles: { fillColor: [40, 167, 69] }, styles: { fontSize: 9 }
    });
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8); doc.setTextColor(120);
    doc.text('* Prefactura estimada. Valores finales se confirman al momento de facturaci\u00f3n.', 14, y);
    doc.save(`Prefactura-Cita${cita.id}-${Date.now()}.pdf`);
  }

  private normalizarTexto(texto: string): string {
    return texto.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
