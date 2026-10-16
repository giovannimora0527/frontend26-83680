import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { Medico, MedicoRq } from 'src/app/models/medico';
import { Especializacion } from 'src/app/models/especializacion';
import { MedicoService } from './service/medico.service';
import { PaginacionComponent } from 'src/app/shared/paginacion/paginacion.component';
import { compararValores, normalizarTexto, obtenerMensajeError } from 'src/app/utils/utilidades';

/** Columnas por las que se puede ordenar la tabla. */
type ColumnaOrden = 'nombres' | 'apellidos' | 'especializacion' | 'registro' | 'tipoDoc' | 'numeroDoc';

/**
 * Pantalla de gestión de médicos veterinarios: listado, creación, edición y detalle.
 */
@Component({
  selector: 'app-medico',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule, PaginacionComponent],
  templateUrl: './medico.component.html',
  styleUrl: './medico.component.scss'
})
export class MedicoComponent {
  /** Tipos de documento permitidos para un médico. */
  readonly tiposDocumento = [
    { valor: 'CC', texto: 'Cédula de ciudadanía' },
    { valor: 'CE', texto: 'Cédula de extranjería' },
    { valor: 'PA', texto: 'Pasaporte' }
  ];

  // Modal de detalle.
  modalDetalle: Modal | null = null;
  medicoDetalle: Medico | null = null;

  // Formulario de crear / editar.
  modalFormulario: Modal | null = null;
  modoFormulario = '';
  form!: FormGroup;
  medicoSelected: Medico | null = null;
  enviando = false;
  listEspecializaciones: Especializacion[] = [];

  // Tabla.
  listMedicos: Medico[] = [];
  cargando = false;
  terminoBusqueda = '';
  filtroEspecializacion = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'nombres';
  direccionOrden: 'asc' | 'desc' = 'asc';

  constructor(private readonly medicoService: MedicoService,
    private readonly formBuilder: FormBuilder) {
    this.inicializarFormulario();
    this.listar();
    this.cargarEspecializaciones();
  }

