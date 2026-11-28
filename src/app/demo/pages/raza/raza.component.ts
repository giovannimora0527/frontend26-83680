import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { Raza } from 'src/app/models/raza';
import { RazaService } from './service/raza.service';
import Swal from 'sweetalert2';

type ColumnaOrden = 'nombre' | 'especie';
type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (element: Element) => ModalBootstrap } };

@Component({
  selector: 'app-raza',
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './raza.component.html',
  styleUrl: './raza.component.scss'
})
export class RazaComponent {

  modalInstance: ModalBootstrap | null = null;
  titleModal = '';
  modoFormulario = '';
  titleBoton = '';

  listRazas: Raza[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'nombre';
  direccionOrden: 'asc' | 'desc' = 'asc';

  form!: FormGroup;
  razaSelected: Raza | null = null;
  enviando = false;
  respuestaError = '';
  errorRazas = '';

  constructor(
    private readonly razaService: RazaService,
    private readonly formBuilder: FormBuilder
  ) {
    this.inicializarFormulario();
    this.listar();
  }

  inicializarFormulario(): void {
    this.form = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.pattern(/\S/)]],
      especie: ['', [Validators.required, Validators.pattern(/\S/)]]
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  listar(): void {
    this.errorRazas = '';
    this.razaService.listar().subscribe({
      next: (data) => {
        this.listRazas = data;
        this.paginaActual = Math.min(this.paginaActual, this.totalPaginas || 1);
      },
      error: (err) => {
        this.errorRazas = 'No fue posible cargar las razas.';
        console.error('Error al listar razas:', err);
      }
    });
  }

  get razasFiltradas(): Raza[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filtradas = this.listRazas.filter((raza) => {
      if (!termino) return true;
      return [raza.nombre, raza.especie].some((v) =>
        this.normalizarTexto(String(v ?? '')).includes(termino)
      );
    });

    return [...filtradas].sort((a, b) => {
      const valorA = this.columnaOrden === 'nombre' ? (a.nombre ?? '') : (a.especie ?? '');
      const valorB = this.columnaOrden === 'nombre' ? (b.nombre ?? '') : (b.especie ?? '');
      const cmp = String(valorA).localeCompare(String(valorB), 'es', { numeric: true, sensitivity: 'base' });
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

  get razasPaginadas(): Raza[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.razasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.razasFiltradas.length / this.registrosPorPagina);
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

  nuevaRaza(modo: string): void {
    this.modoFormulario = modo;
    this.razaSelected = null;
    this.resetFormulario();
    this.openModal(modo);
  }

  resetFormulario(): void {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.respuestaError = '';
  }

  abrirEdicion(raza: Raza): void {
    this.razaSelected = raza;
    this.modoFormulario = 'E';
    this.form.patchValue({
      nombre: raza.nombre,
      especie: raza.especie
    });
    this.openModal('E');
  }

  guardarRaza(): void {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const raza: Raza = {
      razaId: this.modoFormulario === 'E' ? this.razaSelected?.razaId : undefined,
      nombre: valores.nombre.trim(),
      especie: valores.especie.trim()
    };

    this.enviando = true;
    this.respuestaError = '';
    this.razaService.guardar(raza).subscribe({
      next: (respuesta) => {
        this.enviando = false;
        const mensaje = this.obtenerMensaje(respuesta,
          this.modoFormulario === 'C' ? 'La raza fue creada correctamente.' : 'La raza fue actualizada correctamente.');
        this.closeModal();
        this.listar();
        void Swal.fire('Operación exitosa', mensaje, 'success');
      },
      error: (error) => {
        this.enviando = false;
        this.respuestaError = error?.error?.message ?? error?.error?.mensaje
          ?? 'No fue posible guardar la raza.';
        console.error('Error al guardar la raza:', error);
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
    this.titleModal = modo === 'C' ? 'Crear Raza' : 'Editar Raza';
    this.titleBoton = modo === 'C' ? 'Guardar Raza' : 'Actualizar Raza';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearRaza');
    if (modalElement) {
      this.modalInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }
}
