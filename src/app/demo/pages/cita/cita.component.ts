import { Component } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { CitaService } from './service/cita.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { PaginacionComponent } from 'src/app/shared/paginacion/paginacion.component';
import { claseEstado, compararValores, fechaANumero, fechaHoy, normalizarTexto, obtenerMensajeError } from 'src/app/utils/utilidades';

/** Columnas por las que se puede ordenar la tabla. */
type ColumnaOrden = 'fecha' | 'motivo' | 'cliente' | 'mascota' | 'medico' | 'estado';

/**
 * Pantalla de gestión de citas médicas: listado, creación, edición y reactivación.
 */
@Component({
  selector: 'app-cita',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule, PaginacionComponent],
  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent {
  /** Estados que puede tener una cita. */
  readonly estados = ['pendiente', 'confirmada', 'programada', 'atendida', 'cancelada'];
  /** Estados permitidos al crear una cita. */
  readonly estadosCreacion = ['pendiente', 'confirmada', 'programada'];
  /** Para pintar el color del estado en el html. */
  readonly claseEstado = claseEstado;
  /** Fecha mínima para el input de fecha. */
  readonly hoy = fechaHoy();

  // Variables del modal.
  modalInstance: Modal | null = null;
  modalDetalle: Modal | null = null;
  /** Cita que se muestra en el modal Ver. */
  citaDetalle: Cita | null = null;
  titleModal = '';
  titleBoton = '';
  modoFormulario = '';

  // Datos de la tabla.
  listCitas: Cita[] = [];
  cargando = false;
  terminoBusqueda = '';
  filtroEstado = '';
  filtroDesde = '';
  filtroHasta = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'fecha';
  direccionOrden: 'asc' | 'desc' = 'desc';

  // Datos de los combos.
  listClientes: Cliente[] = [];
  listMascotas: Mascota[] = [];
  listMedicos: Medico[] = [];

  // Formulario.
  form!: FormGroup;
  citaSelected: Cita | null = null;
  enviando = false;

  constructor(private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoService,
    private readonly formBuilder: FormBuilder) {
    this.inicializarFormulario();
    this.listar();
    this.cargarCombos();
  }

  /**
   * Crea el formulario reactivo con sus validaciones.
   */
  inicializarFormulario() {
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [{ value: null, disabled: true }, Validators.required],
      medicoId: [null, Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      estado: ['programada', Validators.required]
    }, { validators: this.validarFechaNoPasada });
  }

  /** Acceso corto a los controles del formulario desde el html. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Validador del formulario: la fecha y hora no pueden estar en el pasado.
   * En edición solo se valida si el usuario cambió la fecha o la hora.
   */
  validarFechaNoPasada = (grupo: AbstractControl): ValidationErrors | null => {
    const fecha = grupo.get('fecha')?.value;
    const hora = grupo.get('hora')?.value;
    if (!fecha || !hora) {
      return null;
    }
    const fechaHora = `${fecha}T${hora}:00`;
    if (this.citaSelected && this.citaSelected.fechaHora?.startsWith(`${fecha}T${hora}`)) {
      return null;
    }
    return new Date(fechaHora).getTime() < Date.now() ? { fechaPasada: true } : null;
  };

  /**
   * Carga los clientes y médicos para los combos.
   */
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

  /**
   * Trae las citas del backend.
   */
  listar() {
    this.cargando = true;
    this.citaService.listarCitas().subscribe({
      next: (data) => {
        this.listCitas = data;
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        Swal.fire('Error', obtenerMensajeError(error), 'error');
      }
    });
  }

  /**
   * Cuando cambia el cliente se consultan SOLO sus mascotas.
   * @param mascotaIdSeleccionar mascota a dejar seleccionada (se usa al editar).
   */
  cambioCliente(mascotaIdSeleccionar: number | null = null) {
    const clienteId = this.form.get('clienteId')?.value;
    this.listMascotas = [];
    this.form.get('mascotaId')?.setValue(null);
    this.form.get('mascotaId')?.disable();
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (data) => {
        this.listMascotas = data;
        this.form.get('mascotaId')?.enable();
        this.form.get('mascotaId')?.setValue(mascotaIdSeleccionar);
      },
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
  }

  // ----------------- Filtros, orden y paginación -----------------

  /** Citas después de aplicar búsqueda, filtros y orden. */
  get citasFiltradas(): Cita[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());
    const filtradas = this.listCitas.filter((cita) => {
      const fecha = cita.fechaHora?.substring(0, 10) ?? '';
      if (this.filtroEstado && cita.estado !== this.filtroEstado) {
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
      const valores = [cita.clienteNombre, cita.mascotaNombre, cita.medicoNombre, cita.estado, cita.motivo,
        cita.fechaHora ? formatDate(cita.fechaHora, 'yyyy-MM-dd HH:mm', 'en-US') : ''];
      return valores.some((valor) => normalizarTexto(String(valor ?? '')).includes(termino));
    });
    return filtradas.sort((a, b) =>
      compararValores(this.valorOrden(a), this.valorOrden(b), this.direccionOrden));
  }

  /**
   * Devuelve el valor de la columna por la que se ordena.
   * @param cita cita de la fila.
   * @returns valor para comparar.
   */
  private valorOrden(cita: Cita): string | number {
    switch (this.columnaOrden) {
      case 'fecha': return fechaANumero(cita.fechaHora);
      case 'motivo': return cita.motivo ?? '';
      case 'cliente': return cita.clienteNombre ?? '';
      case 'mascota': return cita.mascotaNombre ?? '';
      case 'medico': return cita.medicoNombre ?? '';
      case 'estado': return cita.estado ?? '';
    }
  }

  /**
   * Cambia la columna de orden o invierte la dirección.
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
   * Icono de la flechita de orden de una columna.
   * @param columna columna.
   * @returns clase del icono.
   */
  iconoOrden(columna: ColumnaOrden): string {
    if (this.columnaOrden !== columna) {
      return 'fa-sort';
    }
    return this.direccionOrden === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  /** Citas de la página actual. */
  get citasPaginadas(): Cita[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.citasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  /** Total de páginas. */
  get totalPaginas(): number {
    return Math.ceil(this.citasFiltradas.length / this.registrosPorPagina);
  }

  /** Vuelve a la página 1 cuando cambia un filtro. */
  filtrar() {
    this.paginaActual = 1;
  }

  /** Limpia todos los filtros. */
  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.paginaActual = 1;
  }

  // ----------------- Crear / editar -----------------

  /**
   * Indica si la cita se puede editar según su estado.
   * Cancelada: hay que reactivarla primero. Atendida: es información histórica.
   * @param cita cita de la fila.
   * @returns true si se puede editar.
   */
  puedeEditar(cita: Cita): boolean {
    return cita.estado !== 'cancelada' && cita.estado !== 'atendida';
  }

  /** Abre el modal vacío para crear una cita. */
  nuevaCita() {
    this.citaSelected = null;
    this.modoFormulario = 'C';
    this.form.reset({ estado: 'programada' });
    this.listMascotas = [];
    this.form.get('mascotaId')?.disable();
    this.abrirModal();
  }

  /**
   * Abre el modal con los datos de la cita para editarla.
   * @param cita cita a editar.
   */
  abrirEdicion(cita: Cita) {
    if (!this.puedeEditar(cita)) {
      Swal.fire('No se puede editar', cita.estado === 'cancelada'
        ? 'La cita está cancelada. Use el botón Reactivar si desea usarla de nuevo.'
        : 'La cita ya fue atendida y su información no se puede modificar.', 'info');
      return;
    }
    this.citaSelected = cita;
    this.modoFormulario = 'E';
    this.form.reset({
      clienteId: cita.clienteId,
      medicoId: cita.medicoId,
      fecha: cita.fechaHora?.substring(0, 10),
      hora: cita.fechaHora?.substring(11, 16),
      motivo: cita.motivo,
      estado: cita.estado
    });
    this.cambioCliente(cita.mascotaId ?? null);
    this.abrirModal();
  }

  /**
   * Envía el formulario al backend (crear o actualizar).
   */
  guardarCita() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const cita: Cita = {
      citaId: this.citaSelected?.id,
      clienteId: Number(valores.clienteId),
      mascotaId: Number(valores.mascotaId),
      medicoId: Number(valores.medicoId),
      fechaHora: `${valores.fecha}T${valores.hora}:00`,
      motivo: valores.motivo.trim(),
      estado: valores.estado
    };

    this.enviando = true;
    const solicitud = this.modoFormulario === 'C'
      ? this.citaService.crearCita(cita)
      : this.citaService.actualizarCita(cita);

    solicitud.subscribe({
      next: (respuesta) => {
        this.enviando = false;
        this.cerrarModal();
        this.listar();
        Swal.fire('Operación exitosa', respuesta?.message ?? 'Cita guardada', 'success');
      },
      error: (error: HttpErrorResponse) => {
        this.enviando = false;
        Swal.fire('No se pudo guardar', obtenerMensajeError(error), 'error');
      }
    });
  }

  /**
   * Abre el modal Ver con el detalle de la cita (lo consulta al backend).
   * @param cita fila seleccionada.
   */
  verCita(cita: Cita) {
    this.citaService.consultarCita(cita.id!).subscribe({
      next: (data) => {
        this.citaDetalle = data;
        const modalElement = document.getElementById('modalDetalleCita');
        if (modalElement) {
          this.modalDetalle ??= new Modal(modalElement);
          this.modalDetalle.show();
        }
      },
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
  }

  /**
   * Reactiva una cita cancelada, pidiendo confirmación antes.
   * @param cita cita cancelada.
   */
  reactivarCita(cita: Cita) {
    Swal.fire({
      title: '¿Reactivar la cita?',
      text: 'La cita volverá a quedar en estado pendiente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((resultado) => {
      if (!resultado.isConfirmed) {
        return;
      }
      this.citaService.reactivarCita(cita.id!).subscribe({
        next: (respuesta) => {
          this.modalDetalle?.hide();
          this.listar();
          Swal.fire('Operación exitosa', respuesta?.message ?? 'Cita reactivada', 'success');
        },
        error: (error: HttpErrorResponse) => Swal.fire('No se pudo reactivar', obtenerMensajeError(error), 'error')
      });
    });
  }

  /** Abre el modal de bootstrap. */
  abrirModal() {
    this.titleModal = this.modoFormulario === 'C' ? 'Nueva cita' : 'Editar cita';
    this.titleBoton = this.modoFormulario === 'C' ? 'Guardar cita' : 'Actualizar cita';
    const modalElement = document.getElementById('modalCita');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  /** Cierra el modal. */
  cerrarModal() {
    this.modalInstance?.hide();
  }
}