  /**
   * Crea el formulario reactivo con sus validaciones.
   */
  inicializarFormulario() {
    this.form = this.formBuilder.group({
      tipoDocumento: ['CC', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern(/^\d{5,20}$/)]],
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(100)]],
      telefono: ['', Validators.pattern(/^\d{7,15}$/)],
      registroProfesional: ['', [Validators.required, Validators.maxLength(50)]],
      especializacionId: [null, Validators.required]
    });
  }

  /** Acceso corto a los controles. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Carga las especializaciones para el combo. */
  cargarEspecializaciones() {
    this.medicoService.listarEspecializaciones().subscribe({
      next: (data) => this.listEspecializaciones = data,
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
  }

  /**
   * Trae los médicos del backend.
   */
  listar() {
    this.cargando = true;
    this.medicoService.listar().subscribe({
      next: (data) => {
        this.listMedicos = data;
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        Swal.fire('Error', obtenerMensajeError(error), 'error');
      }
    });
  }

  /** Especializaciones distintas para el filtro. */
  get especializaciones(): string[] {
    const nombres = this.listMedicos.map((medico) => medico.especializacion?.nombre).filter((n) => !!n);
    return [...new Set(nombres)].sort();
  }

  /** Médicos filtrados y ordenados. */
  get medicosFiltrados(): Medico[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());
    const filtrados = this.listMedicos.filter((medico) => {
      if (this.filtroEspecializacion && medico.especializacion?.nombre !== this.filtroEspecializacion) {
        return false;
      }
      if (!termino) {
        return true;
      }
      const valores = [medico.nombres, medico.apellidos, medico.tipoDocumento, medico.numeroDocumento,
        medico.especializacion?.nombre, medico.registroProfesional, medico.telefono];
      return valores.some((valor) => normalizarTexto(String(valor ?? '')).includes(termino));
    });
    return filtrados.sort((a, b) => compararValores(this.valorOrden(a), this.valorOrden(b), this.direccionOrden));
  }

  /**
   * Valor de la columna por la que se ordena.
   * @param medico fila.
   * @returns valor.
   */
  private valorOrden(medico: Medico): string {
    switch (this.columnaOrden) {
      case 'nombres': return medico.nombres ?? '';
      case 'apellidos': return medico.apellidos ?? '';
      case 'especializacion': return medico.especializacion?.nombre ?? '';
      case 'registro': return medico.registroProfesional ?? '';
      case 'tipoDoc': return medico.tipoDocumento ?? '';
      case 'numeroDoc': return medico.numeroDocumento ?? '';
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

  /** Médicos de la página actual. */
  get medicosPaginados(): Medico[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.medicosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  /** Total de páginas. */
  get totalPaginas(): number {
    return Math.ceil(this.medicosFiltrados.length / this.registrosPorPagina);
  }

  /** Vuelve a la primera página al filtrar. */
  filtrar() {
    this.paginaActual = 1;
  }

  /**
   * Iniciales del médico para el círculo de la tabla.
   * @param medico médico.
   * @returns iniciales.
   */
  iniciales(medico: Medico): string {
    return `${medico.nombres?.charAt(0) ?? ''}${medico.apellidos?.charAt(0) ?? ''}`;
  }

  /**
   * Abre el modal con el detalle del médico.
   * @param medico médico seleccionado.
   */
  verMedico(medico: Medico) {
    this.medicoDetalle = medico;
    const modalElement = document.getElementById('modalDetalleMedico');
    if (modalElement) {
      this.modalDetalle ??= new Modal(modalElement);
      this.modalDetalle.show();
    }
  }

  /** Abre el modal para crear un médico. */
  nuevoMedico() {
    this.medicoSelected = null;
    this.modoFormulario = 'C';
    this.form.reset({ tipoDocumento: 'CC', especializacionId: null });
    this.abrirModalFormulario();
  }

  /**
   * Abre el modal con los datos del médico para editarlo.
   * @param medico médico a editar.
   */
  abrirEdicion(medico: Medico) {
    this.medicoSelected = medico;
    this.modoFormulario = 'E';
    this.form.reset({
      tipoDocumento: medico.tipoDocumento,
      numeroDocumento: medico.numeroDocumento,
      nombres: medico.nombres,
      apellidos: medico.apellidos,
      telefono: medico.telefono,
      registroProfesional: medico.registroProfesional,
      especializacionId: medico.especializacion?.id ?? null
    });
    this.abrirModalFormulario();
  }

  /** Envía el médico al backend (crear o actualizar). */
  guardarMedico() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const medico: MedicoRq = {
      medicoId: this.medicoSelected?.id,
      tipoDocumento: valores.tipoDocumento,
      numeroDocumento: String(valores.numeroDocumento).trim(),
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      telefono: valores.telefono || null,
      registroProfesional: valores.registroProfesional.trim(),
      especializacionId: Number(valores.especializacionId)
    };
    this.enviando = true;
    const solicitud = this.modoFormulario === 'C'
      ? this.medicoService.crearMedico(medico)
      : this.medicoService.actualizarMedico(medico);
    solicitud.subscribe({
      next: (respuesta) => {
        this.enviando = false;
        this.modalFormulario?.hide();
        this.listar();
        Swal.fire('Operación exitosa', respuesta?.message ?? 'Médico guardado', 'success');
      },
      error: (error: HttpErrorResponse) => {
        this.enviando = false;
        Swal.fire('No se pudo guardar', obtenerMensajeError(error), 'error');
      }
    });
  }

  /** Abre el modal del formulario. */
  abrirModalFormulario() {
    const modalElement = document.getElementById('modalMedico');
    if (modalElement) {
      this.modalFormulario ??= new Modal(modalElement);
      this.modalFormulario.show();
    }
  }
}
