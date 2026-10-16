import { Component } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { HistoriaService } from './service/historia.service';
import { AnotacionService } from './service/anotacion.service';
import { CitaService } from '../cita/service/cita.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { Anotacion } from 'src/app/models/anotacion';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { PaginacionComponent } from 'src/app/shared/paginacion/paginacion.component';
import { claseEstado, compararValores, fechaANumero, normalizarTexto, obtenerMensajeError } from 'src/app/utils/utilidades';

/** Columnas por las que se puede ordenar la tabla de historias. */
type ColumnaOrden = 'fecha' | 'mascota' | 'cliente' | 'medico' | 'motivo' | 'estado';

/**
 * Pantalla de historias clínicas y sus anotaciones.
 */
@Component({
  selector: 'app-historia',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule, PaginacionComponent],
  templateUrl: './historia.component.html',
  styleUrl: './historia.component.scss'
})
export class HistoriaComponent {
  /** Para pintar el color del estado. */
  readonly claseEstado = claseEstado;

  // Modales.
  modalHistoria: Modal | null = null;
  modalDetalle: Modal | null = null;

  // Tabla de historias.
  listHistorias: HistoriaMedica[] = [];
  cargando = false;
  terminoBusqueda = '';
  filtroMedico: number | null = null;
  filtroDesde = '';
  filtroHasta = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'fecha';
  direccionOrden: 'asc' | 'desc' = 'desc';

  // Combos.
  listClientes: Cliente[] = [];
  listMascotas: Mascota[] = [];
  listCitasAtendidas: Cita[] = [];
  listMedicos: Medico[] = [];

  // Formulario de historia.
  form!: FormGroup;
  enviando = false;

  // Detalle de la historia y sus anotaciones.
  historiaSeleccionada: HistoriaMedica | null = null;
  listAnotaciones: Anotacion[] = [];
  cargandoAnotaciones = false;
  anotacionSeleccionada: Anotacion | null = null;
  busquedaAnotacion = '';
  ordenAnotaciones: 'asc' | 'desc' = 'desc';
  paginaAnotaciones = 1;
  readonly anotacionesPorPagina = 3;
  formAnotacion!: FormGroup;
  mostrarFormAnotacion = false;
  enviandoAnotacion = false;

  constructor(private readonly historiaService: HistoriaService,
    private readonly anotacionService: AnotacionService,
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoService,
    private readonly formBuilder: FormBuilder) {
    this.inicializarFormularios();
    this.listar();
    this.cargarCombos();
  }

