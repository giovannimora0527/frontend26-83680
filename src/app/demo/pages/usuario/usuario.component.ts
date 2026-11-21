import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Usuario } from 'src/app/models/usuario';
import { UsuarioService } from './service/usuario.service';
import { Cliente } from 'src/app/models/cliente';
import { Medico } from 'src/app/models/medico';
import { ClienteService } from 'src/app/services/cliente.service';
import { MedicoService } from '../medico/service/medico.service';

@Component({
  selector: 'app-usuario',
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent {
  usuarios: Usuario[] = [];
  clientes: Cliente[] = [];
  medicos: Medico[] = [];
  formulario = { username: '', password: '', rol: 'SECRETARIA', activo: true, clienteId: undefined as number | undefined, medicoId: undefined as number | undefined };
  usuarioEditando: Usuario | null = null;
  error = '';
  guardando = false;

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly clienteService: ClienteService,
    private readonly medicoService: MedicoService
  ) {
    this.listar();
    this.clienteService.listarTodos().subscribe({
      next: (clientes) => this.clientes = clientes,
      error: (error: HttpErrorResponse) => this.error = error.error?.message ?? 'No se pudieron cargar propietarios.'
    });
    this.medicoService.listar().subscribe({
      next: (medicos) => this.medicos = medicos,
      error: (error: HttpErrorResponse) => this.error = error.error?.message ?? 'No se pudieron cargar médicos.'
    });
  }

  listar(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => this.usuarios = usuarios,
      error: (error: HttpErrorResponse) => this.error = error.error?.message ?? 'No se pudieron cargar los usuarios.'
    });
  }

  editar(usuario: Usuario): void {
    this.usuarioEditando = usuario;
    this.formulario = {
      username: usuario.username ?? '',
      password: '',
      rol: usuario.rol ?? 'SECRETARIA',
      activo: usuario.activo ?? true,
      clienteId: usuario.clienteId,
      medicoId: usuario.medicoId
    };
    this.error = '';
  }

  limpiar(): void {
    this.usuarioEditando = null;
    this.formulario = { username: '', password: '', rol: 'SECRETARIA', activo: true, clienteId: undefined, medicoId: undefined };
  }

  cambiarRol(rol: string): void {
    this.formulario.rol = rol;
    if (rol !== 'CLIENTE') this.formulario.clienteId = undefined;
    if (rol !== 'VETERINARIO') this.formulario.medicoId = undefined;
  }

  guardar(): void {
    if (this.guardando) return;
    this.guardando = true;
    this.error = '';
    const request = this.usuarioEditando?.id
      ? this.usuarioService.actualizar(this.usuarioEditando.id, this.formulario)
      : this.usuarioService.crear(this.formulario);
    request.subscribe({
      next: () => {
        this.guardando = false;
        this.limpiar();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.error = error.error?.message ?? 'No se pudo guardar el usuario.';
      }
    });
  }
}
