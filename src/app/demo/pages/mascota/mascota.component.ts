import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { MascotaService } from './service/mascota.service';
import { RazaService } from '../raza/service/raza.service';
import { CatalogoService } from 'src/app/services/catalogo.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { EDAD_MAXIMA_MASCOTA, Mascota, MascotaRq } from 'src/app/models/mascota';
import { Raza } from 'src/app/models/raza';
import { ClienteOpcion } from 'src/app/models/catalogo';
import { TablaLocal } from 'src/app/utils/tabla-local';
import { ModalBootstrap } from 'src/app/utils/modal';
import { normalizarTexto } from 'src/app/utils/texto';
import { mostrarError, notificarExito } from 'src/app/utils/mensajes';
import { SOLO_LETRAS, TEXTO_OBLIGATORIO } from 'src/app/utils/validadores';

/**
 * Pantalla de gestión de mascotas: listado con búsqueda, filtro por especie,
 * orden y paginación; registro (para un cliente activo), edición y detalle.
 * El dueño no cambia al editar porque la mascota arrastra sus citas e
 * historias; las mascotas no se eliminan por la misma razón.
 */
@Component({
  selector: 'app-mascota',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './mascota.component.html'
})
export class MascotaComponent implements OnInit, OnDestroy {
  /** Edad máxima aceptada. */
  readonly edadMaxima = EDAD_MAXIMA_MASCOTA;

  /** Tabla de mascotas resuelta en el navegador (orden inicial por nombre). */
  readonly tabla = new TablaLocal<Mascota>(
    {
      nombre: (m) => m.nombreMascota,
      especie: (m) => `${m.raza?.especie} ${m.raza?.nombre}`,
      raza: (m) => m.raza?.nombre,
      edad: (m) => m.edad,
      dueno: (m) => `${m.cliente?.nombres} ${m.cliente?.apellidos}`,
      registro: (m) => m.fechaRegistro
    },
    (m) => `${m.nombreMascota} ${m.raza?.especie ?? ''} ${m.raza?.nombre ?? ''} `
      + `${m.cliente?.nombres ?? ''} ${m.cliente?.apellidos ?? ''}`,
    'nombre'
  );
  /** Especie seleccionada en el filtro (vacío = todas). */
  filtroEspecie = '';
  /** Indica que se está consultando el listado. */
  cargando = false;
  /** Indica que la última consulta falló. */
  error = false;

  /** Clientes activos para el combo del formulario. */
  clientes: ClienteOpcion[] = [];
  /** Todas las razas. */
  razas: Raza[] = [];
  /** Especies distintas presentes en las razas. */
  especies: string[] = [];

  /** Formulario reactivo de la mascota. */
  form!: FormGroup;
  /** Mascota en edición (null al crear). */
  mascotaEditando: Mascota | null = null;
  /** Indica que se está enviando el formulario. */
  guardando = false;

  /** Mascota mostrada en el detalle. */
  mascotaDetalle: Mascota | null = null;
  /** Indica que se está consultando el detalle. */
  cargandoDetalle = false;

  /** Lista completa, para validar nombres repetidos por cliente. */
  private mascotas: Mascota[] = [];
  /** Suscripciones permanentes que se cierran al destruir el componente. */
  private readonly suscripciones = new Subscription();
  /** Modal del formulario. */
  private readonly modalFormulario = new ModalBootstrap('modalMascota');
  /** Modal del detalle. */
  private readonly modalDetalle = new ModalBootstrap('modalDetalleMascota');

  /**
   * @param mascotaService servicio de mascotas.
   * @param razaService servicio de razas.
   * @param catalogoService servicio de catálogos, para los clientes activos.
   * @param formBuilder constructor de formularios reactivos.
   */
  constructor(
    private readonly mascotaService: MascotaService,
    private readonly razaService: RazaService,
    private readonly catalogoService: CatalogoService,
    private readonly formBuilder: FormBuilder
  ) { }