  /**
   * Crea los formularios de historia y de anotación.
   */
  inicializarFormularios() {
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [{ value: null, disabled: true }, Validators.required],
      citaId: [{ value: null, disabled: true }, Validators.required],
      medicoId: [null, Validators.required],
      fechaHora: ['', Validators.required],
      motivo: ['', Validators.required],
      diagnostico: ['', Validators.required],
      observaciones: ['']
    });
    this.formAnotacion = this.formBuilder.group({
      medicoId: [null, Validators.required],
      descripcion: ['', Validators.required],
      observacion: [''],
      diagnostico: ['', Validators.required]
    });
  }

  /** Controles del formulario de historia. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Controles del formulario de anotación. */
  get fa(): { [key: string]: AbstractControl } {
    return this.formAnotacion.controls;
  }

  /** Carga clientes y médicos para los combos. */
  cargarCombos() {
    this.clienteService.listarClientes().subscribe({
      next: (data) => this.listClientes = data,
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
    this.medicoService.listar().subscribe({
      next: (data) => this.listMedicos = data,
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
  }

  /** Trae las historias del backend. */
  listar() {
    this.cargando = true;
    this.historiaService.listarHistorias().subscribe({
      next: (data) => {
        this.listHistorias = data;
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        Swal.fire('Error', obtenerMensajeError(error), 'error');
      }
    });
  }

  // ----------------- Filtros, orden y paginación -----------------

  /** Historias filtradas y ordenadas. */
  get historiasFiltradas(): HistoriaMedica[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());
    const filtradas = this.listHistorias.filter((historia) => {
      const fecha = historia.fechaHora?.substring(0, 10) ?? '';
      if (this.filtroMedico && historia.medicoId !== this.filtroMedico) {
        return false;
      }
      if (this.filtroDesde && fecha < this.filtroDesde) {
        return false;
      }
      if (this.filtroHasta && fecha > this.filtroHasta) {
        return false;
      }
      if (!termino) {
        return true;
      }
      const valores = [historia.mascotaNombre, historia.clienteNombre, historia.medicoNombre,
        historia.motivo, historia.estado, historia.diagnostico];
      return valores.some((valor) => normalizarTexto(String(valor ?? '')).includes(termino));
    });
    return filtradas.sort((a, b) => compararValores(this.valorOrden(a), this.valorOrden(b), this.direccionOrden));
  }

  /**
   * Valor de la columna por la que se ordena.
   * @param historia fila.
   * @returns valor.
   */
  private valorOrden(historia: HistoriaMedica): string | number {
    switch (this.columnaOrden) {
      case 'fecha': return fechaANumero(historia.fechaHora);
      case 'mascota': return historia.mascotaNombre ?? '';
      case 'cliente': return historia.clienteNombre ?? '';
      case 'medico': return historia.medicoNombre ?? '';
      case 'motivo': return historia.motivo ?? '';
      case 'estado': return historia.estado ?? '';
    }
  }

  /**
   * Cambia el orden de la tabla.
   * @param columna columna clickeada.
   */
  ordenarPor(columna: ColumnaOrden) {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }
    this.paginaActual = 1;
  }

  /**
   * Icono de orden de una columna.
   * @param columna columna.
   * @returns clase del icono.
   */
  iconoOrden(columna: ColumnaOrden): string {
    if (this.columnaOrden !== columna) {
      return 'fa-sort';
    }
    return this.direccionOrden === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  /** Historias de la página actual. */
  get historiasPaginadas(): HistoriaMedica[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.historiasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  /** Total de páginas. */
  get totalPaginas(): number {
    return Math.ceil(this.historiasFiltradas.length / this.registrosPorPagina);
  }

  /** Vuelve a la primera página al filtrar. */
  filtrar() {
    this.paginaActual = 1;
  }

  /** Limpia los filtros. */
  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroMedico = null;
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.paginaActual = 1;
  }

  // ----------------- Crear historia -----------------

  /** Abre el modal para crear una historia. */
  nuevaHistoria() {
    this.form.reset();
    this.listMascotas = [];
    this.listCitasAtendidas = [];
    this.form.get('mascotaId')?.disable();
    this.form.get('citaId')?.disable();
    const modalElement = document.getElementById('modalHistoria');
    if (modalElement) {
      this.modalHistoria ??= new Modal(modalElement);
      this.modalHistoria.show();
    }
  }

  /** Al cambiar el cliente se cargan solo sus mascotas. */
  cambioCliente() {
    const clienteId = this.form.get('clienteId')?.value;
    this.listMascotas = [];
    this.listCitasAtendidas = [];
    this.form.patchValue({ mascotaId: null, citaId: null });
    this.form.get('mascotaId')?.disable();
    this.form.get('citaId')?.disable();
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (data) => {
        this.listMascotas = data;
        this.form.get('mascotaId')?.enable();
      },
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
  }

  /** Al cambiar la mascota se cargan sus citas atendidas. */
  cambioMascota() {
    const mascotaId = this.form.get('mascotaId')?.value;
    this.listCitasAtendidas = [];
    this.form.patchValue({ citaId: null });
    this.form.get('citaId')?.disable();
    if (!mascotaId) {
      return;
    }
    this.citaService.listarPorMascota(mascotaId).subscribe({
      next: (data) => {
        // Solo una cita atendida puede generar historia clínica
        this.listCitasAtendidas = data.filter((cita) => cita.estado === 'atendida');
        this.form.get('citaId')?.enable();
      },
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
  }

  /** Al escoger la cita se llenan el veterinario, la fecha y el motivo. */
  cambioCita() {
    const cita = this.listCitasAtendidas.find((c) => c.id === this.form.get('citaId')?.value);
    if (cita) {
      this.form.patchValue({
        medicoId: cita.medicoId,
        fechaHora: cita.fechaHora?.substring(0, 16),
        motivo: cita.motivo
      });
    }
  }

  /** Envía la historia al backend. */
  guardarHistoria() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const historia: HistoriaMedica = {
      clienteId: Number(valores.clienteId),
      mascotaId: Number(valores.mascotaId),
      citaId: Number(valores.citaId),
      medicoId: Number(valores.medicoId),
      fechaHora: `${valores.fechaHora}:00`,
      motivo: valores.motivo.trim(),
      diagnostico: valores.diagnostico.trim(),
      observaciones: valores.observaciones
    };
    this.enviando = true;
    this.historiaService.crearHistoria(historia).subscribe({
      next: (respuesta) => {
        this.enviando = false;
        this.modalHistoria?.hide();
        this.listar();
        Swal.fire('Operación exitosa', respuesta?.message ?? 'Historia guardada', 'success');
      },
      error: (error: HttpErrorResponse) => {
        this.enviando = false;
        Swal.fire('No se pudo guardar', obtenerMensajeError(error), 'error');
      }
    });
  }

  // ----------------- Ver detalle y anotaciones -----------------

  /**
   * Abre el modal con el detalle de la historia y su histórico de anotaciones.
   * @param historia historia seleccionada.
   */
  verHistoria(historia: HistoriaMedica) {
    this.historiaSeleccionada = historia;
    this.anotacionSeleccionada = null;
    this.mostrarFormAnotacion = false;
    this.busquedaAnotacion = '';
    this.ordenAnotaciones = 'desc';
    this.paginaAnotaciones = 1;
    this.cargarAnotaciones();
    const modalElement = document.getElementById('modalDetalleHistoria');
    if (modalElement) {
      this.modalDetalle ??= new Modal(modalElement);
      this.modalDetalle.show();
    }
  }

  /** Trae las anotaciones de la historia seleccionada. */
  cargarAnotaciones() {
    if (!this.historiaSeleccionada?.id) {
      return;
    }
    this.cargandoAnotaciones = true;
    this.anotacionService.listarPorHistoria(this.historiaSeleccionada.id).subscribe({
      next: (data) => {
        this.listAnotaciones = data;
        this.cargandoAnotaciones = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoAnotaciones = false;
        Swal.fire('Error', obtenerMensajeError(error), 'error');
      }
    });
  }

  /** Anotaciones filtradas y ordenadas por fecha. */
  get anotacionesFiltradas(): Anotacion[] {
    const termino = normalizarTexto(this.busquedaAnotacion.trim());
    const filtradas = this.listAnotaciones.filter((anotacion) => {
      if (!termino) {
        return true;
      }
      const valores = [anotacion.medicoNombre, anotacion.descripcion, anotacion.observacion, anotacion.diagnostico,
        anotacion.fecha ? formatDate(anotacion.fecha, 'yyyy-MM-dd', 'en-US') : ''];
      return valores.some((valor) => normalizarTexto(String(valor ?? '')).includes(termino));
    });
    return filtradas.sort((a, b) =>
      compararValores(fechaANumero(a.fecha), fechaANumero(b.fecha), this.ordenAnotaciones));
  }

  /** Anotaciones de la página actual. */
  get anotacionesPaginadas(): Anotacion[] {
    const inicio = (this.paginaAnotaciones - 1) * this.anotacionesPorPagina;
    return this.anotacionesFiltradas.slice(inicio, inicio + this.anotacionesPorPagina);
  }

  /** Total de páginas de anotaciones. */
  get totalPaginasAnotaciones(): number {
    return Math.ceil(this.anotacionesFiltradas.length / this.anotacionesPorPagina);
  }

  /** Invierte el orden por fecha de las anotaciones. */
  cambiarOrdenAnotaciones() {
    this.ordenAnotaciones = this.ordenAnotaciones === 'asc' ? 'desc' : 'asc';
    this.paginaAnotaciones = 1;
  }

  /** Muestra u oculta el formulario para agregar una anotación. */
  toggleFormAnotacion() {
    this.mostrarFormAnotacion = !this.mostrarFormAnotacion;
    this.formAnotacion.reset({ medicoId: this.historiaSeleccionada?.medicoId ?? null });
  }

  /** Guarda una nueva anotación en la historia seleccionada. */
  guardarAnotacion() {
    if (this.formAnotacion.invalid || this.enviandoAnotacion) {
      this.formAnotacion.markAllAsTouched();
      return;
    }
    const valores = this.formAnotacion.getRawValue();
    const anotacion: Anotacion = {
      historiaId: this.historiaSeleccionada?.id,
      medicoId: Number(valores.medicoId),
      descripcion: valores.descripcion.trim(),
      observacion: valores.observacion,
      diagnostico: valores.diagnostico.trim()
    };
    this.enviandoAnotacion = true;
    this.anotacionService.crearAnotacion(anotacion).subscribe({
      next: (respuesta) => {
        this.enviandoAnotacion = false;
        this.mostrarFormAnotacion = false;
        this.cargarAnotaciones();
        Swal.fire('Operación exitosa', respuesta?.message ?? 'Anotación guardada', 'success');
      },
      error: (error: HttpErrorResponse) => {
        this.enviandoAnotacion = false;
        Swal.fire('No se pudo guardar', obtenerMensajeError(error), 'error');
      }
    });
  }
}
