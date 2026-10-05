import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Cliente } from 'src/app/models/cliente';
import { ClienteService } from './service/cliente.service';

@Component({
  selector: 'app-cliente',
  imports: [CommonModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent implements OnInit {
  listClientes: Cliente[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;

  constructor(private readonly clienteService: ClienteService) { }

  ngOnInit(): void {
    this.listar();
  }

  /** Consulta al backend los registros de clientes y los carga en la tabla. */
  listar(): void {
    this.clienteService.listar().subscribe({
      next: (data) => {
        this.listClientes = data;
        this.paginaActual = 1;
      },
      error: (error) => {
        console.error('Error al obtener clientes:', error);
        Swal.fire({
          icon: 'error',
          title: 'No fue posible cargar clientes',
          text: 'Verifique que el servicio backend esté en ejecución.'
        });
      }
    });
  }

  /** Registros que coinciden con el término de búsqueda (sin tildes ni mayúsculas). */
  get clienteFiltrados(): Cliente[] {
    const termino = this.normalizar(this.terminoBusqueda.trim());
    if (!termino) {
      return this.listClientes;
    }
    return this.listClientes.filter((item) =>
      [
        item.tipoDocumento,
        item.numeroDocumento,
        item.nombres,
        item.apellidos,
        item.telefono,
        item.direccion
      ].some((valor) => this.normalizar(String(valor ?? '')).includes(termino))
    );
  }

  get clientePaginados(): Cliente[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.clienteFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.clienteFiltrados.length / this.registrosPorPagina);
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
