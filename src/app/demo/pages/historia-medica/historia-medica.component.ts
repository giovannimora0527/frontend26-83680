import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { AnotacionHistoriaRq } from 'src/app/models/anotacion-historia-rq';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { FormulaMedicaRq } from 'src/app/models/formula-medica-rq';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { HistoriaMedicaRq } from 'src/app/models/historia-medica-rq';
import { Mascota } from 'src/app/models/mascota';
import { Medicamento } from 'src/app/models/medicamento';
import { Medico } from 'src/app/models/medico';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { ClienteService } from 'src/app/services/cliente.service';
import { mostrarAdvertencia, mostrarError, mostrarExito } from 'src/app/utils/mensajes-utils';
import { compararValores, estaEnRangoFechas, fechaHoy, nombreCompleto, normalizarTexto, textoEstado } from 'src/app/utils/tabla-utils';
import { AnotacionHistoriaService } from '../anotacion-historia/service/anotacion-historia.service';
import { CitaService } from '../cita/service/cita.service';
import { FormulaMedicaService } from '../formula-medica/service/formula-medica.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicamentoService } from '../medicamento/service/medicamento.service';
import { MedicoService } from '../medico/service/medico.service';
import { HistoriaMedicaService } from './service/historia-medica.service';

@Component({
  selector: 'app-historia-medica',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './historia-medica.component.html',
  styleUrl: './historia-medica.component.scss'
})
export class HistoriaMedicaComponent {
  // Instancias de modales Bootstrap
  modalInstance: Modal | null = null;
  modalDetalleInstance: Modal | null = null;
  titleModal = '';
  modoFormulario = '';
  titleBoton = '';

  // Estados de una historia clínica: abierta recibe anotaciones y fórmulas, cerrada ya no se modifica
  readonly estados = ['ABIERTA', 'CERRADA'];
  readonly frecuenciasSugeridas = [
    'Cada 6 horas (4 veces al día)',
    'Cada 8 horas (3 veces al día)',
    'Cada 12 horas (2 veces al día)',
    'Cada 24 horas (1 vez al día)',
    'Cada 48 horas',
    'Dosis única'
  ];

  // Variables para la paginación, búsqueda, filtros y ordenamiento de la datatable
  listHistorias: HistoriaMedica[] = [];
  terminoBusqueda = '';
  filtroEstado = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  campoOrden = 'fechaHora';
  ordenAscendente = false;
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  cargando = false;
  guardando = false;

  // Listas para los combos dependientes: Cliente -> Mascotas del cliente -> Citas de la mascota
  listClientes: Cliente[] = [];
  listMascotas: Mascota[] = [];
  listCitas: Cita[] = [];
  listMedicos: Medico[] = [];
  listMedicamentos: Medicamento[] = [];

  // Formulario para crear o editar atención médica (historia)
  form!: FormGroup;
  formFormulaItem!: FormGroup;
  historiaSelected: HistoriaMedica | null = null;
  formulasBorrador: Array<FormulaMedicaRq & { nombreMedicamento?: string; presentacion?: string }> = [];

  // Variables del detalle (Ver), fórmulas de la atención e historial de anotaciones
  historiaDetalle: HistoriaMedica | null = null;
  listFormulasHistoria: FormulaMedica[] = [];
  cargandoFormulasHistoria = false;
  mostrarFormNuevaFormulaDetalle = false;
  guardandoFormulaDetalle = false;

  listAnotaciones: AnotacionHistoria[] = [];
  anotacionSelected: AnotacionHistoria | null = null;
  terminoAnotacion = '';
  anotacionesAscendente = false;
  paginaAnotacion = 1;
  readonly anotacionesPorPagina = 5;
  cargandoAnotaciones = false;
  guardandoAnotacion = false;
  mostrarFormAnotacion = false;
  formAnotacion!: FormGroup;

  // Funciones de utilidad expuestas a la plantilla
  readonly nombreCompleto = nombreCompleto;
  readonly textoEstado = textoEstado;

