import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Mensajes } from '../../core/mensajes';
import { Medico, Respuesta, Usuario } from '../../core/models';
import { contiene } from '../../core/util';
import { ModalComponent } from '../../shared/modal.component';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [OrdenComponent, PaginadorComponent, FormsModule, ModalComponent, DatePipe],
  template: `
  <div class="d-flex flex-wrap align-items-center mb-3 gap-2">
    <h4 class="titulo-pagina mb-0">Gestión de usuarios</h4>
    <input class="form-control ms-auto" style="max-width:260px" placeholder="Buscar..." [(ngModel)]="filtro" (ngModelChange)="tabla.reiniciar()">
    <button class="btn btn-primary" (click)="nuevo()"><i class="bi bi-plus-lg me-1"></i>Nuevo usuario</button>
  </div>
  <div class="card"><div class="table-responsive">
    <table class="table table-hover mb-0">
      <thead><tr><th appOrden="username" [tabla]="tabla">Usuario</th><th appOrden="nombre" [tabla]="tabla">Nombre</th><th appOrden="perfil" [tabla]="tabla">Perfil</th><th appOrden="medico" [tabla]="tabla">Veterinario</th><th appOrden="acceso" [tabla]="tabla">Último acceso</th><th appOrden="activo" [tabla]="tabla">Estado</th><th></th></tr></thead>
      <tbody>
        @for (u of tabla.ver(filtrados()); track u.usuarioId) {
          <tr>
            <td class="fw-semibold">{{ u.username }}</td><td>{{ u.nombreCompleto }}<br><small class="text-muted">{{ u.email }}</small></td>
            <td><span class="badge bg-primary-subtle text-primary-emphasis">{{ u.perfilNombre }}</span></td>
            <td>{{ u.medicoNombre ?? '-' }}</td><td>{{ u.ultimoAcceso ? (u.ultimoAcceso | date:'dd/MM/yyyy HH:mm') : '-' }}</td>
            <td><span class="badge" [class]="u.activo ? 'bg-success' : 'bg-secondary'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
            <td class="text-end text-nowrap">
              <button class="btn btn-sm btn-outline-primary me-1" (click)="editar(u)" title="Editar"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm" [class]="u.activo ? 'btn-outline-danger' : 'btn-outline-success'" (click)="estado(u)"
                      [title]="u.activo ? 'Inactivar' : 'Activar'"><i class="bi" [class]="u.activo ? 'bi-person-x' : 'bi-person-check'"></i></button>
            </td>
          </tr>
        } @empty { <tr><td colspan="7" class="text-center text-muted py-4">Sin usuarios.</td></tr> }
      </tbody>
    </table>
  </div>
<app-paginador [tabla]="tabla" /></div>

  <app-modal [abierto]="modal" [titulo]="form.usuarioId ? 'Editar usuario' : 'Nuevo usuario'" (cerrar)="modal=false">
    <form #f="ngForm" class="row g-3" novalidate>
      <div class="col-md-6"><label class="form-label requerido">Usuario</label>
        <input class="form-control" name="username" [(ngModel)]="form.username" required pattern="^[a-z0-9._-]{4,50}$"
               #un="ngModel" [class.is-invalid]="un.invalid && enviado">
        <div class="invalid-feedback">4 a 50 caracteres en minúscula (letras, números, . _ -).</div></div>
      <div class="col-md-6"><label class="form-label" [class.requerido]="!form.usuarioId">Contraseña</label>
        <input class="form-control" type="password" name="password" [(ngModel)]="form.password" [required]="!form.usuarioId"
               pattern="^(?=.*[A-Za-z])(?=.*\\d).{8,72}$" #pw="ngModel" [class.is-invalid]="pw.invalid && enviado"
               [placeholder]="form.usuarioId ? 'Dejar vacío para no cambiarla' : ''">
        <div class="invalid-feedback">Mínimo 8 caracteres con letras y números.</div></div>
      @if (form.password) {
        <div class="col-md-6 offset-md-6"><label class="form-label requerido">Confirmar contraseña</label>
          <input class="form-control" type="password" name="confirmacion" [(ngModel)]="confirmacion" autocomplete="new-password"
                 [class.is-invalid]="enviado && confirmacion !== form.password">
          <div class="invalid-feedback">Las contraseñas no coinciden.</div></div>
      }
      <div class="col-md-6"><label class="form-label requerido">Nombre completo</label>
        <input class="form-control" name="nombre" [(ngModel)]="form.nombreCompleto" required maxlength="150" #nc="ngModel" [class.is-invalid]="nc.invalid && enviado"></div>
      <div class="col-md-6"><label class="form-label">Correo</label>
        <input class="form-control" type="email" name="email" [(ngModel)]="form.email" email #em="ngModel" [class.is-invalid]="em.invalid && enviado"></div>
      <div class="col-md-6"><label class="form-label requerido">Perfil</label>
        <select class="form-select" name="perfil" [(ngModel)]="form.perfilId" required #pf="ngModel" [class.is-invalid]="pf.invalid && enviado">
          @for (p of perfiles; track p.perfilId) { <option [ngValue]="p.perfilId">{{ p.nombre }}</option> }
        </select></div>
      @if (esPerfilMedico()) {
        <div class="col-md-6"><label class="form-label requerido">Veterinario asociado</label>
          <select class="form-select" name="medico" [(ngModel)]="form.medicoId" required #md="ngModel" [class.is-invalid]="md.invalid && enviado">
            @for (m of medicos; track m.id) { <option [ngValue]="m.id">{{ m.nombres }} {{ m.apellidos }}</option> }
          </select></div>
      }
    </form>
    <div pie><button class="btn btn-light" (click)="modal=false">Cancelar</button>
      <button class="btn btn-primary" (click)="guardar(f)">Guardar</button></div>
  </app-modal>
  `
})
export class UsuariosComponent implements OnInit {
  private api = inject(ApiService);
  usuarios: Usuario[] = [];
  perfiles: any[] = [];
  medicos: Medico[] = [];
  filtro = '';
  confirmacion = '';
  tabla = new Tabla<Usuario>({ username: x => x.username, nombre: x => x.nombreCompleto, perfil: x => x.perfilNombre, medico: x => x.medicoNombre, acceso: x => x.ultimoAcceso, activo: x => x.activo }, { campo: 'username' });
  modal = false;
  enviado = false;
  form: any = {};

