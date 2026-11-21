import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Cliente } from 'src/app/models/cliente';
import { ClienteService } from 'src/app/services/cliente.service';

type ClienteForm = Cliente;

@Component({
  selector: 'app-cliente',
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente.component.html'
})
export class ClienteComponent {
  clientes: Cliente[] = [];
  formulario: ClienteForm = this.nuevoFormulario();
  editando = false;
  guardando = false;
  error = '';

  constructor(private readonly clienteService: ClienteService) {
    this.listar();
  }

  listar(): void {
    this.clienteService.listarTodos().subscribe({
      next: (clientes) => this.clientes = clientes,
      error: (error: HttpErrorResponse) => this.error = error.error?.message ?? 'No se pudieron cargar los propietarios.'
    });
  }

  editar(cliente: Cliente): void {
    this.formulario = {
      ...cliente,
      fechaNacimiento: cliente.fechaNacimiento
        ? new Date(cliente.fechaNacimiento).toISOString().slice(0, 10)
        : ''
    };
    this.editando = true;
    this.error = '';
  }

  limpiar(): void {
    this.formulario = this.nuevoFormulario();
    this.editando = false;
    this.error = '';
  }

  guardar(): void {
    if (this.guardando) return;
    this.guardando = true;
    this.error = '';
    const request = this.editando
      ? this.clienteService.actualizar(this.formulario)
      : this.clienteService.guardar(this.formulario);
    request.subscribe({
      next: () => {
        this.guardando = false;
        this.limpiar();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.error = error.error?.message ?? 'No se pudo guardar el propietario.';
      }
    });
  }

  private nuevoFormulario(): ClienteForm {
    return { tipoDocumento: '', numeroDocumento: '', nombres: '', apellidos: '', fechaNacimiento: '', genero: '', telefono: '', direccion: '', activo: true };
  }
}
