import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { MedicoService } from './service/medico.service';
import { EspecializacionService } from '../especializacion/service/especializacion.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { Medico, MedicoRq, TIPOS_DOCUMENTO_MEDICO } from 'src/app/models/medico';
import { Especializacion } from 'src/app/models/especializacion';
import { TablaLocal } from 'src/app/utils/tabla-local';
import { ModalBootstrap } from 'src/app/utils/modal';
import { normalizarTexto } from 'src/app/utils/texto';
import { mostrarError, notificarExito } from 'src/app/utils/mensajes';
import { SOLO_LETRAS, TELEFONO, TEXTO_OBLIGATORIO } from 'src/app/utils/validadores';

/**
 * Pantalla de gestión de veterinarios: listado con búsqueda, filtro por
 * especialización, orden y paginación; registro, edición y detalle. Los
 * veterinarios no se eliminan porque sus citas, historias y fórmulas los referencian.
 */
@Component({
  selector: 'app-medico',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './medico.component.html'
})
export class MedicoComponent implements OnInit, OnDestroy {
  /** Tipos de documento para el combo. */
  readonly tiposDocumento = TIPOS_DOCUMENTO_MEDICO;

  /** Tabla de veterinarios resuelta en el navegador (orden inicial por nombre). */
  readonly tabla = new TablaLocal<Medico>(
    {
      documento: (m) => m.numeroDocumento,
      nombre: (m) => `${m.nombres} ${m.apellidos}`,
      especializacion: (m) => m.especializacion?.nombre,
      registro: (m) => m.registroProfesional
    },
    (m) => `${m.tipoDocumento} ${m.numeroDocumento} ${m.nombres} ${m.apellidos} ${m.registroProfesional} `
      + `${m.especializacion?.nombre ?? ''} ${m.telefono ?? ''}`,
    'nombre'
  );
  /** Especializaciones para el filtro y el formulario. */
  especializaciones: Especializacion[] = [];
  /** Especialización seleccionada en el filtro (null = todas). */
  filtroEspecializacion: number | null = null;
  /** Indica que se está consultando el listado. */
  cargando = false;
  /** Indica que la última consulta falló. */
  error = false;

  /** Formulario reactivo del veterinario. */
  form!: FormGroup;
  /** Veterinario en edición (null al crear). */
  medicoEditando: Medico | null = null;
  /** Indica que se está enviando el formulario. */
  guardando = false;

  /** Veterinario mostrado en el detalle. */
  medicoDetalle: Medico | null = null;
  /** Indica que se está consultando el detalle. */
  cargandoDetalle = false;

  /** Lista completa, para validar duplicados antes de enviar. */
  private medicos: Medico[] = [];
  /** Modal del formulario. */
  private readonly modalFormulario = new ModalBootstrap('modalMedico');
  /** Modal del detalle. */
  private readonly modalDetalle = new ModalBootstrap('modalDetalleMedico');

  /**
   * @param medicoService servicio de veterinarios.
   * @param especializacionService servicio de especializaciones.
   * @param formBuilder constructor de formularios reactivos.
   */
  constructor(
    private readonly medicoService: MedicoService,
    private readonly especializacionService: EspecializacionService,
    private readonly formBuilder: FormBuilder
  ) { }