  ngOnInit(): void {
    this.cargar();
    this.api.get<any[]>('/usuario/perfiles').subscribe(p => this.perfiles = p);
    this.api.get<Medico[]>('/medico/listar', { soloActivos: true }).subscribe(m => this.medicos = m);
  }

  cargar(): void { this.api.get<Usuario[]>('/usuario/listar').subscribe({ next: u => this.usuarios = u, error: e => Mensajes.error(e) }); }

  filtrados(): Usuario[] {
    return this.usuarios.filter(u => contiene(this.filtro, [u.username, u.nombreCompleto, u.perfilNombre, u.medicoNombre]));
  }

  esPerfilMedico(): boolean { return this.perfiles.find(p => p.perfilId === this.form.perfilId)?.codigo === 'MEDICO'; }

  nuevo(): void { this.form = {}; this.confirmacion = ''; this.enviado = false; this.modal = true; }

  editar(u: Usuario): void {
    this.form = { usuarioId: u.usuarioId, username: u.username, nombreCompleto: u.nombreCompleto, email: u.email,
      perfilId: u.perfilId, medicoId: u.medicoId };
    this.confirmacion = '';
    this.enviado = false; this.modal = true;
  }

  guardar(f: NgForm): void {
    this.enviado = true;
    if (f.invalid || (this.form.password && this.confirmacion !== this.form.password)) { return; }
    const body = { ...this.form, medicoId: this.esPerfilMedico() ? this.form.medicoId : null };
    const op = this.form.usuarioId ? this.api.put<Respuesta>('/usuario/actualizar', body) : this.api.post<Respuesta>('/usuario/guardar', body);
    op.subscribe({ next: r => { Mensajes.exito(r.message); this.modal = false; this.cargar(); }, error: e => Mensajes.error(e) });
  }

  async estado(u: Usuario): Promise<void> {
    if (!await Mensajes.confirmar(`¿${u.activo ? 'Inactivar' : 'Activar'} al usuario ${u.username}?`)) { return; }
    this.api.patch<Respuesta>('/usuario/cambiar-estado', {}, { usuarioId: u.usuarioId, activo: !u.activo })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.cargar(); }, error: e => Mensajes.error(e) });
  }
}
