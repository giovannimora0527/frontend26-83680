import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { Cliente } from 'src/app/models/cliente';
import { ClienteService } from './service/cliente.service';
import Swal from 'sweetalert2';

type ColumnaOrden = 'nombres' | 'apellidos' | 'numeroDocumento' | 'tipoDocumento';
type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (element: Element) => ModalBootstrap } };

@Component({
  selector: 'app-cliente',
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent {

  modalInstance: ModalBootstrap | null = null;
  titleModal = '';
  modoFormulario = '';
  titleBoton = '';

  listClientes: Cliente[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'nombres';
  direccionOrden: 'asc' | 'desc' = 'asc';

  form!: FormGroup;
  clienteSelected: Cliente | null = null;
  enviando = false;
  respuestaError = '';
  errorClientes = '';

  readonly tiposDocumento = ['CC', 'TI', 'CE', 'PP', 'NIT'];
  readonly generos = [{ valor: 'M', etiqueta: 'Masculino' }, { valor: 'F', etiqueta: 'Femenino' }];

  constructor(
    private readonly clienteService: ClienteService,
    private readonly formBuilder: FormBuilder
  ) {
    this.inicializarFormulario();
    this.listar();
  }

  inicializarFormulario(): void {
    this.form = this.formBuilder.group({
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern(/\S/)]],
      nombres: ['', [Validators.required, Validators.pattern(/\S/)]],
      apellidos: ['', [Validators.required, Validators.pattern(/\S/)]],
      fechaNacimiento: ['', Validators.required],
      genero: [''],
      telefono: [''],
      direccion: ['']
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  listar(): void {
    this.errorClientes = '';
    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        this.listClientes = data;
        this.paginaActual = Math.min(this.paginaActual, this.totalPaginas || 1);
      },
      error: (err) => {
        this.errorClientes = 'No fue posible cargar los clientes.';
        console.error('Error al listar clientes:', err);
      }
    });
  }

  get clientesFiltrados(): Cliente[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filtrados = this.listClientes.filter((c) => {
      if (!termino) return true;
      return [c.nombres, c.apellidos, c.numeroDocumento, c.tipoDocumento, c.telefono].some((v) =>
        this.normalizarTexto(String(v ?? '')).includes(termino)
      );
    });

    return [...filtrados].sort((a, b) => {
      let valorA = '';
      let valorB = '';
      if (this.columnaOrden === 'nombres') { valorA = a.nombres ?? ''; valorB = b.nombres ?? ''; }
      else if (this.columnaOrden === 'apellidos') { valorA = a.apellidos ?? ''; valorB = b.apellidos ?? ''; }
      else if (this.columnaOrden === 'numeroDocumento') { valorA = a.numeroDocumento ?? ''; valorB = b.numeroDocumento ?? ''; }
      else if (this.columnaOrden === 'tipoDocumento') { valorA = a.tipoDocumento ?? ''; valorB = b.tipoDocumento ?? ''; }
      const cmp = valorA.localeCompare(valorB, 'es', { numeric: true, sensitivity: 'base' });
      return this.direccionOrden === 'asc' ? cmp : -cmp;
    });
  }

  ordenarPor(columna: ColumnaOrden): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }
    this.paginaActual = 1;
  }

  get clientesPaginados(): Cliente[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.clientesFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.clientesFiltrados.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  actualizarBusqueda(event: Event): void {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  private normalizarTexto(texto: string): string {
    return texto.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  nuevoCliente(): void {
    this.modoFormulario = 'C';
    this.clienteSelected = null;
    this.resetFormulario();
    this.openModal('C');
  }

  resetFormulario(): void {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.respuestaError = '';
  }

  abrirEdicion(cliente: Cliente): void {
    this.clienteSelected = cliente;
    this.modoFormulario = 'E';
    const fecha = cliente.fechaNacimiento
      ? (typeof cliente.fechaNacimiento === 'string'
          ? cliente.fechaNacimiento.substring(0, 10)
          : new Date(cliente.fechaNacimiento).toISOString().substring(0, 10))
      : '';
    this.form.patchValue({
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      fechaNacimiento: fecha,
      genero: cliente.genero ?? '',
      telefono: cliente.telefono ?? '',
      direccion: cliente.direccion ?? ''
    });
    this.openModal('E');
  }

  guardarCliente(): void {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const cliente: Cliente = {
      id: this.modoFormulario === 'E' ? this.clienteSelected?.id : undefined,
      tipoDocumento: valores.tipoDocumento,
      numeroDocumento: valores.numeroDocumento.trim(),
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      fechaNacimiento: valores.fechaNacimiento,
      genero: valores.genero || undefined,
      telefono: valores.telefono?.trim() || undefined,
      direccion: valores.direccion?.trim() || undefined
    };

    this.enviando = true;
    this.respuestaError = '';
    this.clienteService.guardar(cliente).subscribe({
      next: (respuesta) => {
        this.enviando = false;
        const mensaje = this.obtenerMensaje(respuesta,
          this.modoFormulario === 'C' ? 'El cliente fue creado correctamente.' : 'El cliente fue actualizado correctamente.');
        this.closeModal();
        this.listar();
        void Swal.fire('Operación exitosa', mensaje, 'success');
      },
      error: (error) => {
        this.enviando = false;
        this.respuestaError = error?.error?.message ?? error?.error?.mensaje
          ?? 'No fue posible guardar el cliente.';
        console.error('Error al guardar cliente:', error);
      }
    });
  }

  private obtenerMensaje(respuesta: unknown, predeterminado: string): string {
    if (respuesta && typeof respuesta === 'object') {
      const r = respuesta as { mensaje?: unknown; message?: unknown };
      const m = r.mensaje ?? r.message;
      if (typeof m === 'string') return m;
    }
    return predeterminado;
  }

  closeModal(): void {
    this.modalInstance?.hide();
    this.resetFormulario();
  }

  openModal(modo: string): void {
    this.titleModal = modo === 'C' ? 'Crear Cliente' : 'Editar Cliente';
    this.titleBoton = modo === 'C' ? 'Guardar Cliente' : 'Actualizar Cliente';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearCliente');
    if (modalElement) {
      this.modalInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }
}
