import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ClienteService } from './service/cliente.service';
import { CatalogoService } from 'src/app/services/catalogo.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { Cliente, ClienteRq, GENEROS, TIPOS_DOCUMENTO } from 'src/app/models/cliente';
import { MascotaOpcion } from 'src/app/models/catalogo';
import { TablaLocal } from 'src/app/utils/tabla-local';
import { ModalBootstrap } from 'src/app/utils/modal';
import { avisar, confirmar, mostrarError, notificarExito } from 'src/app/utils/mensajes';
import { fechaNoFutura, SOLO_LETRAS, TELEFONO, TEXTO_OBLIGATORIO } from 'src/app/utils/validadores';

/**
 * Pantalla de gestión de clientes: listado con búsqueda, filtro por estado,
 * orden y paginación; registro, edición, detalle (con sus mascotas) y
 * activación / inactivación. Un cliente no se elimina porque sus mascotas,
 * citas e historias quedarían huérfanas.
 */
@Component({
  selector: 'app-cliente',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './cliente.component.html'
})
export class ClienteComponent implements OnInit, OnDestroy {
  /** Tipos de documento para el combo. */
  readonly tiposDocumento = TIPOS_DOCUMENTO;
  /** Géneros para el combo. */
  readonly generos = GENEROS;

  /** Tabla de clientes resuelta en el navegador (orden inicial por apellidos). */
  readonly tabla = new TablaLocal<Cliente>(
    {
      documento: (c) => c.numeroDocumento,
      nombre: (c) => `${c.apellidos} ${c.nombres}`,
      telefono: (c) => c.telefono,
      estado: (c) => (c.activo ? 'Activo' : 'Inactivo')
    },
    (c) => `${c.tipoDocumento} ${c.numeroDocumento} ${c.nombres} ${c.apellidos} ${c.telefono ?? ''} ${c.direccion ?? ''}`,
    'nombre'
  );
  /** Filtro de estado: '' (todos), 'activo' o 'inactivo'. */
  filtroEstado = '';
  /** Indica que se está consultando el listado. */
  cargando = false;
  /** Indica que la última consulta falló. */
  error = false;

  /** Formulario reactivo del cliente. */
  form!: FormGroup;
  /** Cliente en edición (null al crear). */
  clienteEditando: Cliente | null = null;
  /** Indica que se está enviando el formulario. */
  guardando = false;

  /** Cliente mostrado en el detalle. */
  clienteDetalle: Cliente | null = null;
  /** Mascotas del cliente mostrado en el detalle. */
  mascotasDetalle: MascotaOpcion[] = [];
  /** Indica que se está consultando el detalle. */
  cargandoDetalle = false;
  /** Indica que no se pudieron consultar las mascotas del cliente. */
  errorMascotas = false;

  /** Modal del formulario. */
  private readonly modalFormulario = new ModalBootstrap('modalCliente');
  /** Modal del detalle. */
  private readonly modalDetalle = new ModalBootstrap('modalDetalleCliente');

  /**
   * @param clienteService servicio de clientes.
   * @param catalogoService servicio de catálogos, para las mascotas del cliente.
   * @param formBuilder constructor de formularios reactivos.
   */
  constructor(
    private readonly clienteService: ClienteService,
    private readonly catalogoService: CatalogoService,
    private readonly formBuilder: FormBuilder
  ) { }

  /** Crea el formulario y consulta el listado. */
  ngOnInit(): void {
    this.form = this.formBuilder.group({
      tipoDocumento: ['CC', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{5,20}$/)]],
      nombres: ['', [...TEXTO_OBLIGATORIO, SOLO_LETRAS, Validators.maxLength(100)]],
      apellidos: ['', [...TEXTO_OBLIGATORIO, SOLO_LETRAS, Validators.maxLength(100)]],
      fechaNacimiento: ['', [Validators.required, fechaNoFutura]],
      genero: [null],
      telefono: ['', [Validators.required, TELEFONO]],
      direccion: ['', Validators.maxLength(255)]
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
    return this.tabla.hayBusqueda || !!this.filtroEstado;
  }

  // ===================== Listado =====================

  /** Consulta la lista completa de clientes. */
  listar(): void {
    this.cargando = true;
    this.error = false;
    this.clienteService.listar().subscribe({
      next: (data) => {
        this.tabla.cargar(data);
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.error = true;
        this.tabla.cargar([]);
        mostrarError(error, 'No se pudieron cargar los clientes');
      }
    });
  }

