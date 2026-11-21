import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Mensajes } from '../../core/mensajes';
import { Cita, Cliente, Mascota, Raza, Respuesta } from '../../core/models';
import { contiene } from '../../core/util';
import { ModalComponent } from '../../shared/modal.component';
import { EstadoComponent } from '../../shared/estado.component';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

@Component({
  selector: 'app-mascotas',
  standalone: true,
  imports: [OrdenComponent, PaginadorComponent, FormsModule, ModalComponent, EstadoComponent, DatePipe],
  template: `
  <div class="d-flex flex-wrap align-items-center mb-3 gap-2">
    <h4 class="titulo-pagina mb-0">Gestión de mascotas</h4>
    <ul class="nav nav-pills ms-3">
      <li class="nav-item"><a class="nav-link" [class.active]="tab==='m'" (click)="tab='m'">Mascotas</a></li>
      <li class="nav-item"><a class="nav-link" [class.active]="tab==='r'" (click)="tab='r'">Razas</a></li>
    </ul>
  </div>
  @if (tab === 'm') {
    <div class="d-flex gap-2 mb-2">
      <input class="form-control" style="max-width:300px" placeholder="Buscar mascota o propietario" [(ngModel)]="filtro" (ngModelChange)="tabla.reiniciar()">
      <button class="btn btn-primary ms-auto" (click)="nueva()"><i class="bi bi-plus-lg me-1"></i>Nueva mascota</button>
    </div>
    <div class="card"><div class="table-responsive">
      <table class="table table-hover mb-0">
        <thead><tr><th appOrden="nombre" [tabla]="tabla">Nombre</th><th appOrden="raza" [tabla]="tabla">Especie / raza</th><th appOrden="edad" [tabla]="tabla">Edad</th><th appOrden="sexo" [tabla]="tabla">Sexo</th><th appOrden="peso" [tabla]="tabla">Peso</th><th appOrden="prop" [tabla]="tabla">Propietario</th><th appOrden="activo" [tabla]="tabla">Estado</th><th></th></tr></thead>
        <tbody>
          @for (m of tabla.ver(filtradas()); track m.mascotaId) {
            <tr>
              <td class="fw-semibold"><i class="fa-solid fa-paw text-muted me-1"></i>{{ m.nombreMascota }}</td>
              <td>{{ m.raza.especie }} / {{ m.raza.nombre }}</td><td>{{ m.edad ?? '-' }}</td><td>{{ m.sexo ?? '-' }}</td>
              <td>{{ m.pesoKg ? m.pesoKg + ' kg' : '-' }}</td><td>{{ m.cliente.nombres }} {{ m.cliente.apellidos }}</td>
              <td><span class="badge" [class]="m.activo ? 'bg-success' : 'bg-secondary'">{{ m.activo ? 'Activa' : 'Inactiva' }}</span></td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-secondary me-1" (click)="historial(m)" title="Historial de citas"><i class="bi bi-clock-history"></i></button>
                <button class="btn btn-sm btn-outline-primary me-1" (click)="editar(m)"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm" [class]="m.activo ? 'btn-outline-danger' : 'btn-outline-success'" (click)="estado(m)">
                  <i class="bi" [class]="m.activo ? 'bi-x-circle' : 'bi-check-circle'"></i></button>
              </td>
            </tr>
          } @empty { <tr><td colspan="8" class="text-center text-muted py-4">Sin mascotas.</td></tr> }
        </tbody>
      </table>
    </div>
<app-paginador [tabla]="tabla" /></div>
  } @else {
    <div class="row g-3">
      <div class="col-lg-5"><div class="card"><div class="card-header">{{ raza.razaId ? 'Editar raza' : 'Nueva raza' }}</div><div class="card-body">
        <form #fr="ngForm" class="row g-2" novalidate>
          <div class="col-6"><label class="form-label requerido">Especie</label><input class="form-control" name="esp" [(ngModel)]="raza.especie" required maxlength="100" list="especies"></div>
          <div class="col-6"><label class="form-label requerido">Raza</label><input class="form-control" name="nom" [(ngModel)]="raza.nombre" required maxlength="100"></div>
          <datalist id="especies"><option value="Canino"><option value="Felino"><option value="Conejo"><option value="Ave"></datalist>
          <div class="col-12 text-end"><button type="button" class="btn btn-light me-1" (click)="raza={}">Limpiar</button>
            <button type="button" class="btn btn-primary" (click)="guardarRaza(fr)">Guardar</button></div>
        </form></div></div></div>
      <div class="col-lg-7"><div class="card"><div class="table-responsive tabla-scroll"><table class="table table-sm table-hover mb-0">
        <thead><tr><th>Especie</th><th>Raza</th><th></th></tr></thead>
        <tbody>@for (r of razas; track r.razaId) { <tr><td>{{ r.especie }}</td><td>{{ r.nombre }}</td>
          <td class="text-end"><button class="btn btn-sm btn-outline-primary" (click)="raza=copiar(r)"><i class="bi bi-pencil"></i></button></td></tr> }</tbody>
      </table></div></div></div>
    </div>
  }

  <app-modal [abierto]="modal" [titulo]="form.mascotaId ? 'Editar mascota' : 'Nueva mascota'" (cerrar)="modal=false">
    <form #f="ngForm" class="row g-3" novalidate>
      <div class="col-md-6"><label class="form-label requerido">Propietario</label>
        <select class="form-select" name="cli" [(ngModel)]="form.clienteId" required #c="ngModel" [class.is-invalid]="c.invalid && enviado">
          @for (c of clientesActivos(); track c.id) { <option [ngValue]="c.id">{{ c.nombres }} {{ c.apellidos }} - {{ c.numeroDocumento }}</option> }</select></div>
      <div class="col-md-6"><label class="form-label requerido">Nombre</label>
        <input class="form-control" name="nom" [(ngModel)]="form.nombre" required maxlength="100" #n="ngModel" [class.is-invalid]="n.invalid && enviado"></div>
      <div class="col-md-6"><label class="form-label requerido">Raza</label>
        <select class="form-select" name="raza" [(ngModel)]="form.razaId" required #r="ngModel" [class.is-invalid]="r.invalid && enviado">
          @for (r of razas; track r.razaId) { <option [ngValue]="r.razaId">{{ r.especie }} - {{ r.nombre }}</option> }</select></div>
      <div class="col-md-2"><label class="form-label">Edad</label>
        <input class="form-control" type="number" name="edad" [(ngModel)]="form.edad" min="0" max="40" #e="ngModel" [class.is-invalid]="e.invalid && enviado"></div>
      <div class="col-md-2"><label class="form-label">Sexo</label>
        <select class="form-select" name="sexo" [(ngModel)]="form.sexo"><option value="">-</option><option value="M">Macho</option><option value="H">Hembra</option></select></div>
      <div class="col-md-2"><label class="form-label">Peso (kg)</label>
        <input class="form-control" type="number" step="0.01" name="peso" [(ngModel)]="form.pesoKg" min="0.01" max="500" #p="ngModel" [class.is-invalid]="p.invalid && enviado"></div>
    </form>
    <div pie><button class="btn btn-light" (click)="modal=false">Cancelar</button><button class="btn btn-primary" (click)="guardar(f)">Guardar</button></div>
  </app-modal>

  <app-modal [abierto]="!!histMascota" [titulo]="'Historial de citas de ' + (histMascota?.nombreMascota ?? '')" (cerrar)="histMascota=null">
    <table class="table table-sm"><thead><tr><th>Fecha</th><th>Veterinario</th><th>Motivo</th><th>Estado</th></tr></thead>
      <tbody>@for (c of citas; track c.id) { <tr><td>{{ c.fechaHora | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ c.medico.nombres }} {{ c.medico.apellidos }}</td>
        <td>{{ c.motivo }}</td><td><app-estado [valor]="c.estado" /></td></tr> } @empty { <tr><td colspan="4" class="text-muted">Sin citas.</td></tr> }</tbody></table>
    <div pie><button class="btn btn-light" (click)="histMascota=null">Cerrar</button></div>
  </app-modal>
  `
})
export class MascotasComponent implements OnInit {
  private api = inject(ApiService);
  tab: 'm' | 'r' = 'm';
  mascotas: Mascota[] = [];
  clientes: Cliente[] = [];
  razas: Raza[] = [];
  filtro = '';
  tabla = new Tabla<Mascota>({ nombre: x => x.nombreMascota, raza: x => x.raza.especie + ' ' + x.raza.nombre, edad: x => x.edad, sexo: x => x.sexo, peso: x => x.pesoKg, prop: x => (x.cliente.nombres + ' ' + x.cliente.apellidos), activo: x => x.activo }, { campo: 'nombre' });
  modal = false;
  enviado = false;
  form: any = {};
  raza: any = {};
  histMascota: Mascota | null = null;
  citas: Cita[] = [];

