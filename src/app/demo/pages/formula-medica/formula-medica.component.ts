import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Modal } from 'bootstrap';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { FormulaMedicaService } from './service/formula-medica.service';

@Component({
  selector: 'app-formula-medica',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './formula-medica.component.html',
  styleUrl: './formula-medica.component.scss'
})
export class FormulaMedicaComponent {
  modalInstance: Modal | null = null;
  titleModal: string = '';
  modoFormulario: string = '';
  titleBoton: string = '';

  listFormulas: FormulaMedica[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;

  formulaSelected: FormulaMedica | null = null;

  constructor(private readonly formulaService: FormulaMedicaService) {
    this.listar();
  }

  get formulasFiltradas(): FormulaMedica[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    if (!termino) {
      return this.listFormulas;
    }

    return this.listFormulas.filter((formula) => {
      const valores = [
        formula.id,
        formula.citaId,
        formula.medicamentoId,
        formula.dosis,
        formula.indicaciones,
        formula.medicamento?.nombre
      ];

      return valores.some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });
  }

  get formulasPaginadas(): FormulaMedica[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.formulasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.formulasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  listar() {
    this.formulaService.listar().subscribe({
      next: (data) => {
        this.listFormulas = data;
        this.paginaActual = 1;
      },
      error: (error) => {
        console.error('Error al obtener las fórmulas médicas:', error);
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

  nuevaFormula(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Fórmula Médica' : 'Editar Fórmula Médica';
    this.modoFormulario = modo;
    this.formulaSelected = null;
    this.openModal(modo);
  }

  abrirEdicion(formula: FormulaMedica) {
    this.formulaSelected = formula;
    this.modoFormulario = 'E';
    this.openModal(this.modoFormulario);
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Fórmula Médica' : 'Editar Fórmula Médica';
    this.titleBoton = modo === 'C' ? 'Guardar Fórmula Médica' : 'Actualizar Fórmula Médica';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearFormulaMedica');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }
}
