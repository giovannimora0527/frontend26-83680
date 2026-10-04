import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Modal } from 'bootstrap';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { HistoriaMedicaService } from './service/historia-medica.service';

@Component({
  selector: 'app-historia-medica',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './historia-medica.component.html',
  styleUrl: './historia-medica.component.scss'
})
export class HistoriaMedicaComponent {
  modalInstance: Modal | null = null;
  titleModal: string = '';
  modoFormulario: string = '';
  titleBoton: string = '';

  listHistorias: HistoriaMedica[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;

  historiaSelected: HistoriaMedica | null = null;

  constructor(private readonly historiaService: HistoriaMedicaService) {
    this.listar();
  }

  get historiasFiltradas(): HistoriaMedica[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    if (!termino) {
      return this.listHistorias;
    }

    return this.listHistorias.filter((historia) => {
      const valores = [
        historia.id,
        historia.pacienteId
      ];

      return valores.some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });
  }

  get historiasPaginadas(): HistoriaMedica[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.historiasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.historiasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  listar() {
    this.historiaService.listar().subscribe({
      next: (data) => {
        this.listHistorias = data;
        this.paginaActual = 1;
      },
      error: (error) => {
        console.error('Error al obtener las historias médicas:', error);
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

  nuevaHistoria(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Historia Médica' : 'Editar Historia Médica';
    this.modoFormulario = modo;
    this.historiaSelected = null;
    this.openModal(modo);
  }

  abrirEdicion(historia: HistoriaMedica) {
    this.historiaSelected = historia;
    this.modoFormulario = 'E';
    this.openModal(this.modoFormulario);
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Historia Médica' : 'Editar Historia Médica';
    this.titleBoton = modo === 'C' ? 'Guardar Historia Médica' : 'Actualizar Historia Médica';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearHistoriaMedica');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }
}
