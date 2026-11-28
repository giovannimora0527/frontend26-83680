import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import { Usuario } from 'src/app/models/usuario';
import { Medico } from 'src/app/models/medico';
import { UsuarioService, PerfilRs } from './service/usuario.service';
import { MedicoService } from '../medico/service/medico.service';

declare var bootstrap: any;

type ModalBootstrap = { show(): void; hide(): void };

@Component({
  selector: 'app-usuario',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent implements OnInit {

  modalInstance: ModalBootstrap | null = null;
  titleModal = '';
  modoFormulario: 'crear' | 'editar' = 'crear';
  guardando = false;
  cargando = true;

  listUsuarios: Usuario[] = [];
  listPerfiles: PerfilRs[] = [];
  listMedicos: Medico[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 8;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private medicoService: MedicoService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarDatos();
  }

  private initForm(): void {
    this.form = this.fb.group({
      id: [null],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      perfilId: [null, Validators.required],
      activo: [true],
      medicoId: [null]
    });

    this.form.get('perfilId')?.valueChanges.subscribe(() => this.ajustarValidacionMedico());
  }

  private ajustarValidacionMedico(): void {
    const perfilId = this.form.get('perfilId')?.value;
    const perfil = this.listPerfiles.find(p => p.perfilId === +perfilId);
    const medicoCtrl = this.form.get('medicoId')!;
    if (perfil?.nombre === 'Medico') {
      medicoCtrl.setValidators(Validators.required);
    } else {
      medicoCtrl.clearValidators();
      medicoCtrl.setValue(null);
    }
    medicoCtrl.updateValueAndValidity();
  }

  get esPefilMedico(): boolean {
    const perfilId = this.form.get('perfilId')?.value;
    const perfil = this.listPerfiles.find(p => p.perfilId === +perfilId);
    return perfil?.nombre === 'Medico';
  }

  private cargarDatos(): void {
    this.cargando = true;
    forkJoin({
      usuarios: this.usuarioService.getUsuarios(),
      perfiles: this.usuarioService.getPerfiles(),
      medicos: this.medicoService.listar()
    }).subscribe({
      next: ({ usuarios, perfiles, medicos }) => {
        this.listUsuarios = usuarios;
        this.listPerfiles = perfiles.filter(p => p.activo);
        this.listMedicos = medicos.filter(m => m.estado);
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  get usuariosFiltrados(): Usuario[] {
    const term = this.terminoBusqueda.toLowerCase();
    const filtered = term
      ? this.listUsuarios.filter(u =>
          u.username?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.rol?.toLowerCase().includes(term))
      : this.listUsuarios;
    const start = (this.paginaActual - 1) * this.registrosPorPagina;
    return filtered.slice(start, start + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    const term = this.terminoBusqueda.toLowerCase();
    const total = term
      ? this.listUsuarios.filter(u =>
          u.username?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.rol?.toLowerCase().includes(term)).length
      : this.listUsuarios.length;
    return Math.max(1, Math.ceil(total / this.registrosPorPagina));
  }

  abrirModalCrear(): void {
    this.modoFormulario = 'crear';
    this.titleModal = 'Nuevo Usuario';
    this.form.reset({ activo: true, id: null, medicoId: null });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.abrirModal();
  }

  abrirModalEditar(u: Usuario): void {
    this.modoFormulario = 'editar';
    this.titleModal = 'Editar Usuario';
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.form.patchValue({
      id: u.id,
      username: u.username,
      email: u.email,
      password: '',
      perfilId: u.perfilId,
      activo: u.activo,
      medicoId: u.medicoId ?? null
    });
    this.abrirModal();
  }

  private abrirModal(): void {
    if (!this.modalInstance) {
      const el = document.getElementById('modalUsuario');
      if (el) this.modalInstance = new bootstrap.Modal(el);
    }
    this.modalInstance?.show();
  }

  guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.guardando = true;
    const rq: Usuario = { ...this.form.value };
    if (!rq.password) delete rq.password;
    if (!this.esPefilMedico) rq.medicoId = null;

    const obs = this.modoFormulario === 'crear'
      ? this.usuarioService.crear(rq)
      : this.usuarioService.actualizar(rq);

    obs.subscribe({
      next: () => {
        this.guardando = false;
        this.modalInstance?.hide();
        this.cargarDatos();
        Swal.fire({ icon: 'success', title: 'Éxito',
          text: this.modoFormulario === 'crear' ? 'Usuario creado.' : 'Usuario actualizado.',
          timer: 1800, showConfirmButton: false });
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire({ icon: 'error', title: 'Error',
          text: err?.error?.message || 'No se pudo guardar el usuario.' });
      }
    });
  }

  toggleActivo(u: Usuario): void {
    const rq: Usuario = {
      id: u.id, username: u.username!, email: u.email!,
      perfilId: u.perfilId, activo: !u.activo, medicoId: u.medicoId
    };
    this.usuarioService.actualizar(rq).subscribe({
      next: () => { u.activo = !u.activo; },
      error: (err) => Swal.fire({ icon: 'error', title: 'Error',
        text: err?.error?.message || 'No se pudo cambiar el estado.' })
    });
  }

  campoInvalido(campo: string): boolean {
    const ctrl = this.form.get(campo);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  nombreMedico(medicoId?: number | null): string {
    if (!medicoId) return '—';
    const m = this.listMedicos.find(x => x.id === medicoId);
    return m ? `${m.nombres} ${m.apellidos}` : '—';
  }
}