  /** Crea el formulario, carga catálogos y consulta el listado. */
  ngOnInit(): void {
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      nombreMascota: ['', [...TEXTO_OBLIGATORIO, SOLO_LETRAS, Validators.maxLength(100)]],
      especie: ['', Validators.required],
      razaId: [{ value: null, disabled: true }, Validators.required],
      edad: [null, [Validators.required, Validators.pattern(/^\d+$/), Validators.min(0), Validators.max(EDAD_MAXIMA_MASCOTA)]]
    });
    // Combo dependiente: al elegir la especie solo se ofrecen sus razas.
    this.suscripciones.add(this.f['especie'].valueChanges.subscribe(() => this.alCambiarEspecie()));

    this.listar();
    this.catalogoService.listarClientes().subscribe({
      next: (data) => (this.clientes = data),
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cargar la lista de clientes')
    });
    this.razaService.listar().subscribe({
      next: (data) => {
        this.razas = data;
        this.especies = [...new Set(data.map((r) => r.especie))].sort((a, b) => a.localeCompare(b, 'es'));
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cargar la lista de razas')
    });
  }

  /** Cierra suscripciones y libera los modales. */
  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
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

  /** Razas de la especie elegida en el formulario. */
  get razasDeEspecie(): Raza[] {
    const especie = this.f['especie'].value;
    return this.razas.filter((r) => r.especie === especie);
  }

  /** Indica que el dueño ya tiene otra mascota con ese nombre. */
  get nombreDuplicado(): boolean {
    const nombre = normalizarTexto(this.f['nombreMascota'].value);
    const clienteId = this.mascotaEditando?.cliente.clienteId ?? this.f['clienteId'].value;
    return !!nombre && !!clienteId && this.mascotas.some((m) =>
      m.mascotaId !== this.mascotaEditando?.mascotaId &&
      m.cliente?.clienteId === clienteId && normalizarTexto(m.nombreMascota) === nombre);
  }

  // ===================== Listado =====================

  /** Consulta la lista completa de mascotas. */
  listar(): void {
    this.cargando = true;
    this.error = false;
    this.mascotaService.listar().subscribe({
      next: (data) => {
        this.mascotas = data;
        this.tabla.cargar(data);
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.error = true;
        this.tabla.cargar([]);
        mostrarError(error, 'No se pudieron cargar las mascotas');
      }
    });
  }

  /** Aplica el filtro por especie. */
  aplicarFiltro(): void {
    const especie = this.filtroEspecie;
    this.tabla.filtrar((m) => !especie || m.raza?.especie === especie);
  }

  /** Quita búsqueda, filtro y orden personalizados. */
  limpiarFiltros(): void {
    this.filtroEspecie = '';
    this.tabla.filtrar(() => true);
    this.tabla.reiniciar();
  }

  // ===================== Formulario =====================

  /** Al cambiar la especie limpia la raza y habilita solo las razas de esa especie. */
  private alCambiarEspecie(): void {
    const raza = this.f['razaId'];
    raza.reset(null, { emitEvent: false });
    if (this.f['especie'].value) {
      raza.enable({ emitEvent: false });
    } else {
      raza.disable({ emitEvent: false });
    }
  }

  /** Abre el formulario vacío para registrar una mascota. */
  abrirNueva(): void {
    this.mascotaEditando = null;
    this.form.reset({ clienteId: null, nombreMascota: '', especie: '', razaId: null, edad: null }, { emitEvent: false });
    this.f['clienteId'].enable({ emitEvent: false });
    this.f['razaId'].disable({ emitEvent: false });
    this.modalFormulario.abrir();
  }

  /**
   * Abre el formulario con los datos de una mascota; el dueño queda fijo.
   *
   * @param mascota mascota a editar.
   */
  abrirEdicion(mascota: Mascota): void {
    this.mascotaEditando = mascota;
    this.form.reset({
      clienteId: mascota.cliente?.clienteId ?? null,
      nombreMascota: mascota.nombreMascota,
      especie: mascota.raza?.especie ?? '',
      razaId: mascota.raza?.razaId ?? null,
      edad: mascota.edad
    }, { emitEvent: false });
    this.f['clienteId'].disable({ emitEvent: false });
    this.f['razaId'].enable({ emitEvent: false });
    this.modalFormulario.abrir();
  }

  /** Cierra el formulario sin guardar. */
  cerrarFormulario(): void {
    this.modalFormulario.cerrar();
  }

  /** Envía el formulario: crea la mascota o actualiza la que se está editando. */
  guardar(): void {
    if (this.guardando) {
      return;
    }
    if (this.form.invalid || this.nombreDuplicado) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const rq: MascotaRq = {
      nombreMascota: String(v.nombreMascota).trim(),
      edad: Number(v.edad),
      razaId: Number(v.razaId)
    };
    if (!this.mascotaEditando) {
      rq.clienteId = Number(v.clienteId);
    }

    this.guardando = true;
    const peticion = this.mascotaEditando
      ? this.mascotaService.actualizar(this.mascotaEditando.mascotaId, rq)
      : this.mascotaService.guardar(rq);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando = false;
        notificarExito(respuesta.message);
        this.modalFormulario.cerrar();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error, 'No se pudo guardar la mascota');
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
   * Abre el detalle de una mascota consultado al backend.
   *
   * @param mascota fila seleccionada.
   */
  verDetalle(mascota: Mascota): void {
    this.mascotaDetalle = null;
    this.cargandoDetalle = true;
    this.modalDetalle.abrir();
    this.mascotaService.consultar(mascota.mascotaId).subscribe({
      next: (data) => {
        this.mascotaDetalle = data;
        this.cargandoDetalle = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoDetalle = false;
        this.modalDetalle.cerrar();
        mostrarError(error, 'No se pudo consultar la mascota');
      }
    });
  }
}
