import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, formatDate } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import Swal from 'sweetalert2';
import { getJwtPayload } from 'src/app/utils/jwt.util';
import { rolPuedeAcceder } from 'src/app/constants/role-permissions';
import { Cita } from 'src/app/models/cita';
import { CitaService } from './service/cita.service';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { Cliente } from 'src/app/models/cliente';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { ClienteService } from '../cliente/service/cliente.service';

type ColumnaOrden = 'mascota' | 'medico' | 'fechaHora' | 'motivo' | 'estado';
type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (element: Element) => ModalBootstrap } };



interface DiaCal {
  fecha: Date;
  esDelMes: boolean;
  esHoy: boolean;
  citas: Cita[];
}

@Component({
  selector: 'app-cita',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbTooltipModule],
  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent implements OnInit {

  // Variables para el modal.
  modalInstance: ModalBootstrap | null = null;
  modalDetalleInstance: ModalBootstrap | null = null;
  citaDetalle: Cita | null = null;
  titleModal: string = "";
  modoFormulario: string = "";
  titleBoton: string = "";

  // Vista
  vistaActual: 'tabla' | 'mes' | 'semana' | 'dia' = 'tabla';

  // Calendario – mes
  mesActual = new Date();
  semanas: DiaCal[][] = [];

  // Calendario – semana
  semanaActual: Date = new Date();
  semanaGrid: { dia: DiaCal; horas: Cita[][] }[] = [];

  // Calendario – día
  diaActual: Date = new Date();
  diaGrid: Cita[][] = [];

  readonly DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly DIAS_SEMANA_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  readonly MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  readonly HORAS = Array.from({ length: 18 }, (_, i) => i + 5); // 05..22
  medicoFiltroId: number | null = null;
  listTodosMedicos: Medico[] = [];

  // Variables para la paginación, ordenamiento y búsqueda en la datatable.
  listEspecializaciones: Cita[] = [];
  listMascotas: Mascota[] = [];
  listMedicos: Medico[] = [];
  listClientes: Cliente[] = [];
  clienteSeleccionadoId: number | null = null;
  cargandoMascotas = false;
  cargandoMedicos = false;
  cargandoClientes = false;
  errorMascotas = '';
  errorMedicos = '';
  errorClientes = '';
  errorCitas = '';
  disponibilidadConsultada = false;
  private consultaMedicos?: Subscription;
  private readonly destroyRef = inject(DestroyRef);
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'mascota';
  direccionOrden: 'asc' | 'desc' = 'asc';

  // Formulario para crear o editar especializacion.
  form!: FormGroup;
  citaSelected: Cita | null = null;
  enviando = false;
  respuestaError = '';

  constructor(private readonly citaService: CitaService,
    private readonly formBuilder: FormBuilder,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoService,
    private readonly clienteService: ClienteService,
    private readonly router: Router) {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.semanaActual = this.calcularInicioSemana(new Date());
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    this.diaActual = hoy;
    this.listarCitas();
    this.listarMascotas();
    this.listarClientes();
    this.cargarMedicosParaFiltro();
  }

  inicializarFormulario() {
    this.form = this.formBuilder.group({
      mascota: [null, Validators.required],
      medico: [null, Validators.required],
      fechaHora: [null, [
        Validators.required,
        (control: AbstractControl) => control.value && Number.isNaN(new Date(control.value).getTime())
          ? { fechaInvalida: true } : null
      ]],
      motivo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(255)]],
      estado: ['', Validators.required],
    });
    this.form.controls['fechaHora'].valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.consultaMedicos?.unsubscribe();
      this.cargandoMedicos = false;
      this.disponibilidadConsultada = false;
      this.errorMedicos = '';
      this.listMedicos = [];
      this.form.controls['medico'].reset();
    });
  }

  /** medicoId del usuario logueado si su rol es Medico; null en otro caso. */
  private get medicoIdDelUsuario(): number | null {
    const payload = getJwtPayload();
    if (!payload) return null;
    const rolNorm = payload.rol.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return rolNorm === 'medico' ? payload.medicoId : null;
  }

  listarCitas() {
    this.errorCitas = '';
    const medicoId = this.medicoIdDelUsuario;
    const obs$ = medicoId
      ? this.citaService.listarCitasPorMedico(medicoId)
      : this.citaService.listarCitas();
    obs$.subscribe({
      next: (citas) => {
        this.listEspecializaciones = citas;
        this.paginaActual = Math.min(this.paginaActual, this.totalPaginas || 1);
      },
      error: (err) => {
        this.errorCitas = 'No fue posible cargar las citas.';
        console.error('Error al listar citas:', err);
      }
    });
  }

  // Carga todas las citas (sin rango) para vistas semana y día — filtrado client-side
  listarTodasLasCitas(): void {
    const medicoId = this.medicoIdDelUsuario;
    const obs$ = medicoId
      ? this.citaService.listarCitasPorMedico(medicoId)
      : this.citaService.listarCitas();
    obs$.subscribe({
      next: (citas) => { this.listEspecializaciones = citas; },
      error: () => {}
    });
  }

  listarMascotas(): void {
    this.cargandoMascotas = true;
    this.errorMascotas = '';
    this.mascotaService.listarMascotas().subscribe({
      next: (mascotas) => {
        this.listMascotas = mascotas;
        this.cargandoMascotas = false;
      },
      error: (error) => {
        this.cargandoMascotas = false;
        this.errorMascotas = 'No fue posible cargar las mascotas.';
        console.error('Error al listar mascotas:', error);
      }
    });
  }

  listarClientes(): void {
    this.cargandoClientes = true;
    this.errorClientes = '';
    this.clienteService.listarClientes().subscribe({
      next: (clientes) => {
        this.listClientes = clientes;
        this.cargandoClientes = false;
      },
      error: (error) => {
        this.cargandoClientes = false;
        this.errorClientes = 'No fue posible cargar los clientes.';
        console.error('Error al listar clientes:', error);
      }
    });
  }

  get mascotasPorCliente(): Mascota[] {
    if (!this.clienteSeleccionadoId) return this.listMascotas;
    return this.listMascotas.filter(m =>
      m.cliente?.id === this.clienteSeleccionadoId ||
      m.clienteId === this.clienteSeleccionadoId
    );
  }

  onClienteChange(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.clienteSeleccionadoId = valor ? +valor : null;
    this.form.controls['mascota'].reset();
  }

  get fechaInicio(): Date | null {
    const control = this.form.controls['fechaHora'];
    return control.valid && control.value ? new Date(control.value) : null;
  }

  get fechaFin(): Date | null {
    const inicio = this.fechaInicio;
    return inicio ? new Date(inicio.getTime() + 15 * 60 * 1000) : null;
  }

  consultarMedicosDisponibles(): void {
    const inicio = this.fechaInicio;
    const fin = this.fechaFin;
    if (!inicio || !fin) {
      this.form.controls['fechaHora'].markAsTouched();
      return;
    }
    if (this.cargandoMedicos || this.enviando) {
      return;
    }
    this.listarMedicosDisponiblesPorFecha(inicio, fin);
  }

  listarMedicosDisponiblesPorFecha(fechaInicio: Date, fechaFin: Date): void {
    this.consultaMedicos?.unsubscribe();
    this.listMedicos = [];
    this.form.controls['medico'].reset();
    this.disponibilidadConsultada = false;
    this.cargandoMedicos = true;
    this.errorMedicos = '';
    this.consultaMedicos = this.medicoService
      .listarMedicosDisponiblesPorFecha(fechaInicio, fechaFin)
      .pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (medicos) => {
        this.listMedicos = medicos;
        this.cargandoMedicos = false;
        this.disponibilidadConsultada = true;
      },
      error: (error) => {
        this.cargandoMedicos = false;
        this.errorMedicos = 'No fue posible cargar los médicos disponibles.';
        console.error('Error al listar médicos disponibles:', error);
      }
    });
  }

  compararMascotas(mascotaA: Mascota | null, mascotaB: Mascota | null): boolean {
    return mascotaA === mascotaB ||
      (mascotaA?.mascotaId != null && mascotaA.mascotaId === mascotaB?.mascotaId);
  }

  compararMedicos(medicoA: Medico | null, medicoB: Medico | null): boolean {
    return medicoA === medicoB || (medicoA?.id != null && medicoA.id === medicoB?.id);
  }

  // Obtiene los controles del formulario para facilitar el acceso a sus propiedades y métodos.
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Filtra la lista de citas según el término de búsqueda ingresado por el usuario.
   * @returns Un arreglo de citas filtradas.
   */
  get citasFiltradas(): Cita[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filtradas = this.listEspecializaciones.filter((cita) => {
      if (!termino) {
        return true;
      }

      const valores = [
        this.obtenerValorOrden(cita, 'mascota'),
        this.obtenerValorOrden(cita, 'medico'),
        this.obtenerValorOrden(cita, 'fechaHora'),
        cita.motivo,
        cita.estado
      ];

      return valores.some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return [...filtradas].sort((citaA, citaB) => {
      const valorA = this.obtenerValorOrden(citaA, this.columnaOrden);
      const valorB = this.obtenerValorOrden(citaB, this.columnaOrden);
      const comparacion = typeof valorA === 'number' && typeof valorB === 'number'
        ? valorA - valorB
        : String(valorA).localeCompare(String(valorB), 'es', { numeric: true, sensitivity: 'base' });

      return this.direccionOrden === 'asc' ? comparacion : -comparacion;
    });
  }

  private obtenerValorOrden(cita: Cita, columna: ColumnaOrden): string | number {
    switch (columna) {
      case 'mascota':
        return cita.mascota?.nombreMascota ?? cita.mascota?.nombre ?? '';
      case 'medico':
        return  `${cita.medico?.nombres ?? ''} ${cita.medico?.apellidos ?? ''}`;
      case 'fechaHora':
        return cita.fechaHora ? formatDate(cita.fechaHora, 'yyyy-MM-dd HH:mm', 'en-US')
          : '';
      case 'motivo':
        return cita.motivo ?? '';
      case 'estado':
        return cita.estado ?? '';
    }
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

  get citasPaginadas(): Cita[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.citasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.citasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  // Metodo que actualiza el termino de busqueda y reinicia la pagina actual a 1.
  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  // Cambia paginacion.
  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // Metodo privado para normalizar el texto, eliminando acentos y convirtiendo a minúsculas.
  private normalizarTexto(texto: string): string {
    return texto
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

   /**
     * Metodos para la gestion de especializaciones (crear, editar, guardar).
     */
  
    // Evento para abrir el modal de crear o editar especializacion, dependiendo del modo recibido.
    nuevaCita(modo: string) {
      this.titleModal = modo === 'C' ? 'Crear Cita' : 'Editar Cita';
      this.modoFormulario = modo;
      this.citaSelected = null;
      this.resetFormulario();
      this.form.controls['estado'].setValue('programada');
      this.openModal(modo);
    }  
   
  
    verCita(cita: Cita): void {
      this.citaDetalle = cita;
      const modalElement = document.getElementById('modalVerCita');
      if (modalElement) {
        this.modalDetalleInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(modalElement);
        this.modalDetalleInstance.show();
      }
    }

    cerrarDetalle(): void {
      this.modalDetalleInstance?.hide();
    }

    iniciarAtencion(cita: Cita): void {
      this.cerrarDetalle();
      this.router.navigate(['/inicio/historias'], { queryParams: { citaId: cita.id } });
    }

    esCitaCancelada(cita: Cita | null): boolean {
      return cita?.estado?.trim().toLowerCase() === 'cancelada';
    }

    esCitaFinalizada(cita: Cita | null): boolean {
      return cita?.estado?.trim().toUpperCase() === 'FINALIZADA';
    }

    abrirEdicion(cita: Cita) {
      if (this.esCitaCancelada(cita)) {
        Swal.fire('Cita cancelada', 'No se puede editar una cita cancelada.', 'warning');
        return;
      }
      this.resetFormulario();
      this.citaSelected = cita;
      this.modoFormulario = 'E';
      this.clienteSeleccionadoId = cita.mascota?.cliente?.id ?? cita.mascota?.clienteId ?? null;
      this.form.patchValue({
        fechaHora: cita.fechaHora ? formatDate(cita.fechaHora, "yyyy-MM-dd'T'HH:mm", 'en-US') : null,
        mascota: cita.mascota,
        medico: cita.medico,
        motivo: cita.motivo ?? null,
        estado: cita.estado?.trim().toLowerCase() ?? null
      });
      this.listMedicos = cita.medico ? [cita.medico] : [];
      this.openModal(this.modoFormulario);
    }
  
    /**
     * 
     * @returns Acción realizada sobre la cita (crear o actualizar).
     */
    guardarCita() {
      if (this.modoFormulario === 'E' && this.esCitaCancelada(this.citaSelected)) {
        this.respuestaError = 'No se puede actualizar una cita cancelada.';
        return;
      }
      if (this.form.invalid || this.enviando) {
        this.form.markAllAsTouched();
        return;
      }
  
      const valores = this.form.getRawValue();
      const cita: Cita = {
        id: this.citaSelected?.id,
        mascotaId: valores.mascota.mascotaId,
        medicoId: valores.medico.id,
        fechaHora: valores.fechaHora,
        motivo: valores.motivo ?? null,
        estado: this.modoFormulario === 'C' ? 'programada' : valores.estado
      };
  
      this.enviando = true;
      this.respuestaError = '';
      const solicitud = this.modoFormulario === 'C'
        ? this.citaService.guardarCita(cita)
        : this.citaService.actualizarCita(cita);
  
      solicitud.subscribe({
        next: (respuesta) => {
          this.enviando = false;
          const mensaje = this.obtenerMensajeRespuesta(
            respuesta,
            this.modoFormulario === 'C' ? 'La cita fue creada correctamente.' : 'La cita fue actualizada correctamente.'
          );
          this.closeModal();
          this.listarCitas();
          Swal.fire('Operación exitosa', mensaje, 'success');
        },
        error: (error) => {
          this.enviando = false;
          console.error('Error al guardar la cita:', error);
          this.respuestaError = error.error?.mensaje ?? error.error?.message ?? error.message ??
            'No fue posible guardar la cita.';
        }
      });
    }
  
    private obtenerMensajeRespuesta(respuesta: unknown, mensajePredeterminado: string): string {
      if (respuesta && typeof respuesta === 'object') {
        const cuerpo = respuesta as { mensaje?: unknown; message?: unknown };
        const mensaje = cuerpo.mensaje ?? cuerpo.message;
        if (typeof mensaje === 'string') {
          return mensaje;
        }
      }
      return mensajePredeterminado;
    }


  resetFormulario() {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.clienteSeleccionadoId = null;
    this.respuestaError = '';
  }


  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.resetFormulario();
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Cita' : 'Editar Cita';
    this.titleBoton = modo === 'C' ? 'Guardar Cita' : 'Actualizar Cita';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearCita');
    if (modalElement) {
      this.modalInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  // ── Vista / toggle ────────────────────────────────────────────────────────

  cambiarVista(v: 'tabla' | 'mes' | 'semana' | 'dia'): void {
    this.vistaActual = v;
    if (v === 'tabla') {
      this.listarCitas();
    } else if (v === 'mes') {
      this.mesActual = new Date(); this.mesActual.setDate(1);
      this.cargarCitasCalendario();
    } else if (v === 'semana') {
      this.semanaActual = this.calcularInicioSemana(new Date());
      this.cargarCitasCalendario();
    } else {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      this.diaActual = hoy;
      this.cargarCitasCalendario();
    }
  }

  // ── Calendario ────────────────────────────────────────────────────────────

  cargarMedicosParaFiltro(): void {
    this.medicoService.listar().subscribe({
      next: m => { this.listTodosMedicos = m; },
      error: () => {}
    });
  }

  get tituloMes(): string {
    return `${this.MESES[this.mesActual.getMonth()]} ${this.mesActual.getFullYear()}`;
  }

  get tituloSemana(): string {
    const ini = this.semanaActual;
    const fin = new Date(ini); fin.setDate(fin.getDate() + 6);
    if (ini.getMonth() === fin.getMonth())
      return `${ini.getDate()}–${fin.getDate()} de ${this.MESES[ini.getMonth()]} ${ini.getFullYear()}`;
    return `${ini.getDate()} ${this.MESES[ini.getMonth()].substring(0,3)} – ${fin.getDate()} ${this.MESES[fin.getMonth()].substring(0,3)} ${fin.getFullYear()}`;
  }

  get tituloDia(): string {
    const esHoy = this.diaActual.toDateString() === new Date().toDateString();
    const pre = esHoy ? 'Hoy · ' : '';
    return `${pre}${this.DIAS_SEMANA_LARGO[this.diaActual.getDay()]} ${this.diaActual.getDate()} de ${this.MESES[this.diaActual.getMonth()]} ${this.diaActual.getFullYear()}`;
  }

  get diasDeSemana(): DiaCal[] {
    const hoy = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const f = new Date(this.semanaActual);
      f.setDate(f.getDate() + i);
      const citas = this.citasDeHoraYDiaBase(f).sort(
        (a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
      return { fecha: f, esDelMes: true, esHoy: f.toDateString() === hoy.toDateString(), citas };
    });
  }

  // Devuelve las citas de una fecha (aplicando filtro médico si aplica)
  private citasDeHoraYDiaBase(fecha: Date): Cita[] {
    return this.listEspecializaciones.filter(c => {
      if (this.medicoFiltroId && c.medico?.id !== this.medicoFiltroId) return false;
      const f = new Date(c.fechaHora);
      return f.getFullYear() === fecha.getFullYear() &&
             f.getMonth() === fecha.getMonth() &&
             f.getDate() === fecha.getDate();
    });
  }

  citasDeHoraYDia(hora: number, fecha: Date): Cita[] {
    return this.citasDeHoraYDiaBase(fecha).filter(c => new Date(c.fechaHora).getHours() === hora);
  }

  private calcularInicioSemana(d: Date): Date {
    const r = new Date(d);
    const dia = r.getDay();
    r.setDate(r.getDate() + (dia === 0 ? -6 : 1 - dia));
    r.setHours(0, 0, 0, 0);
    return r;
  }

  mesAnterior(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.cargarCitasCalendario();
  }

  mesSiguiente(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.cargarCitasCalendario();
  }

  construirSemana(): void {
    const hoy = new Date();
    this.semanaGrid = Array.from({ length: 7 }, (_, i) => {
      const f = new Date(this.semanaActual);
      f.setDate(f.getDate() + i);
      const diaBase = this.listEspecializaciones.filter(c => {
        if (this.medicoFiltroId && c.medico?.id !== this.medicoFiltroId) return false;
        const cf = new Date(c.fechaHora);
        return cf.getFullYear() === f.getFullYear() &&
               cf.getMonth() === f.getMonth() &&
               cf.getDate() === f.getDate();
      });
      const dia: DiaCal = { fecha: f, esDelMes: true, esHoy: f.toDateString() === hoy.toDateString(), citas: diaBase };
      const horas = this.HORAS.map(hora => diaBase.filter(c => new Date(c.fechaHora).getHours() === hora));
      return { dia, horas };
    });
  }

  construirDia(): void {
    const f = this.diaActual;
    const diaBase = this.listEspecializaciones.filter(c => {
      if (this.medicoFiltroId && c.medico?.id !== this.medicoFiltroId) return false;
      const cf = new Date(c.fechaHora);
      return cf.getFullYear() === f.getFullYear() &&
             cf.getMonth() === f.getMonth() &&
             cf.getDate() === f.getDate();
    });
    this.diaGrid = this.HORAS.map(hora => diaBase.filter(c => new Date(c.fechaHora).getHours() === hora));
  }

  semanaAnterior(): void {
    const s = new Date(this.semanaActual); s.setDate(s.getDate() - 7);
    this.semanaActual = s;
    this.cargarCitasCalendario();
  }

  semanaSiguiente(): void {
    const s = new Date(this.semanaActual); s.setDate(s.getDate() + 7);
    this.semanaActual = s;
    this.cargarCitasCalendario();
  }

  diaAnterior(): void {
    const d = new Date(this.diaActual); d.setDate(d.getDate() - 1);
    this.diaActual = d;
    this.cargarCitasCalendario();
  }

  diaSiguiente(): void {
    const d = new Date(this.diaActual); d.setDate(d.getDate() + 1);
    this.diaActual = d;
    this.cargarCitasCalendario();
  }

  irAHoy(): void {
    if (this.vistaActual === 'mes') {
      this.mesActual = new Date(); this.mesActual.setDate(1);
    } else if (this.vistaActual === 'semana') {
      this.semanaActual = this.calcularInicioSemana(new Date());
    } else {
      const h = new Date(); h.setHours(0, 0, 0, 0); this.diaActual = h;
    }
    this.cargarCitasCalendario();
  }

  onFiltroMedicoChange(): void {
    if (this.vistaActual === 'mes') {
      this.cargarCitasCalendario();
    } else if (this.vistaActual === 'semana') {
      this.construirSemana();
    } else if (this.vistaActual === 'dia') {
      this.construirDia();
    }
  }

  cargarCitasCalendario(): void {
    let inicio: Date, fin: Date;
    if (this.vistaActual === 'semana') {
      inicio = new Date(this.semanaActual);
      fin = new Date(this.semanaActual); fin.setDate(fin.getDate() + 6); fin.setHours(23, 59, 59);
    } else if (this.vistaActual === 'dia') {
      inicio = new Date(this.diaActual); inicio.setHours(0, 0, 0, 0);
      fin = new Date(this.diaActual); fin.setHours(23, 59, 59);
    } else {
      inicio = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1);
      fin = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0, 23, 59, 59);
    }

    // Si el usuario es Médico, forzar filtro por su medicoId (ignorar el filtro manual si es distinto)
    const medicoIdForzado = this.medicoIdDelUsuario;
    const medicoEfectivo = medicoIdForzado ?? this.medicoFiltroId;
    const obs = medicoEfectivo
      ? this.citaService.listarCitasPorMedicoYRango(medicoEfectivo, this.toIso(inicio), this.toIso(fin))
      : this.citaService.listarCitasRango(this.toIso(inicio), this.toIso(fin));

    obs.subscribe({
      next: citas => {
        this.listEspecializaciones = citas;
        if (this.vistaActual === 'mes') this.construirCalendario();
        else if (this.vistaActual === 'semana') this.construirSemana();
        else if (this.vistaActual === 'dia') this.construirDia();
      },
      error: () => {
        if (this.vistaActual === 'mes') this.construirCalendario();
        else if (this.vistaActual === 'semana') this.construirSemana();
        else if (this.vistaActual === 'dia') this.construirDia();
      }
    });
  }

  construirCalendario(): void {
    const ano = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();
    const hoy = new Date();

    const primerDia = new Date(ano, mes, 1);
    // ISO week: lunes=0 ... domingo=6
    let offsetLunes = (primerDia.getDay() + 6) % 7;

    const dias: DiaCal[] = [];
    // Días del mes anterior
    for (let i = offsetLunes - 1; i >= 0; i--) {
      const f = new Date(ano, mes, -i);
      dias.push({ fecha: f, esDelMes: false, esHoy: false, citas: [] });
    }
    // Días del mes actual
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    for (let d = 1; d <= ultimoDia; d++) {
      const f = new Date(ano, mes, d);
      const esHoy = f.toDateString() === hoy.toDateString();
      const citas = this.citasDelDia(f);
      dias.push({ fecha: f, esDelMes: true, esHoy, citas });
    }
    // Completar última semana
    while (dias.length % 7 !== 0) {
      const f = new Date(ano, mes + 1, dias.length - offsetLunes - ultimoDia + 1);
      dias.push({ fecha: f, esDelMes: false, esHoy: false, citas: [] });
    }

    this.semanas = [];
    for (let i = 0; i < dias.length; i += 7) {
      this.semanas.push(dias.slice(i, i + 7));
    }
  }

  private citasDelDia(fecha: Date): Cita[] {
    return this.listEspecializaciones.filter(c => {
      const f = new Date(c.fechaHora);
      return f.getFullYear() === fecha.getFullYear() &&
             f.getMonth() === fecha.getMonth() &&
             f.getDate() === fecha.getDate();
    });
  }

  private toIso(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  badgeCita(estado: string): string {
    const e = estado?.trim().toLowerCase();
    if (e === 'programada') return 'bg-primary';
    if (e === 'confirmada') return 'bg-success';
    if (e === 'cancelada') return 'bg-danger';
    return 'bg-secondary';
  }

  verCitaCalendario(cita: Cita): void {
    this.verCita(cita);
  }

  // ── Exportar CSV ──────────────────────────────────────────────────────────

  exportarCSV(): void {
    const filas = [
      ['ID', 'Mascota', 'Cliente', 'Médico', 'Fecha/Hora', 'Estado', 'Motivo'],
      ...this.citasFiltradas.map(c => [
        String(c.id ?? ''),
        c.mascota?.nombreMascota ?? c.mascota?.nombre ?? '',
        `${c.mascota?.cliente?.nombres ?? ''} ${c.mascota?.cliente?.apellidos ?? ''}`.trim(),
        `${c.medico?.nombres ?? ''} ${c.medico?.apellidos ?? ''}`.trim(),
        c.fechaHora ? formatDate(c.fechaHora, 'yyyy-MM-dd HH:mm', 'es') : '',
        c.estado ?? '',
        c.motivo ?? ''
      ])
    ];
    const csv = '﻿' + filas.map(f => f.map(v => `"${v.replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citas_${formatDate(new Date(), 'yyyyMMdd_HHmm', 'es')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

}
