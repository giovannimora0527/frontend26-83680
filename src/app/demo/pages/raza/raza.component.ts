import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { RazaService } from './service/raza.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { ESPECIES_SUGERIDAS, Raza, RazaRq } from 'src/app/models/raza';
import { Mascota } from 'src/app/models/mascota';
import { TablaLocal } from 'src/app/utils/tabla-local';
import { ModalBootstrap } from 'src/app/utils/modal';
import { normalizarTexto } from 'src/app/utils/texto';
import { mostrarError, notificarExito } from 'src/app/utils/mensajes';
import { SOLO_LETRAS, TEXTO_OBLIGATORIO } from 'src/app/utils/validadores';

/**
 * Pantalla de gestión de razas: listado con búsqueda, filtro por especie,
 * orden y paginación; registro, edición y detalle con las mascotas de la
 * raza. Las razas no se eliminan porque las mascotas las referencian.
 */
@Component({
  selector: 'app-raza',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './raza.component.html'
})
export class RazaComponent implements OnInit, OnDestroy {
  /** Tabla de razas resuelta en el navegador (orden inicial por especie). */
  readonly tabla = new TablaLocal<Raza>(
    {
      nombre: (r) => r.nombre,
      especie: (r) => `${r.especie} ${r.nombre}`,
      registro: (r) => r.fechaCreacion
    },
    (r) => `${r.nombre} ${r.especie}`,
    'especie'
  );
  /** Especies presentes en los datos más las sugeridas, para el filtro y el formulario. */
  especies: string[] = [...ESPECIES_SUGERIDAS];
  /** Especie seleccionada en el filtro (vacío = todas). */
  filtroEspecie = '';
  /** Indica que se está consultando el listado. */
  cargando = false;
  /** Indica que la última consulta falló. */
  error = false;

  /** Formulario reactivo de la raza. */
  form!: FormGroup;
  /** Raza en edición (null al crear). */
  razaEditando: Raza | null = null;
  /** Indica que se está enviando el formulario. */
  guardando = false;

  /** Raza mostrada en el detalle. */
  razaDetalle: Raza | null = null;
  /** Mascotas registradas con la raza del detalle. */
  mascotasDetalle: Mascota[] = [];
  /** Indica que se está consultando el detalle. */
  cargandoDetalle = false;
  /** Indica que no se pudieron consultar las mascotas de la raza. */
  errorMascotas = false;

  /** Lista completa, para validar duplicados antes de enviar. */
  private razas: Raza[] = [];
  /** Modal del formulario. */
  private readonly modalFormulario = new ModalBootstrap('modalRaza');
  /** Modal del detalle. */
  private readonly modalDetalle = new ModalBootstrap('modalDetalleRaza');

  /**
   * @param razaService servicio de razas.
   * @param formBuilder constructor de formularios reactivos.
   */
  constructor(
    private readonly razaService: RazaService,
    private readonly formBuilder: FormBuilder
  ) { }

  /** Crea el formulario y consulta el listado. */
  ngOnInit(): void {
    this.form = this.formBuilder.group({
      nombre: ['', [...TEXTO_OBLIGATORIO, SOLO_LETRAS, Validators.maxLength(100)]],
      especie: ['', [...TEXTO_OBLIGATORIO, SOLO_LETRAS, Validators.maxLength(100)]]
    });
    this.listar();
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
    return this.tabla.hayBusqueda || !!this.filtroEspecie;
  }

  /** Indica que ya existe otra raza con el mismo nombre en la misma especie. */
  get duplicada(): boolean {
    const nombre = normalizarTexto(this.f['nombre'].value);
    const especie = normalizarTexto(this.f['especie'].value);
    return !!nombre && !!especie && this.razas.some((r) =>
      r.razaId !== this.razaEditando?.razaId &&
      normalizarTexto(r.nombre) === nombre && normalizarTexto(r.especie) === especie);
  }

  // ===================== Listado =====================

  /** Consulta la lista completa de razas. */
  listar(): void {
    this.cargando = true;
    this.error = false;
    this.razaService.listar().subscribe({
      next: (data) => {
        this.razas = data;
        this.tabla.cargar(data);
        const enUso = data.map((r) => r.especie).filter((e) => !!e);
        this.especies = [...new Set([...enUso, ...ESPECIES_SUGERIDAS])].sort((a, b) => a.localeCompare(b, 'es'));
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.error = true;
        this.tabla.cargar([]);
        mostrarError(error, 'No se pudieron cargar las razas');
      }
    });
  }

  /** Aplica el filtro por especie. */
  aplicarFiltro(): void {
    const especie = normalizarTexto(this.filtroEspecie);
    this.tabla.filtrar((r) => !especie || normalizarTexto(r.especie) === especie);
  }

  /** Quita búsqueda, filtro y orden personalizados. */
  limpiarFiltros(): void {
    this.filtroEspecie = '';
    this.tabla.filtrar(() => true);
    this.tabla.reiniciar();
  }

  // ===================== Formulario =====================

  /** Abre el formulario vacío para registrar una raza. */
  abrirNueva(): void {
    this.razaEditando = null;
    this.form.reset({ nombre: '', especie: this.filtroEspecie || '' });
    this.modalFormulario.abrir();
  }

  /**
   * Abre el formulario con los datos de una raza.
   *
   * @param raza raza a editar.
   */
  abrirEdicion(raza: Raza): void {
    this.razaEditando = raza;
    this.form.reset({ nombre: raza.nombre, especie: raza.especie });
    this.modalFormulario.abrir();
  }

  /** Cierra el formulario sin guardar. */
  cerrarFormulario(): void {
    this.modalFormulario.cerrar();
  }

  /** Envía el formulario: crea la raza o actualiza la que se está editando. */
  guardar(): void {
    if (this.guardando) {
      return;
    }
    if (this.form.invalid || this.duplicada) {
      this.form.markAllAsTouched();
      return;
    }

    // Si la especie ya existe (sin importar mayúsculas o tildes) se usa la misma escritura,
    // para no partir el filtro en "canino" y "Canino".
    const especieEscrita = String(this.f['especie'].value).trim();
    const especie = this.especies.find((e) => normalizarTexto(e) === normalizarTexto(especieEscrita)) ?? especieEscrita;
    const razaRq: RazaRq = {
      nombre: String(this.f['nombre'].value).trim(),
      especie
    };

    this.guardando = true;
    const peticion = this.razaEditando
      ? this.razaService.actualizar(this.razaEditando.razaId, razaRq)
      : this.razaService.guardar(razaRq);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando = false;
        notificarExito(respuesta.message);
        this.modalFormulario.cerrar();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error, 'No se pudo guardar la raza');
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
   * Abre el detalle de la raza con las mascotas registradas en ella.
   *
   * @param raza fila seleccionada.
   */
  verDetalle(raza: Raza): void {
    this.razaDetalle = null;
    this.mascotasDetalle = [];
    this.errorMascotas = false;
    this.cargandoDetalle = true;
    this.modalDetalle.abrir();

    this.razaService.consultar(raza.razaId).subscribe({
      next: (data) => {
        this.razaDetalle = data;
        this.cargandoDetalle = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoDetalle = false;
        this.modalDetalle.cerrar();
        mostrarError(error, 'No se pudo consultar la raza');
      }
    });
    this.razaService.listarMascotas(raza.razaId).subscribe({
      next: (data) => (this.mascotasDetalle = data),
      error: () => (this.errorMascotas = true)
    });
  }
}
