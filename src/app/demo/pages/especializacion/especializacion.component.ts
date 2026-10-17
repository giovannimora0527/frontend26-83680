import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { EspecializacionService } from './service/especializacion.service';
import { MedicoService } from '../medico/service/medico.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { Especializacion, EspecializacionRq } from 'src/app/models/especializacion';
import { Medico } from 'src/app/models/medico';
import { TablaLocal } from 'src/app/utils/tabla-local';
import { ModalBootstrap } from 'src/app/utils/modal';
import { normalizarTexto } from 'src/app/utils/texto';
import { mostrarError, notificarExito } from 'src/app/utils/mensajes';
import { TEXTO_OBLIGATORIO } from 'src/app/utils/validadores';

/**
 * Pantalla de gestión de especializaciones médicas: listado con búsqueda,
 * orden y paginación; registro, edición y detalle con los veterinarios que
 * la tienen. No se eliminan porque los veterinarios las referencian.
 */
@Component({
  selector: 'app-especializacion',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './especializacion.component.html'
})
export class EspecializacionComponent implements OnInit, OnDestroy {
  /** Tabla de especializaciones resuelta en el navegador (orden inicial por nombre). */
  readonly tabla = new TablaLocal<Especializacion>(
    {
      codigo: (e) => e.codigoEspecializacion,
      nombre: (e) => e.nombre,
      medicos: (e) => this.contarMedicos(e.id)
    },
    (e) => `${e.codigoEspecializacion} ${e.nombre} ${e.descripcion ?? ''}`,
    'nombre'
  );
  /** Indica que se está consultando el listado. */
  cargando = false;
  /** Indica que la última consulta falló. */
  error = false;

  /** Formulario reactivo de la especialización. */
  form!: FormGroup;
  /** Especialización en edición (null al crear). */
  editando: Especializacion | null = null;
  /** Indica que se está enviando el formulario. */
  guardando = false;

  /** Especialización mostrada en el detalle. */
  detalle: Especializacion | null = null;
  /** Indica que se está consultando el detalle. */
  cargandoDetalle = false;

  /** Lista completa, para validar duplicados antes de enviar. */
  private especializaciones: Especializacion[] = [];
  /** Veterinarios registrados, para contar y listar los de cada especialización. */
  private medicos: Medico[] = [];
  /** Modal del formulario. */
  private readonly modalFormulario = new ModalBootstrap('modalEspecializacion');
  /** Modal del detalle. */
  private readonly modalDetalle = new ModalBootstrap('modalDetalleEspecializacion');

  /**
   * @param especializacionService servicio de especializaciones.
   * @param medicoService servicio de veterinarios.
   * @param formBuilder constructor de formularios reactivos.
   */
  constructor(
    private readonly especializacionService: EspecializacionService,
    private readonly medicoService: MedicoService,
    private readonly formBuilder: FormBuilder
  ) { }