  /** Aplica el filtro de estado. */
  aplicarFiltro(): void {
    const estado = this.filtroEstado;
    this.tabla.filtrar((c) => !estado || (estado === 'activo') === c.activo);
  }

  /** Quita búsqueda, filtro y orden personalizados. */
  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.tabla.filtrar(() => true);
    this.tabla.reiniciar();
  }

  // ===================== Formulario =====================

  /** Abre el formulario vacío para registrar un cliente. */
  abrirNuevo(): void {
    this.clienteEditando = null;
    this.form.reset({
      tipoDocumento: 'CC', numeroDocumento: '', nombres: '', apellidos: '',
      fechaNacimiento: '', genero: null, telefono: '', direccion: ''
    });
    this.modalFormulario.abrir();
  }

  /**
   * Abre el formulario con los datos de un cliente. Un cliente inactivo no se
   * edita: primero debe activarse.
   *
   * @param cliente cliente a editar.
   */
  abrirEdicion(cliente: Cliente): void {
    if (!cliente.activo) {
      avisar('El cliente está inactivo', 'Actívelo primero si necesita actualizar sus datos.');
      return;
    }
    this.clienteEditando = cliente;
    this.form.reset({
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      fechaNacimiento: cliente.fechaNacimiento,
      genero: cliente.genero || null,
      telefono: cliente.telefono,
      direccion: cliente.direccion ?? ''
    });
    this.modalFormulario.abrir();
  }

  /** Cierra el formulario sin guardar. */
  cerrarFormulario(): void {
    this.modalFormulario.cerrar();
  }

  /** Envía el formulario: crea el cliente o actualiza el que se está editando. */
  guardar(): void {
    if (this.guardando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const clienteRq: ClienteRq = {
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: String(v.numeroDocumento).trim().toUpperCase(),
      nombres: String(v.nombres).trim(),
      apellidos: String(v.apellidos).trim(),
      fechaNacimiento: v.fechaNacimiento,
      genero: v.genero || null,
      telefono: String(v.telefono).trim(),
      direccion: String(v.direccion ?? '').trim()
    };

    this.guardando = true;
    const peticion = this.clienteEditando
      ? this.clienteService.actualizar(this.clienteEditando.clienteId, clienteRq)
      : this.clienteService.guardar(clienteRq);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando = false;
        notificarExito(respuesta.message);
        this.modalFormulario.cerrar();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error, 'No se pudo guardar el cliente');
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

  // ===================== Detalle y estado =====================

  /**
   * Abre el detalle del cliente con la lista de sus mascotas.
   *
   * @param cliente fila seleccionada.
   */
  verDetalle(cliente: Cliente): void {
    this.clienteDetalle = null;
    this.mascotasDetalle = [];
    this.errorMascotas = false;
    this.cargandoDetalle = true;
    this.modalDetalle.abrir();

    this.clienteService.consultar(cliente.clienteId).subscribe({
      next: (data) => {
        this.clienteDetalle = data;
        this.cargandoDetalle = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoDetalle = false;
        this.modalDetalle.cerrar();
        mostrarError(error, 'No se pudo consultar el cliente');
      }
    });
    this.catalogoService.listarMascotasPorCliente(cliente.clienteId).subscribe({
      next: (data) => (this.mascotasDetalle = data),
      error: () => (this.errorMascotas = true)
    });
  }

  /**
   * Activa o inactiva un cliente tras confirmar con el usuario.
   *
   * @param cliente cliente de la fila.
   */
  async cambiarEstado(cliente: Cliente): Promise<void> {
    const activar = !cliente.activo;
    const nombre = `${cliente.nombres} ${cliente.apellidos}`;
    const confirmado = await confirmar(
      activar ? `¿Activar a ${nombre}?` : `¿Inactivar a ${nombre}?`,
      activar
        ? 'Podrá volver a agendar citas y registrar mascotas.'
        : 'No podrá agendar nuevas citas. Su información y la de sus mascotas se conserva.',
      activar ? 'Sí, activar' : 'Sí, inactivar'
    );
    if (!confirmado) {
      return;
    }
    this.clienteService.cambiarEstado(cliente.clienteId, activar).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.listar();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cambiar el estado del cliente')
    });
  }

  /**
   * Nombre legible de un código de la lista (tipo de documento o género).
   *
   * @param lista opciones con código y nombre.
   * @param codigo código guardado.
   * @returns nombre de la opción, o el código si no se encuentra.
   */
  nombreDe(lista: { codigo: string; nombre: string }[], codigo: string | null | undefined): string {
    return lista.find((o) => o.codigo === codigo)?.nombre ?? (codigo || '—');
  }
}
