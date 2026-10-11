import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Cliente } from 'src/app/models/cliente';
import { ClienteService } from './service/cliente.service';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent implements OnInit {

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  terminoBusqueda = '';
  cargando = false;
  mensajeError = '';

  constructor(private readonly clienteService: ClienteService) {}

  ngOnInit(): void {
    this.listarClientes();
  }

  listarClientes(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        this.clientes = data ?? [];
        this.filtrarClientes();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar los clientes:', error);
        this.mensajeError =
          'No fue posible cargar los clientes. Verifica que el backend esté funcionando.';
        this.cargando = false;
      }
    });
  }

  filtrarClientes(): void {
    const termino = this.normalizar(this.terminoBusqueda);

    this.clientesFiltrados = this.clientes.filter((cliente) => {
      const datos = [
        cliente.tipoDocumento,
        cliente.numeroDocumento,
        cliente.nombres,
        cliente.apellidos,
        cliente.direccion
      ];

      return datos.some((valor) =>
        this.normalizar(String(valor ?? '')).includes(termino)
      );
    });
  }

  private normalizar(texto: string): string {
    return texto
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}