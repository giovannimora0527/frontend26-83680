import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Raza } from 'src/app/models/raza';
import { RazaService } from './service/raza.service';

@Component({
  selector: 'app-raza',
  imports: [CommonModule],
  templateUrl: './raza.component.html',
  styleUrl: './raza.component.scss'
})
export class RazaComponent implements OnInit {
  listRazas: Raza[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;

  constructor(private readonly razaService: RazaService) { }

  ngOnInit(): void {
    this.listar();
  }

  /** Consulta al backend los registros de razas y los carga en la tabla. */
  listar(): void {
    this.razaService.listar().subscribe({
      next: (data) => {
        this.listRazas = data;
        this.paginaActual = 1;
      },
      error: (error) => {
        console.error('Error al obtener razas:', error);
        Swal.fire({
          icon: 'error',
          title: 'No fue posible cargar razas',
          text: 'Verifique que el servicio backend esté en ejecución.'
        });
      }
    });
  }

  /** Registros que coinciden con el término de búsqueda (sin tildes ni mayúsculas). */
  get razaFiltrados(): Raza[] {
    const termino = this.normalizar(this.terminoBusqueda.trim());
    if (!termino) {
      return this.listRazas;
    }
    return this.listRazas.filter((item) =>
      [
        item.especie,
        item.nombre
      ].some((valor) => this.normalizar(String(valor ?? '')).includes(termino))
    );
  }

  get razaPaginados(): Raza[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.razaFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.razaFiltrados.length / this.registrosPorPagina);
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
