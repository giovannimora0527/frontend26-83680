import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Especializacion } from 'src/app/models/especializacion';
import { EspecializacionService } from './service/especializacion.service';

@Component({
  selector: 'app-especializacion',
  imports: [CommonModule],
  templateUrl: './especializacion.component.html',
  styleUrl: './especializacion.component.scss'
})
export class EspecializacionComponent implements OnInit {
  listEspecializacions: Especializacion[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;

  constructor(private readonly especializacionService: EspecializacionService) { }

  ngOnInit(): void {
    this.listar();
  }

  /** Consulta al backend los registros de especializaciones y los carga en la tabla. */
  listar(): void {
    this.especializacionService.listar().subscribe({
      next: (data) => {
        this.listEspecializacions = data;
        this.paginaActual = 1;
      },
      error: (error) => {
        console.error('Error al obtener especializaciones:', error);
        Swal.fire({
          icon: 'error',
          title: 'No fue posible cargar especializaciones',
          text: 'Verifique que el servicio backend esté en ejecución.'
        });
      }
    });
  }

  /** Registros que coinciden con el término de búsqueda (sin tildes ni mayúsculas). */
  get especializacionFiltrados(): Especializacion[] {
    const termino = this.normalizar(this.terminoBusqueda.trim());
    if (!termino) {
      return this.listEspecializacions;
    }
    return this.listEspecializacions.filter((item) =>
      [
        item.codigoEspecializacion,
        item.nombre,
        item.descripcion
      ].some((valor) => this.normalizar(String(valor ?? '')).includes(termino))
    );
  }

  get especializacionPaginados(): Especializacion[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.especializacionFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.especializacionFiltrados.length / this.registrosPorPagina);
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
