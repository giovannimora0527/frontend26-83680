import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Modal } from 'bootstrap';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { AnotacionHistoriaService } from './service/anotacion-historia.service';

@Component({
  selector: 'app-anotacion-historia',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './anotacion-historia.component.html',
  styleUrl: './anotacion-historia.component.scss'
})
export class AnotacionHistoriaComponent {
  modalInstance: Modal | null = null;
  titleModal: string = '';
  modoFormulario: string = '';
  titleBoton: string = '';

  listAnotaciones: AnotacionHistoria[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;

  anotacionSelected: AnotacionHistoria | null = null;

  constructor(private readonly anotacionService: AnotacionHistoriaService) {
    this.listar();
  }

  get anotacionesFiltradas(): AnotacionHistoria[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    if (!termino) {
      return this.listAnotaciones;
    }

    return this.listAnotaciones.filter((anotacion) => {
      const valores = [
        anotacion.id,
        anotacion.historiaId,
        anotacion.descripcion,
        anotacion.medico ? `${anotacion.medico.nombres} ${anotacion.medico.apellidos}` : ''
      ];

      return valores.some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });
  }

  get anotacionesPaginadas(): AnotacionHistoria[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.anotacionesFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.anotacionesFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  listar() {
    this.anotacionService.listar().subscribe({
      next: (data) => {
        this.listAnotaciones = data;
        this.paginaActual = 1;
      },
      error: (error) => {
        console.error('Error al obtener las anotaciones:', error);
      }
    });
  }

  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  nuevaAnotacion(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Anotación' : 'Editar Anotación';
    this.modoFormulario = modo;
    this.anotacionSelected = null;
    this.openModal(modo);
  }

  abrirEdicion(anotacion: AnotacionHistoria) {
    this.anotacionSelected = anotacion;
    this.modoFormulario = 'E';
    this.openModal(this.modoFormulario);
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Anotación' : 'Editar Anotación';
    this.titleBoton = modo === 'C' ? 'Guardar Anotación' : 'Actualizar Anotación';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearAnotacion');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }
}
