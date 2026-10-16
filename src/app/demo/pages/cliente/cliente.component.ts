import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { ClienteService } from './service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { PaginacionComponent } from 'src/app/shared/paginacion/paginacion.component';
import { compararValores, normalizarTexto, obtenerMensajeError } from 'src/app/utils/utilidades';

/** Columnas por las que se puede ordenar la tabla. */
type ColumnaOrden = 'nombre' | 'documento' | 'telefono' | 'direccion' | 'estado';

/**
 * Pantalla de gestión de clientes: listado, creación, edición y detalle con sus mascotas.
 */
@Component({
  selector: 'app-cliente',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule, PaginacionComponent],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent {
  /** Tipos de documento permitidos. */
  readonly tiposDocumento = [
    { valor: 'CC', texto: 'Cédula de ciudadanía' },
    { valor: 'CE', texto: 'Cédula de extranjería' },
    { valor: 'TI', texto: 'Tarjeta de identidad' },
    { valor: 'PA', texto: 'Pasaporte' }
  ];

  // Modales.
  modalFormulario: Modal | null = null;
  modalDetalle: Modal | null = null;
  modoFormulario = '';

  // Tabla.
  listClientes: Cliente[] = [];
  cargando = false;
  terminoBusqueda = '';
  filtroEstado = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'nombre';
  direccionOrden: 'asc' | 'desc' = 'asc';

  // Formulario.
  form!: FormGroup;
  clienteSelected: Cliente | null = null;
  enviando = false;

  // Detalle.
  clienteDetalle: Cliente | null = null;
  mascotasCliente: Mascota[] = [];

  constructor(private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly formBuilder: FormBuilder) {
    this.inicializarFormulario();
    this.listar();
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
      fechaNacimiento: ['', [Validators.required, this.validarMayorDeEdad]],
      genero: [''],
      telefono: ['', Validators.pattern(/^\d{7,15}$/)],
      direccion: [''],
      activo: [true]
    });
  }

  /** Acceso corto a los controles. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Validador: el cliente debe tener mínimo 18 años.
   * @param control control de la fecha.
   * @returns error o null.
   */
  validarMayorDeEdad(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() - 18);
    return new Date(control.value) > limite ? { menorDeEdad: true } : null;
  }

  /** Trae los clientes del backend. */
  listar() {
    this.cargando = true;
    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        this.listClientes = data;
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

  /** Clientes filtrados y ordenados. */
  get clientesFiltrados(): Cliente[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());
    const filtrados = this.listClientes.filter((cliente) => {
      if (this.filtroEstado === 'activo' && !cliente.activo) {
        return false;
      }
      if (this.filtroEstado === 'inactivo' && cliente.activo) {
        return false;
      }
      if (!termino) {
        return true;
      }
      const valores = [cliente.nombres, cliente.apellidos, cliente.numeroDocumento, cliente.telefono, cliente.direccion];
      return valores.some((valor) => normalizarTexto(String(valor ?? '')).includes(termino));
    });
    return filtrados.sort((a, b) => compararValores(this.valorOrden(a), this.valorOrden(b), this.direccionOrden));
  }

  /**
   * Valor de la columna por la que se ordena.
   * @param cliente fila.
   * @returns valor.
   */
  private valorOrden(cliente: Cliente): string | number {
    switch (this.columnaOrden) {
      case 'nombre': return `${cliente.nombres} ${cliente.apellidos}`;
      case 'documento': return cliente.numeroDocumento ?? '';
      case 'telefono': return cliente.telefono ?? '';
      case 'direccion': return cliente.direccion ?? '';
      case 'estado': return cliente.activo ? 1 : 0;
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

  /** Clientes de la página actual. */
  get clientesPaginados(): Cliente[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.clientesFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  /** Total de páginas. */
  get totalPaginas(): number {
    return Math.ceil(this.clientesFiltrados.length / this.registrosPorPagina);
  }

  /** Vuelve a la primera página al filtrar. */
  filtrar() {
    this.paginaActual = 1;
  }

  /**
   * Iniciales del cliente para el círculo de la tabla.
   * @param cliente cliente.
   * @returns iniciales.
   */
  iniciales(cliente: Cliente): string {
    return `${cliente.nombres?.charAt(0) ?? ''}${cliente.apellidos?.charAt(0) ?? ''}`;
  }

  // ----------------- Crear / editar / ver -----------------

  /** Abre el modal para crear un cliente. */
  nuevoCliente() {
    this.clienteSelected = null;
    this.modoFormulario = 'C';
    this.form.reset({ tipoDocumento: 'CC', genero: '', activo: true });
    this.abrirModalFormulario();
  }

  /**
   * Abre el modal con los datos del cliente para editarlo.
   * @param cliente cliente a editar.
   */
  abrirEdicion(cliente: Cliente) {
    this.clienteSelected = cliente;
    this.modoFormulario = 'E';
    this.form.reset({
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      fechaNacimiento: cliente.fechaNacimiento,
      genero: cliente.genero ?? '',
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      activo: cliente.activo
    });
    this.abrirModalFormulario();
  }

  /** Envía el cliente al backend. */
  guardarCliente() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const cliente: Cliente = {
      clienteId: this.clienteSelected?.clienteId,
      tipoDocumento: valores.tipoDocumento,
      numeroDocumento: String(valores.numeroDocumento).trim(),
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      fechaNacimiento: valores.fechaNacimiento,
      genero: valores.genero || null,
      telefono: valores.telefono || null,
      direccion: valores.direccion,
      activo: valores.activo
    };
    this.enviando = true;
    const solicitud = this.modoFormulario === 'C'
      ? this.clienteService.crearCliente(cliente)
      : this.clienteService.actualizarCliente(cliente);
    solicitud.subscribe({
      next: (respuesta) => {
        this.enviando = false;
        this.modalFormulario?.hide();
        this.listar();
        Swal.fire('Operación exitosa', respuesta?.message ?? 'Cliente guardado', 'success');
      },
      error: (error: HttpErrorResponse) => {
        this.enviando = false;
        Swal.fire('No se pudo guardar', obtenerMensajeError(error), 'error');
      }
    });
  }

  /**
   * Muestra el detalle del cliente con sus mascotas.
   * @param cliente cliente seleccionado.
   */
  verCliente(cliente: Cliente) {
    this.clienteDetalle = cliente;
    this.mascotasCliente = [];
    this.mascotaService.listarPorCliente(cliente.clienteId!).subscribe({
      next: (data) => this.mascotasCliente = data,
      error: (error: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(error), 'error')
    });
    const modalElement = document.getElementById('modalDetalleCliente');
    if (modalElement) {
      this.modalDetalle ??= new Modal(modalElement);
      this.modalDetalle.show();
    }
  }

  /** Abre el modal del formulario. */
  abrirModalFormulario() {
    const modalElement = document.getElementById('modalCliente');
    if (modalElement) {
      this.modalFormulario ??= new Modal(modalElement);
      this.modalFormulario.show();
    }
  }
}