  /** Crea el formulario y consulta veterinarios y especializaciones. */
  ngOnInit(): void {
    this.form = this.formBuilder.group({
      tipoDocumento: ['CC', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{5,20}$/)]],
      nombres: ['', [...TEXTO_OBLIGATORIO, SOLO_LETRAS, Validators.maxLength(100)]],
      apellidos: ['', [...TEXTO_OBLIGATORIO, SOLO_LETRAS, Validators.maxLength(100)]],
      telefono: ['', TELEFONO],
      registroProfesional: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{3,50}$/)]],
      especializacionId: [null, Validators.required]
    });
    this.listar();
    this.especializacionService.listar().subscribe({
      next: (data) => (this.especializaciones = data),
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudieron cargar las especializaciones')
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

  /** Indica si hay búsqueda o filtro activo. */
  get hayFiltros(): boolean {
    return this.tabla.hayBusqueda || this.filtroEspecializacion !== null;
  }

  /** Indica que otro veterinario ya tiene ese documento. */
  get documentoDuplicado(): boolean {
    const tipo = this.f['tipoDocumento'].value;
    const numero = normalizarTexto(this.f['numeroDocumento'].value);
    return !!numero && this.medicos.some((m) =>
      m.id !== this.medicoEditando?.id && m.tipoDocumento === tipo && normalizarTexto(m.numeroDocumento) === numero);
  }

  /** Indica que otro veterinario ya tiene ese registro profesional. */
  get registroDuplicado(): boolean {
    const registro = normalizarTexto(this.f['registroProfesional'].value);
    return !!registro && this.medicos.some((m) =>
      m.id !== this.medicoEditando?.id && normalizarTexto(m.registroProfesional) === registro);
  }

  // ===================== Listado =====================

  /** Consulta la lista completa de veterinarios. */
  listar(): void {
    this.cargando = true;
    this.error = false;
    this.medicoService.listar().subscribe({
      next: (data) => {
        this.medicos = data;
        this.tabla.cargar(data);
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.error = true;
        this.tabla.cargar([]);
        mostrarError(error, 'No se pudieron cargar los veterinarios');
      }
    });
  }

  /** Aplica el filtro por especialización. */
  aplicarFiltro(): void {
    const id = this.filtroEspecializacion;
    this.tabla.filtrar((m) => id === null || m.especializacion?.id === id);
  }

  /** Quita búsqueda, filtro y orden personalizados. */
  limpiarFiltros(): void {
    this.filtroEspecializacion = null;
    this.tabla.filtrar(() => true);
    this.tabla.reiniciar();
  }

  // ===================== Formulario =====================

  /** Abre el formulario vacío para registrar un veterinario. */
  abrirNuevo(): void {
    this.medicoEditando = null;
    this.form.reset({
      tipoDocumento: 'CC', numeroDocumento: '', nombres: '', apellidos: '',
      telefono: '', registroProfesional: '', especializacionId: null
    });
    this.modalFormulario.abrir();
  }

  /**
   * Abre el formulario con los datos de un veterinario.
   *
   * @param medico veterinario a editar.
   */
  abrirEdicion(medico: Medico): void {
    this.medicoEditando = medico;
    this.form.reset({
      tipoDocumento: medico.tipoDocumento,
      numeroDocumento: medico.numeroDocumento,
      nombres: medico.nombres,
      apellidos: medico.apellidos,
      telefono: medico.telefono ?? '',
      registroProfesional: medico.registroProfesional,
      especializacionId: medico.especializacion?.id ?? null
    });
    this.modalFormulario.abrir();
  }

  /** Cierra el formulario sin guardar. */
  cerrarFormulario(): void {
    this.modalFormulario.cerrar();
  }

  /** Envía el formulario: crea el veterinario o actualiza el que se está editando. */
  guardar(): void {
    if (this.guardando) {
      return;
    }
    if (this.form.invalid || this.documentoDuplicado || this.registroDuplicado) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const rq: MedicoRq = {
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: String(v.numeroDocumento).trim().toUpperCase(),
      nombres: String(v.nombres).trim(),
      apellidos: String(v.apellidos).trim(),
      telefono: String(v.telefono ?? '').trim(),
      registroProfesional: String(v.registroProfesional).trim().toUpperCase(),
      especializacionId: Number(v.especializacionId)
    };

    this.guardando = true;
    const peticion = this.medicoEditando
      ? this.medicoService.actualizar(this.medicoEditando.id, rq)
      : this.medicoService.guardar(rq);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando = false;
        notificarExito(respuesta.message);
        this.modalFormulario.cerrar();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error, 'No se pudo guardar el veterinario');
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
   * Abre el detalle de un veterinario consultado al backend.
   *
   * @param medico fila seleccionada.
   */
  verDetalle(medico: Medico): void {
    this.medicoDetalle = null;
    this.cargandoDetalle = true;
    this.modalDetalle.abrir();
    this.medicoService.consultar(medico.id).subscribe({
      next: (data) => {
        this.medicoDetalle = data;
        this.cargandoDetalle = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoDetalle = false;
        this.modalDetalle.cerrar();
        mostrarError(error, 'No se pudo consultar el veterinario');
      }
    });
  }

  /**
   * Nombre legible de un tipo de documento.
   *
   * @param codigo código del tipo.
   * @returns nombre del tipo, o el código si no se reconoce.
   */
  nombreTipo(codigo: string): string {
    return this.tiposDocumento.find((t) => t.codigo === codigo)?.nombre ?? codigo;
  }
}
