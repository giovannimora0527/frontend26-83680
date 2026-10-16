import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { FormulaService } from './service/formula.service';
import { MedicamentoService } from './service/medicamento.service';
import { CitaService } from '../cita/service/cita.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { Medicamento } from 'src/app/models/medicamento';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { PaginacionComponent } from 'src/app/shared/paginacion/paginacion.component';
import { compararValores, fechaANumero, fechaHoy, normalizarTexto, obtenerMensajeError } from 'src/app/utils/utilidades';

/** Columnas por las que se puede ordenar la tabla. */
type ColumnaOrden = 'creacion' | 'emision' | 'mascota' | 'cliente' | 'medicamento' | 'medico' | 'estado';

/**
 * Pantalla de gestión de fórmulas médicas: listado, creación, edición, detalle e inactivación.
 */
@Component({
  selector: 'app-formula',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule, PaginacionComponent],
  templateUrl: './formula.component.html',
  styleUrl: './formula.component.scss'
})
export class FormulaComponent {
  // Modales.
  modalFormulario: Modal | null = null;
  modalDetalle: Modal | null = null;
  titleModal = '';
  titleBoton = '';
  modoFormulario = '';

  // Tabla.
  listFormulas: FormulaMedica[] = [];
  cargando = false;
  terminoBusqueda = '';
  filtroEstado = '';
  filtroMedicamento: number | null = null;
  filtroDesde = '';
  filtroHasta = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'creacion';
  direccionOrden: 'asc' | 'desc' = 'desc';

  // Combos.
  listClientes: Cliente[] = [];
  listMascotas: Mascota[] = [];
  listCitas: Cita[] = [];
  listMedicos: Medico[] = [];
  listMedicamentos: Medicamento[] = [];

  // Formulario.
  form!: FormGroup;
  formulaSelected: FormulaMedica | null = null;
  enviando = false;
  /** Fecha de la cita seleccionada (yyyy-MM-dd), la fecha de emisión no puede ser menor. */
  fechaMinimaEmision = '';

  // Detalle.
  formulaDetalle: FormulaMedica | null = null;