  constructor(
    private readonly historiaService: HistoriaMedicaService,
    private readonly anotacionService: AnotacionHistoriaService,
    private readonly formulaService: FormulaMedicaService,
    private readonly medicamentoService: MedicamentoService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly citaService: CitaService,
    private readonly medicoService: MedicoService,
    private readonly formBuilder: FormBuilder
  ) {
    this.inicializarFormulario();
    this.inicializarFormularioFormulaItem();
    this.inicializarFormularioAnotacion();
    this.listar();
    this.cargarCombos();
  }

  inicializarFormulario() {
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [null, Validators.required],
      citaId: [null, Validators.required],
      medicoId: [null, Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      diagnostico: ['', [Validators.required, Validators.maxLength(2000)]],
      observaciones: ['', Validators.maxLength(2000)],
      estado: ['ABIERTA', Validators.required]
    });

    // Combos dependientes: cliente -> mascotas -> citas
    this.form.get('clienteId')?.valueChanges.subscribe((clienteId) => {
      this.cargarMascotasCliente(clienteId);
    });
    this.form.get('mascotaId')?.valueChanges.subscribe((mascotaId) => {
      this.cargarCitasMascota(mascotaId);
    });
    // Al elegir la cita se proponen el veterinario, la fecha, la hora y el motivo de esa cita
    this.form.get('citaId')?.valueChanges.subscribe((citaId) => {
      const cita = this.listCitas.find((item) => item.id === citaId);
      if (cita) {
        this.form.patchValue({
          medicoId: cita.medico?.id,
          fecha: String(cita.fechaHora).substring(0, 10),
          hora: String(cita.fechaHora).substring(11, 16),
          motivo: cita.motivo
        });
      }
    });
  }

  inicializarFormularioFormulaItem() {
    this.formFormulaItem = this.formBuilder.group({
      medicamentoId: [null, Validators.required],
      dosis: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\d/)]],
      frecuencia: ['', [Validators.required, Validators.maxLength(100)]],
      duracionDias: [null, [Validators.required, Validators.min(1), Validators.max(365)]],
      cantidadSolicitada: [1, [Validators.required, Validators.min(1)]],
      indicaciones: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  inicializarFormularioAnotacion() {
    this.formAnotacion = this.formBuilder.group({
      medicoId: [null, Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(2000)]],
      observacion: ['', Validators.maxLength(2000)],
      diagnostico: ['', [Validators.required, Validators.maxLength(2000)]]
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  get ff(): { [key: string]: AbstractControl } {
    return this.formFormulaItem.controls;
  }

  get fa(): { [key: string]: AbstractControl } {
    return this.formAnotacion.controls;
  }

  // Medicamento seleccionado en el subformulario de prescripción
  get medicamentoFormulaSeleccionado(): Medicamento | undefined {
    const id = this.formFormulaItem?.getRawValue()?.medicamentoId;
    return this.listMedicamentos.find((m) => m.id === Number(id));
  }

  get cantidadFormulaSugerida(): number | null {
    const raw = this.formFormulaItem?.getRawValue();
    const duracion = Number(raw?.duracionDias);
    if (!duracion || duracion <= 0) {
      return null;
    }
    const freq = String(raw?.frecuencia ?? '').toLowerCase();
    let tomas = 1;
    if (freq.includes('6 hora') || freq.includes('4 veces')) tomas = 4;
    else if (freq.includes('8 hora') || freq.includes('3 veces')) tomas = 3;
    else if (freq.includes('12 hora') || freq.includes('2 veces')) tomas = 2;
    else if (freq.includes('48 hora')) tomas = 0.5;
    else if (freq.includes('unica') || freq.includes('única')) return 1;

    const textoDosis = String(raw?.dosis ?? '').toLowerCase();
    let undPorToma = 1;
    const match = textoDosis.match(/(\d+)\s*(tableta|capsula|cápsula|comprimido|ampolla|sobre|unidad)/);
    if (match) {
      undPorToma = Number(match[1]) || 1;
    }
    return Math.max(1, Math.ceil(undPorToma * tomas * duracion));
  }

  aplicarCantidadFormulaSugerida() {
    const sug = this.cantidadFormulaSugerida;
    if (sug && sug > 0) {
      this.formFormulaItem.get('cantidadSolicitada')?.setValue(sug);
    }
  }

  // Agrega un medicamento prescrito a la lista borrador durante el registro de la atención médica
  agregarFormulaBorrador() {
    if (this.formFormulaItem.invalid) {
      this.formFormulaItem.markAllAsTouched();
      mostrarAdvertencia('Datos de fórmula incompletos', 'Complete medicamento, dosis, frecuencia, duración, cantidad e indicaciones.');
      return;
    }
    const val = this.formFormulaItem.getRawValue();
    const med = this.medicamentoFormulaSeleccionado;
    if (!med) {
      return;
    }
    if (med.activo === false) {
      mostrarAdvertencia('Medicamento inactivo', `El medicamento "${med.nombre}" está inactivo en el inventario.`);
      return;
    }
    if (med.fechaVence && String(med.fechaVence).substring(0, 10) < fechaHoy()) {
      mostrarAdvertencia('Medicamento vencido', `El medicamento "${med.nombre}" está vencido (${med.fechaVence}).`);
      return;
    }
    if (this.formulasBorrador.some((item) => item.medicamentoId === Number(val.medicamentoId))) {
      mostrarAdvertencia('Medicamento duplicado', 'Este medicamento ya fue agregado a la fórmula de esta atención.');
      return;
    }
    const disponible = med.cantidadDisponible ?? 0;
    const solicitada = Number(val.cantidadSolicitada);
    if (solicitada > disponible) {
      mostrarAdvertencia(
        'Inventario insuficiente',
        `Solo hay ${disponible} unidad(es) disponible(s) de "${med.nombre}" y se intentan formular ${solicitada}.`
      );
      return;
    }

    this.formulasBorrador.push({
      medicamentoId: Number(val.medicamentoId),
      dosis: val.dosis.trim(),
      frecuencia: val.frecuencia.trim(),
      duracionDias: Number(val.duracionDias),
      cantidadSolicitada: solicitada,
      indicaciones: val.indicaciones.trim(),
      nombreMedicamento: med.nombre,
      presentacion: med.presentacion
    });

    this.formFormulaItem.reset({ cantidadSolicitada: 1 });
  }

  quitarFormulaBorrador(indice: number) {
    this.formulasBorrador.splice(indice, 1);
  }

  get historiasFiltradas(): HistoriaMedica[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());

    const filtradas = this.listHistorias.filter((historia) => {
      if (this.filtroEstado && historia.estado?.toUpperCase() !== this.filtroEstado) {
        return false;
      }
      if (!estaEnRangoFechas(historia.fechaHora, this.filtroFechaDesde, this.filtroFechaHasta)) {
        return false;
      }
      if (!termino) {
        return true;
      }

      const valores = [
        historia.id,
        historia.mascota?.nombreMascota,
        nombreCompleto(historia.cliente),
        nombreCompleto(historia.medico),
        historia.motivo,
        historia.diagnostico
      ];

      return valores.some((valor) =>
        normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return filtradas.sort((a, b) =>
      compararValores(this.valorOrden(a), this.valorOrden(b), this.ordenAscendente)
    );
  }

  get historiasPaginadas(): HistoriaMedica[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.historiasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.historiasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  get anotacionesFiltradas(): AnotacionHistoria[] {
    const termino = normalizarTexto(this.terminoAnotacion.trim());

    const filtradas = this.listAnotaciones.filter((anotacion) => {
      if (!termino) {
        return true;
      }
      const valores = [
        anotacion.descripcion,
        anotacion.observacion,
        anotacion.diagnostico,
        nombreCompleto(anotacion.medico)
      ];
      return valores.some((valor) =>
        normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return filtradas.sort((a, b) =>
      compararValores(String(a.fecha ?? ''), String(b.fecha ?? ''), this.anotacionesAscendente)
    );
  }

  get anotacionesPaginadas(): AnotacionHistoria[] {
    const inicio = (this.paginaAnotacion - 1) * this.anotacionesPorPagina;
    return this.anotacionesFiltradas.slice(inicio, inicio + this.anotacionesPorPagina);
  }

  get totalPaginasAnotacion(): number {
    return Math.ceil(this.anotacionesFiltradas.length / this.anotacionesPorPagina);
  }

  get paginasAnotacion(): number[] {
    return Array.from({ length: this.totalPaginasAnotacion }, (_, indice) => indice + 1);
  }

  listar() {
    this.cargando = true;
    this.historiaService.listar().subscribe({
      next: (data) => {
        this.listHistorias = data ?? [];
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        mostrarError(error);
      }
    });
  }

  cargarCombos() {
    this.clienteService.listar().subscribe({
      next: (data) => (this.listClientes = data ?? []),
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
    this.medicoService.listar().subscribe({
      next: (data) => (this.listMedicos = data ?? []),
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
    this.cargarMedicamentos();
  }

  cargarMedicamentos() {
    this.medicamentoService.listar().subscribe({
      next: (data) => (this.listMedicamentos = data ?? []),
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  cargarMascotasCliente(clienteId: number | null) {
    this.listMascotas = [];
    this.listCitas = [];
    this.form.patchValue({ mascotaId: null, citaId: null }, { emitEvent: false });
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (data) => (this.listMascotas = data ?? []),
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  // Permite seleccionar citas activas o atendidas de la mascota que aún no tengan atención/historia registrada
  cargarCitasMascota(mascotaId: number | null) {
    this.listCitas = [];
    this.form.get('citaId')?.setValue(null, { emitEvent: false });
    if (!mascotaId) {
      return;
    }
    this.citaService.listarPorMascota(mascotaId).subscribe({
      next: (data) => {
        this.listCitas = (data ?? []).filter((cita) =>
          cita.estado?.toUpperCase() !== 'CANCELADA'
          && !this.listHistorias.some((historia) => historia.cita?.id === cita.id)
        );
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  aplicarFiltros() {
    this.paginaActual = 1;
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.paginaActual = 1;
  }

  ordenarPor(campo: string) {
    if (this.campoOrden === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.campoOrden = campo;
      this.ordenAscendente = true;
    }
    this.paginaActual = 1;
  }

  iconoOrden(campo: string): string {
    if (this.campoOrden !== campo) {
      return 'fa-sort';
    }
    return this.ordenAscendente ? 'fa-sort-up' : 'fa-sort-down';
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  esHistoriaCerrada(historia: HistoriaMedica | null): boolean {
    return historia?.estado?.toUpperCase() === 'CERRADA';
  }

  nuevaHistoria(modo: string) {
    this.historiaSelected = null;
    this.resetFormulario();
    this.cargarMedicamentos();
    this.openModal(modo);
  }

  resetFormulario() {
    this.form.enable({ emitEvent: false });
    this.form.reset({ estado: 'ABIERTA' }, { emitEvent: false });
    this.formFormulaItem.reset({ cantidadSolicitada: 1 }, { emitEvent: false });
    this.formulasBorrador = [];
    this.listMascotas = [];
    this.listCitas = [];
  }

  abrirEdicion(historia: HistoriaMedica) {
    if (!historia.id) {
      return;
    }
    this.historiaService.consultar(historia.id).subscribe({
      next: (data) => {
        this.historiaSelected = data;
        this.resetFormulario();

        this.listMascotas = data.mascota ? [data.mascota] : [];
        this.listCitas = data.cita ? [data.cita] : [];
        this.form.patchValue({
          clienteId: data.cliente?.clienteId,
          mascotaId: data.mascota?.mascotaId,
          citaId: data.cita?.id,
          medicoId: data.medico?.id,
          fecha: String(data.fechaHora).substring(0, 10),
          hora: String(data.fechaHora).substring(11, 16),
          motivo: data.motivo,
          diagnostico: data.diagnostico,
          observaciones: data.observaciones,
          estado: data.estado?.toUpperCase()
        }, { emitEvent: false });

        ['clienteId', 'mascotaId', 'citaId', 'medicoId', 'fecha', 'hora', 'motivo'].forEach((campo) => {
          this.form.get(campo)?.disable({ emitEvent: false });
        });
        if (this.esHistoriaCerrada(data)) {
          this.form.disable({ emitEvent: false });
        }
        this.openModal('E');
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      mostrarAdvertencia('Campos obligatorios', 'Por favor diligencie todos los campos marcados con *.');
      return;
    }

    const datos = this.form.getRawValue();
    const fechaHora = `${datos.fecha}T${datos.hora}:00`;

    const cita = this.listCitas.find((item) => item.id === datos.citaId);
    if (this.modoFormulario === 'C' && cita && fechaHora.substring(0, 16) < String(cita.fechaHora).substring(0, 16)) {
      mostrarAdvertencia('Fecha no válida', 'La fecha de la atención médica no puede ser anterior a la fecha de la cita.');
      return;
    }

    const historiaRq: HistoriaMedicaRq = {
      historiaMedicaId: this.historiaSelected?.id,
      clienteId: datos.clienteId,
      mascotaId: datos.mascotaId,
      citaId: datos.citaId,
      medicoId: datos.medicoId,
      fechaHora: fechaHora,
      motivo: datos.motivo,
      diagnostico: datos.diagnostico,
      observaciones: datos.observaciones,
      estado: datos.estado,
      formulas: this.modoFormulario === 'C' ? this.formulasBorrador : undefined
    };

    this.guardando = true;
    const peticion = this.modoFormulario === 'C'
      ? this.historiaService.guardar(historiaRq)
      : this.historiaService.actualizar(historiaRq);

    peticion.subscribe({
      next: (respuesta: MiRespuesta) => {
        this.guardando = false;
        mostrarExito(respuesta.message);
        this.closeModal();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error);
      }
    });
  }

  // Abre el detalle de la atención médica con sus fórmulas prescritas y el historial de anotaciones
  verDetalle(historia: HistoriaMedica) {
    if (!historia.id) {
      return;
    }
    this.cargarMedicamentos();
    this.historiaService.consultar(historia.id).subscribe({
      next: (data) => {
        this.historiaDetalle = data;
        this.anotacionSelected = null;
        this.mostrarFormAnotacion = false;
        this.mostrarFormNuevaFormulaDetalle = false;
        this.terminoAnotacion = '';
        this.anotacionesAscendente = false;
        this.listAnotaciones = [];
        this.listFormulasHistoria = [];
        this.cargarAnotaciones();
        this.cargarFormulasDeHistoria();
        const modalElement = document.getElementById('modalDetalleHistoria');
        if (modalElement) {
          this.modalDetalleInstance ??= new Modal(modalElement);
          this.modalDetalleInstance.show();
        }
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  cargarFormulasDeHistoria() {
    const citaId = this.historiaDetalle?.cita?.id;
    if (!citaId) {
      return;
    }
    this.cargandoFormulasHistoria = true;
    this.formulaService.listarPorCita(citaId).subscribe({
      next: (formulas) => {
        this.listFormulasHistoria = formulas ?? [];
        this.cargandoFormulasHistoria = false;
      },
      error: () => {
        this.cargandoFormulasHistoria = false;
      }
    });
  }

  abrirNuevaFormulaEnDetalle() {
    this.formFormulaItem.reset({ cantidadSolicitada: 1 });
    this.mostrarFormNuevaFormulaDetalle = true;
  }

  cancelarNuevaFormulaEnDetalle() {
    this.mostrarFormNuevaFormulaDetalle = false;
  }

  guardarNuevaFormulaEnDetalle() {
    if (!this.historiaDetalle?.cita?.id || !this.historiaDetalle?.mascota?.mascotaId) {
      return;
    }
    if (this.formFormulaItem.invalid) {
      this.formFormulaItem.markAllAsTouched();
      mostrarAdvertencia('Campos obligatorios', 'Complete medicamento, dosis, frecuencia, duración, cantidad e indicaciones.');
      return;
    }

    const val = this.formFormulaItem.getRawValue();
    const fechaCita = String(this.historiaDetalle.cita.fechaHora ?? '').substring(0, 10);
    const hoy = fechaHoy();
    const fechaEmision = hoy >= fechaCita ? hoy : fechaCita;

    const rq: FormulaMedicaRq = {
      citaId: this.historiaDetalle.cita.id,
      mascotaId: this.historiaDetalle.mascota.mascotaId,
      medicoId: this.historiaDetalle.medico?.id,
      medicamentoId: Number(val.medicamentoId),
      fechaEmision,
      cantidadSolicitada: Number(val.cantidadSolicitada),
      dosis: val.dosis.trim(),
      frecuencia: val.frecuencia.trim(),
      duracionDias: Number(val.duracionDias),
      indicaciones: val.indicaciones.trim()
    };

    this.guardandoFormulaDetalle = true;
    this.formulaService.guardar(rq).subscribe({
      next: (res) => {
        this.guardandoFormulaDetalle = false;
        this.mostrarFormNuevaFormulaDetalle = false;
        mostrarExito(res.message);
        this.cargarFormulasDeHistoria();
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoFormulaDetalle = false;
        mostrarError(error);
      }
    });
  }

  etiquetaEstadoFormula(f: FormulaMedica): string {
    if (!f.activo) {
      return 'Inactiva';
    }
    switch ((f.estado ?? 'FORMULADA').toUpperCase()) {
      case 'ENTREGADA':
        return 'Dispensada Completa';
      case 'PARCIAL':
        return 'Dispensación Parcial';
      default:
        return 'Formulada (Pendiente Despacho)';
    }
  }

  claseEstadoFormula(f: FormulaMedica): string {
    if (!f.activo) {
      return 'bg-secondary';
    }
    switch ((f.estado ?? 'FORMULADA').toUpperCase()) {
      case 'ENTREGADA':
        return 'bg-success';
      case 'PARCIAL':
        return 'bg-warning text-dark';
      default:
        return 'bg-primary';
    }
  }

  cargarAnotaciones() {
    if (!this.historiaDetalle?.id) {
      return;
    }
    this.cargandoAnotaciones = true;
    this.anotacionService.listarPorHistoria(this.historiaDetalle.id).subscribe({
      next: (data) => {
        this.listAnotaciones = data ?? [];
        this.paginaAnotacion = 1;
        this.cargandoAnotaciones = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoAnotaciones = false;
        mostrarError(error);
      }
    });
  }

  actualizarBusquedaAnotacion(event: Event) {
    this.terminoAnotacion = (event.target as HTMLInputElement).value;
    this.paginaAnotacion = 1;
  }

  cambiarOrdenAnotaciones() {
    this.anotacionesAscendente = !this.anotacionesAscendente;
    this.paginaAnotacion = 1;
  }

  cambiarPaginaAnotacion(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginasAnotacion) {
      this.paginaAnotacion = pagina;
    }
  }

  verAnotacion(anotacion: AnotacionHistoria) {
    this.anotacionSelected = anotacion;
    this.mostrarFormAnotacion = false;
  }

  nuevaAnotacion() {
    this.formAnotacion.reset({ medicoId: this.historiaDetalle?.medico?.id ?? null });
    this.anotacionSelected = null;
    this.mostrarFormAnotacion = true;
  }

  cancelarAnotacion() {
    this.mostrarFormAnotacion = false;
  }

  guardarAnotacion() {
    if (this.formAnotacion.invalid) {
      this.formAnotacion.markAllAsTouched();
      mostrarAdvertencia('Campos obligatorios', 'El veterinario, la descripción y el diagnóstico o evolución son obligatorios.');
      return;
    }

    const datos = this.formAnotacion.value;
    const anotacionRq: AnotacionHistoriaRq = {
      historiaMedicaId: this.historiaDetalle?.id,
      medicoId: datos.medicoId,
      descripcion: datos.descripcion,
      observacion: datos.observacion,
      diagnostico: datos.diagnostico
    };

    this.guardandoAnotacion = true;
    this.anotacionService.guardar(anotacionRq).subscribe({
      next: (respuesta) => {
        this.guardandoAnotacion = false;
        this.mostrarFormAnotacion = false;
        mostrarExito(respuesta.message);
        this.cargarAnotaciones();
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoAnotacion = false;
        mostrarError(error);
      }
    });
  }

  closeModalDetalle() {
    this.modalDetalleInstance?.hide();
  }

  closeModal() {
    this.modalInstance?.hide();
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Registrar Atención Médica y Formulación' : 'Editar Atención / Historia Médica';
    this.titleBoton = modo === 'C' ? 'Guardar Atención Médica' : 'Actualizar Historia Médica';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearHistoriaMedica');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  private valorOrden(historia: HistoriaMedica): string | number | undefined {
    switch (this.campoOrden) {
      case 'mascota':
        return historia.mascota?.nombreMascota;
      case 'cliente':
        return nombreCompleto(historia.cliente);
      case 'medico':
        return nombreCompleto(historia.medico);
      case 'motivo':
        return historia.motivo;
      case 'estado':
        return historia.estado;
      default:
        return String(historia.fechaHora ?? '');
    }
  }
}