  /** Crea el formulario y consulta especializaciones y veterinarios. */
  ngOnInit(): void {
    this.form = this.formBuilder.group({
      codigoEspecializacion: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{2,10}$/)]],
      nombre: ['', [...TEXTO_OBLIGATORIO, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(255)]
    });
    this.listar();
    this.medicoService.listar().subscribe({
      next: (data) => {
        this.medicos = data;
        // Recalcula la columna de veterinarios ahora que se conocen.
        this.tabla.cargar(this.especializaciones);
      },
      error: () => (this.medicos = [])
    });
  }

  /** Libera los modales. */
  ngOnDestroy(): void {
    this.modalFormulario.destruir();
    this.modalDetalle.destruir();
  }

  /** Acceso corto a los controles del formulario. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Veterinarios de la especialización mostrada en el detalle. */
  get medicosDetalle(): Medico[] {
    return this.detalle ? this.medicos.filter((m) => m.especializacion?.id === this.detalle!.id) : [];
  }

  /** Indica que el código ya lo usa otra especialización. */
  get codigoDuplicado(): boolean {
    return this.existe((e) => e.codigoEspecializacion, this.f['codigoEspecializacion'].value);
  }

  /** Indica que el nombre ya lo usa otra especialización. */
  get nombreDuplicado(): boolean {
    return this.existe((e) => e.nombre, this.f['nombre'].value);
  }

  // ===================== Listado =====================

  /** Consulta la lista completa de especializaciones. */
  listar(): void {
    this.cargando = true;
    this.error = false;
    this.especializacionService.listar().subscribe({
      next: (data) => {
        this.especializaciones = data;
        this.tabla.cargar(data);
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.error = true;
        this.tabla.cargar([]);
        mostrarError(error, 'No se pudieron cargar las especializaciones');
      }
    });
  }

  /**
   * Cuenta los veterinarios que tienen una especialización.
   *
   * @param id identificador de la especialización.
   * @returns cantidad de veterinarios.
   */
  contarMedicos(id: number): number {
    return this.medicos.filter((m) => m.especializacion?.id === id).length;
  }

  // ===================== Formulario =====================

  /** Abre el formulario vacío para registrar una especialización. */
  abrirNueva(): void {
    this.editando = null;
    this.form.reset({ codigoEspecializacion: '', nombre: '', descripcion: '' });
    this.modalFormulario.abrir();
  }

  /**
   * Abre el formulario con los datos de una especialización.
   *
   * @param especializacion especialización a editar.
   */
  abrirEdicion(especializacion: Especializacion): void {
    this.editando = especializacion;
    this.form.reset({
      codigoEspecializacion: especializacion.codigoEspecializacion,
      nombre: especializacion.nombre,
      descripcion: especializacion.descripcion ?? ''
    });
    this.modalFormulario.abrir();
  }

  /** Cierra el formulario sin guardar. */
  cerrarFormulario(): void {
    this.modalFormulario.cerrar();
  }

  /** Envía el formulario: crea la especialización o actualiza la que se está editando. */
  guardar(): void {
    if (this.guardando) {
      return;
    }
    if (this.form.invalid || this.codigoDuplicado || this.nombreDuplicado) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const rq: EspecializacionRq = {
      codigoEspecializacion: String(v.codigoEspecializacion).trim().toUpperCase(),
      nombre: String(v.nombre).trim(),
      descripcion: String(v.descripcion ?? '').trim()
    };

    this.guardando = true;
    const peticion = this.editando
      ? this.especializacionService.actualizar(this.editando.id, rq)
      : this.especializacionService.guardar(rq);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando = false;
        notificarExito(respuesta.message);
        this.modalFormulario.cerrar();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error, 'No se pudo guardar la especialización');
      }
    });
  }

  /**
   * Indica si un campo debe mostrarse como inválido.
   *
   * @param campo nombre del control.
   * @returns true si es inválido y el usuario ya interactuó con él.
   */
  invalido(campo: string): boolean {
    const control = this.f[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  // ===================== Detalle =====================

  /**
   * Abre el detalle de la especialización con sus veterinarios.
   *
   * @param especializacion fila seleccionada.
   */
  verDetalle(especializacion: Especializacion): void {
    this.detalle = null;
    this.cargandoDetalle = true;
    this.modalDetalle.abrir();
    this.especializacionService.consultar(especializacion.id).subscribe({
      next: (data) => {
        this.detalle = data;
        this.cargandoDetalle = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoDetalle = false;
        this.modalDetalle.cerrar();
        mostrarError(error, 'No se pudo consultar la especialización');
      }
    });
  }

  /**
   * Indica si otra especialización (distinta de la que se edita) ya usa un valor.
   *
   * @param campo valor a comparar de cada especialización.
   * @param valor valor escrito en el formulario.
   * @returns true si está repetido.
   */
  private existe(campo: (e: Especializacion) => string, valor: string): boolean {
    const buscado = normalizarTexto(valor);
    return !!buscado && this.especializaciones.some((e) =>
      e.id !== this.editando?.id && normalizarTexto(campo(e)) === buscado);
  }
}
