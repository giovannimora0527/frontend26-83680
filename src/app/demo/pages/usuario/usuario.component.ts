import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { UsuarioService } from './service/usuario.service';
import { MedicoService } from '../medico/service/medico.service';
import { Perfil, UsuarioSistema } from 'src/app/models/clinica';
import { Medico } from 'src/app/models/medico';
import { normalizarTexto, obtenerMensajeError } from 'src/app/utils/utilidades';
import { PERFIL } from 'src/app/models/sesion';

/**
 * Administracion de usuarios del sistema y su perfil.
 */
@Component({
  selector: 'app-usuario',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent {
  readonly PERFIL = PERFIL;
  usuarios: UsuarioSistema[] = [];
  perfiles: Perfil[] = [];
  medicos: Medico[] = [];
  buscar = '';
  form: FormGroup;
  editando: UsuarioSistema | null = null;
  enviando = false;
  private modal: Modal | null = null;

  constructor(private readonly usuarioService: UsuarioService, medicoService: MedicoService, fb: FormBuilder) {
    this.form = fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      perfilId: [null, Validators.required],
      medicoId: [null],
      password: [''],
      activo: [true]
    });
    this.usuarioService.perfiles().subscribe({ next: (p) => this.perfiles = p });
    medicoService.listar().subscribe({ next: (m) => this.medicos = m });
    this.listar();
  }

  listar() {
    this.usuarioService.listar().subscribe({
      next: (u) => this.usuarios = u,
      error: (e: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(e), 'error')
    });
  }

  get filtrados(): UsuarioSistema[] {
    const t = normalizarTexto(this.buscar);
    return this.usuarios.filter((u) => !t || normalizarTexto(`${u.username} ${u.email} ${u.perfilNombre} ${u.medicoNombre ?? ''}`).includes(t));
  }

  get esPerfilMedico(): boolean {
    return Number(this.form.get('perfilId')?.value) === PERFIL.MEDICO;
  }

  nuevo() {
    this.editando = null;
    this.form.reset({ activo: true, perfilId: null, medicoId: null });
    this.abrir();
  }

  editar(u: UsuarioSistema) {
    this.editando = u;
    this.form.reset({ ...u, password: '' });
    this.abrir();
  }

  guardar() {
    const v = this.form.getRawValue();
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.editando && (!v.password || v.password.length < 8)) {
      Swal.fire('Contraseña', 'Debe tener mínimo 8 caracteres', 'warning');
      return;
    }
    if (this.esPerfilMedico && !v.medicoId) {
      Swal.fire('Falta el médico', 'Un usuario médico debe estar vinculado a un médico registrado', 'warning');
      return;
    }
    const u: UsuarioSistema = { ...v, id: this.editando?.id, perfilId: Number(v.perfilId),
      medicoId: this.esPerfilMedico ? v.medicoId : null, password: v.password || undefined };
    this.enviando = true;
    (this.editando ? this.usuarioService.actualizar(u) : this.usuarioService.guardar(u)).subscribe({
      next: (r) => { this.enviando = false; this.modal?.hide(); this.listar(); Swal.fire('Listo', r.message, 'success'); },
      error: (e: HttpErrorResponse) => { this.enviando = false; Swal.fire('No se pudo guardar', obtenerMensajeError(e), 'error'); }
    });
  }

  private abrir() {
    const el = document.getElementById('modalUsuario');
    if (el) {
      this.modal ??= new Modal(el);
      this.modal.show();
    }
  }
}