  constructor(private readonly formulaService: FormulaService,
    private readonly medicamentoService: MedicamentoService,
    private readonly citaService: CitaService,
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
      citaId: [{ value: null, disabled: true }, Validators.required],
      medicoId: [null, Validators.required],
      fechaEmision: [fechaHoy(), Validators.required],
      medicamentoId: [null, Validators.required],
      dosis: ['', [Validators.required, Validators.maxLength(200)]],
      frecuencia: ['', [Validators.required, Validators.maxLength(100)]],
      duracionDias: [null, [Validators.required, Validators.min(1), Validators.max(365)]],
      indicaciones: ['']
    }, { validators: this.validarFechaEmision });
  }

  /** Acceso corto a los controles. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Validador: la fecha de emisión no puede ser anterior a la fecha de la consulta.
   */
  validarFechaEmision = (grupo: AbstractControl): ValidationErrors | null => {
    const fechaEmision = grupo.get('fechaEmision')?.value;
    if (!fechaEmision || !this.fechaMinimaEmision) {
      return null;
    }
    return fechaEmision < this.fechaMinimaEmision ? { fechaAnteriorCita: true } : null;
  };

  /** Carga clientes, médicos y medicamentos para los combos. */
  cargarCombos() {
    this.clienteService.listarClientes().subscribe({
      next: (data) => this.listClientes = data,
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
    this.medicoService.listar().subscribe({
      next: (data) => this.listMedicos = data,
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
    this.medicamentoService.listarMedicamentos().subscribe({
      next: (data) => this.listMedicamentos = data,
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
  }

  /** Trae las fórmulas del backend. */
  listar() {
    this.cargando = true;
    this.formulaService.listarFormulas().subscribe({
      next: (data) => {
        this.listFormulas = data;
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

  /** Fórmulas filtradas y ordenadas. */
  get formulasFiltradas(): FormulaMedica[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());
    const filtradas = this.listFormulas.filter((formula) => {
      if (this.filtroEstado === 'activa' && !formula.activo) {
        return false;
      }
      if (this.filtroEstado === 'inactiva' && formula.activo) {
        return false;
      }
      if (this.filtroMedicamento && formula.medicamentoId !== this.filtroMedicamento) {
        return false;
      }
      if (this.filtroDesde && (formula.fechaEmision ?? '') < this.filtroDesde) {
        return false;
      }
      if (this.filtroHasta && (formula.fechaEmision ?? '') > this.filtroHasta) {
        return false;
      }
      if (!termino) {
        return true;
      }
      const valores = [formula.mascotaNombre, formula.clienteNombre, formula.medicamentoNombre,
        formula.medicoNombre, formula.dosis, formula.fechaEmision];
      return valores.some((valor) => normalizarTexto(String(valor ?? '')).includes(termino));
    });
    return filtradas.sort((a, b) => compararValores(this.valorOrden(a), this.valorOrden(b), this.direccionOrden));
  }

  /**
   * Valor de la columna por la que se ordena.
   * @param formula fila.
   * @returns valor.
   */
  private valorOrden(formula: FormulaMedica): string | number {
    switch (this.columnaOrden) {
      case 'creacion': return fechaANumero(formula.fechaCreacionRegistro);
      case 'emision': return formula.fechaEmision ?? '';
      case 'mascota': return formula.mascotaNombre ?? '';
      case 'cliente': return formula.clienteNombre ?? '';
      case 'medicamento': return formula.medicamentoNombre ?? '';
      case 'medico': return formula.medicoNombre ?? '';
      case 'estado': return formula.activo ? 1 : 0;
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

  /** Fórmulas de la página actual. */
  get formulasPaginadas(): FormulaMedica[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.formulasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  /** Total de páginas. */
  get totalPaginas(): number {
    return Math.ceil(this.formulasFiltradas.length / this.registrosPorPagina);
  }

  /** Vuelve a la primera página al filtrar. */
  filtrar() {
    this.paginaActual = 1;
  }

  /** Limpia los filtros. */
  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroMedicamento = null;
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.paginaActual = 1;
  }

  // ----------------- Combos dependientes -----------------

  /** Al cambiar el cliente se cargan solo sus mascotas. */
  cambioCliente() {
    const clienteId = this.form.get('clienteId')?.value;
    this.listMascotas = [];
    this.listCitas = [];
    this.fechaMinimaEmision = '';
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

  /** Al cambiar la mascota se cargan sus citas (menos las canceladas). */
  cambioMascota() {
    const mascotaId = this.form.get('mascotaId')?.value;
    this.listCitas = [];
    this.fechaMinimaEmision = '';
    this.form.patchValue({ citaId: null });
    this.form.get('citaId')?.disable();
    if (!mascotaId) {
      return;
    }
    this.citaService.listarPorMascota(mascotaId).subscribe({
      next: (data) => {
        this.listCitas = data.filter((cita) => cita.estado !== 'cancelada');
        this.form.get('citaId')?.enable();
      },
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
  }

  /** Al escoger la cita se toma su veterinario y su fecha como mínimo de emisión. */
  cambioCita() {
    const cita = this.listCitas.find((c) => c.id === this.form.get('citaId')?.value);
    if (cita) {
      this.fechaMinimaEmision = cita.fechaHora?.substring(0, 10) ?? '';
      this.form.patchValue({ medicoId: cita.medicoId });
      this.form.updateValueAndValidity();
    }
  }

  // ----------------- Crear / editar -----------------

  /** Abre el modal para crear una fórmula. */
  nuevaFormula() {
    this.formulaSelected = null;
    this.modoFormulario = 'C';
    this.fechaMinimaEmision = '';
    this.listMascotas = [];
    this.listCitas = [];
    this.form.reset({ fechaEmision: fechaHoy() });
    this.form.get('clienteId')?.enable();
    this.form.get('medicoId')?.enable();
    this.form.get('mascotaId')?.disable();
    this.form.get('citaId')?.disable();
    this.abrirModalFormulario();
  }

  /**
   * Abre el modal para editar. Mascota, cita y veterinario NO se pueden cambiar
   * porque son la parte clínica de la fórmula; solo se edita el tratamiento.
   * @param formula fórmula a editar.
   */
  abrirEdicion(formula: FormulaMedica) {
    if (!formula.activo) {
      Swal.fire('No se puede editar', 'La fórmula está inactiva.', 'info');
      return;
    }
    this.formulaSelected = formula;
    this.modoFormulario = 'E';
    this.fechaMinimaEmision = formula.citaFechaHora?.substring(0, 10) ?? '';
    // Se llenan los combos solo con el dato actual para que se vea en pantalla
    this.listMascotas = [{ mascotaId: formula.mascotaId, nombreMascota: formula.mascotaNombre }];
    this.listCitas = [{ id: formula.citaId, fechaHora: formula.citaFechaHora }];
    this.form.reset({
      clienteId: formula.clienteId,
      mascotaId: formula.mascotaId,
      citaId: formula.citaId,
      medicoId: formula.medicoId,
      fechaEmision: formula.fechaEmision,
      medicamentoId: formula.medicamentoId,
      dosis: formula.dosis,
      frecuencia: formula.frecuencia,
      duracionDias: formula.duracionDias,
      indicaciones: formula.indicaciones
    });
    this.form.get('clienteId')?.disable();
    this.form.get('mascotaId')?.disable();
    this.form.get('citaId')?.disable();
    this.form.get('medicoId')?.disable();
    this.abrirModalFormulario();
  }

  /** Envía la fórmula al backend. */
  guardarFormula() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const formula: FormulaMedica = {
      formulaId: this.formulaSelected?.id,
      clienteId: Number(valores.clienteId),
      mascotaId: Number(valores.mascotaId),
      citaId: Number(valores.citaId),
      medicoId: Number(valores.medicoId),
      medicamentoId: Number(valores.medicamentoId),
      fechaEmision: valores.fechaEmision,
      dosis: valores.dosis.trim(),
      frecuencia: valores.frecuencia.trim(),
      duracionDias: Number(valores.duracionDias),
      indicaciones: valores.indicaciones
    };
    this.enviando = true;
    const solicitud = this.modoFormulario === 'C'
      ? this.formulaService.crearFormula(formula)
      : this.formulaService.actualizarFormula(formula);
    solicitud.subscribe({
      next: (respuesta) => {
        this.enviando = false;
        this.modalFormulario?.hide();
        this.listar();
        Swal.fire('Operación exitosa', respuesta?.message ?? 'Fórmula guardada', 'success');
      },
      error: (error: HttpErrorResponse) => {
        this.enviando = false;
        Swal.fire('No se pudo guardar', obtenerMensajeError(error), 'error');
      }
    });
  }

  /**
   * Muestra el detalle completo de la fórmula (lo consulta al backend).
   * @param formula fila seleccionada.
   */
  verFormula(formula: FormulaMedica) {
    this.formulaService.consultarFormula(formula.id!).subscribe({
      next: (data) => {
        this.formulaDetalle = data;
        const modalElement = document.getElementById('modalDetalleFormula');
        if (modalElement) {
          this.modalDetalle ??= new Modal(modalElement);
          this.modalDetalle.show();
        }
      },
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
  }

  /**
   * Inactiva la fórmula (no se borra porque ya es información clínica).
   * @param formula fórmula a inactivar.
   */
  inactivarFormula(formula: FormulaMedica) {
    Swal.fire({
      title: '¿Inactivar la fórmula?',
      text: 'La fórmula no se elimina, solo queda inactiva y ya no se podrá editar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, inactivar',
      cancelButtonText: 'Cancelar'
    }).then((resultado) => {
      if (!resultado.isConfirmed) {
        return;
      }
      this.formulaService.inactivarFormula(formula.id!).subscribe({
        next: (respuesta) => {
          this.listar();
          Swal.fire('Operación exitosa', respuesta?.message ?? 'Fórmula inactivada', 'success');
        },
        error: (error: HttpErrorResponse) => Swal.fire('No se pudo inactivar', obtenerMensajeError(error), 'error')
      });
    });
  }

  /** Abre el modal del formulario. */
  abrirModalFormulario() {
    this.titleModal = this.modoFormulario === 'C' ? 'Nueva fórmula médica' : 'Editar fórmula médica';
    this.titleBoton = this.modoFormulario === 'C' ? 'Guardar fórmula' : 'Actualizar fórmula';
    const modalElement = document.getElementById('modalFormula');
    if (modalElement) {
      this.modalFormulario ??= new Modal(modalElement);
      this.modalFormulario.show();
    }
  }
}
