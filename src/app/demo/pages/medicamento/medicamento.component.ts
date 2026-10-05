import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Medicamento } from 'src/app/models/medicamento';
import { MedicamentoService } from './service/medicamento.service';

@Component({
  selector: 'app-medicamento',
  imports: [CommonModule],
  templateUrl: './medicamento.component.html',
  styleUrl: './medicamento.component.scss'
})
export class MedicamentoComponent implements OnInit {
  listMedicamentos: Medicamento[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;

  constructor(private readonly medicamentoService: MedicamentoService) { }

  ngOnInit(): void {
    this.listar();
  }

  /** Consulta al backend los registros de medicamentos y los carga en la tabla. */
  listar(): void {
    this.medicamentoService.listar().subscribe({
      next: (data) => {
        this.listMedicamentos = data;
        this.paginaActual = 1;
      },
      error: (error) => {
        console.error('Error al obtener medicamentos:', error);
        Swal.fire({
          icon: 'error',
          title: 'No fue posible cargar medicamentos',
          text: 'Verifique que el servicio backend esté en ejecución.'
        });
      }
    });
  }

  /** Registros que coinciden con el término de búsqueda (sin tildes ni mayúsculas). */
  get medicamentoFiltrados(): Medicamento[] {
    const termino = this.normalizar(this.terminoBusqueda.trim());
    if (!termino) {
      return this.listMedicamentos;
    }
    return this.listMedicamentos.filter((item) =>
      [
        item.nombre,
        item.descripcion
      ].some((valor) => this.normalizar(String(valor ?? '')).includes(termino))
    );
  }

  get medicamentoPaginados(): Medicamento[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.medicamentoFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.medicamentoFiltrados.length / this.registrosPorPagina);
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

  private normalizar(texto: string): string {
    return texto.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