  copiar<T>(o: T): T { return { ...o }; }

  ngOnInit(): void {
    this.cargar();
    this.api.get<Cliente[]>('/cliente/listar').subscribe(c => this.clientes = c);
    this.cargarRazas();
  }

  cargar(): void { this.api.get<Mascota[]>('/mascota/listar').subscribe({ next: m => this.mascotas = m, error: e => Mensajes.error(e) }); }
  cargarRazas(): void { this.api.get<Raza[]>('/raza/listar').subscribe(r => this.razas = r); }
  clientesActivos(): Cliente[] { return this.clientes.filter(c => c.activo || c.id === this.form.clienteId); }

  filtradas(): Mascota[] {
    return this.mascotas.filter(m => contiene(this.filtro, [m.nombreMascota, m.raza.nombre, m.raza.especie,
      m.cliente.nombres + ' ' + m.cliente.apellidos, m.cliente.numeroDocumento]));
  }

  nueva(): void { this.form = { sexo: '' }; this.enviado = false; this.modal = true; }

  editar(m: Mascota): void {
    this.form = { mascotaId: m.mascotaId, nombre: m.nombreMascota, edad: m.edad, sexo: m.sexo ?? '', pesoKg: m.pesoKg,
      razaId: m.raza.razaId, clienteId: m.cliente.id };
    this.enviado = false; this.modal = true;
  }

  guardar(f: NgForm): void {
    this.enviado = true;
    if (f.invalid) { return; }
    const op = this.form.mascotaId ? this.api.put<Respuesta>('/mascota/actualizar', this.form) : this.api.post<Respuesta>('/mascota/guardar', this.form);
    op.subscribe({ next: r => { Mensajes.exito(r.message); this.modal = false; this.cargar(); }, error: e => Mensajes.error(e) });
  }

  async estado(m: Mascota): Promise<void> {
    if (!await Mensajes.confirmar(`¿${m.activo ? 'Inactivar' : 'Activar'} a ${m.nombreMascota}?`)) { return; }
    this.api.patch<Respuesta>('/mascota/cambiar-estado', {}, { mascotaId: m.mascotaId, activo: !m.activo })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.cargar(); }, error: e => Mensajes.error(e) });
  }

  historial(m: Mascota): void {
    this.histMascota = m; this.citas = [];
    this.api.get<Cita[]>('/cita/listar-por-mascota', { mascotaId: m.mascotaId }).subscribe(c => this.citas = c);
  }

  guardarRaza(f: NgForm): void {
    if (f.invalid) { Mensajes.aviso('Datos incompletos', 'Especie y raza son obligatorias.'); return; }
    const op = this.raza.razaId ? this.api.put<Respuesta>('/raza/actualizar', this.raza) : this.api.post<Respuesta>('/raza/guardar', this.raza);
    op.subscribe({ next: r => { Mensajes.exito(r.message); this.raza = {}; this.cargarRazas(); }, error: e => Mensajes.error(e) });
  }
}
