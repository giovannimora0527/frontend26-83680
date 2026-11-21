import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Mensajes } from '../../core/mensajes';
import { Cliente, Mascota, Respuesta } from '../../core/models';
import { contiene, sumarDias, hoyISO } from '../../core/util';
import { ModalComponent } from '../../shared/modal.component';
import { EstadoComponent } from '../../shared/estado.component';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [OrdenComponent, PaginadorComponent, FormsModule, ModalComponent, EstadoComponent, DatePipe, CurrencyPipe],
  template: `
  <div class="d-flex flex-wrap align-items-center mb-3 gap-2">
    <h4 class="titulo-pagina mb-0">Gestión de clientes (propietarios)</h4>
    <input class="form-control ms-auto" style="max-width:260px" placeholder="Buscar por nombre o documento" [(ngModel)]="filtro" (ngModelChange)="tabla.reiniciar()">
    <button class="btn btn-primary" (click)="nuevo()"><i class="bi bi-plus-lg me-1"></i>Nuevo cliente</button>
  </div>
  <div class="card"><div class="table-responsive">
    <table class="table table-hover mb-0">
      <thead><tr><th appOrden="doc" [tabla]="tabla">Documento</th><th appOrden="nombre" [tabla]="tabla">Nombre</th><th appOrden="tel" [tabla]="tabla">Teléfono</th><th appOrden="email" [tabla]="tabla">Correo</th><th appOrden="activo" [tabla]="tabla">Estado</th><th></th></tr></thead>
      <tbody>
        @for (c of tabla.ver(filtrados()); track c.id) {
          <tr>
            <td>{{ c.tipoDocumento }} {{ c.numeroDocumento }}</td><td class="fw-semibold">{{ c.nombres }} {{ c.apellidos }}</td>
            <td>{{ c.telefono }}</td><td>{{ c.email }}</td>
            <td><span class="badge" [class]="c.activo ? 'bg-success' : 'bg-secondary'">{{ c.activo ? 'Activo' : 'Inactivo' }}</span></td>
            <td class="text-end text-nowrap">
              <button class="btn btn-sm btn-outline-secondary me-1" (click)="verDetalle(c)" title="Mascotas y facturación"><i class="bi bi-eye"></i></button>
              <button class="btn btn-sm btn-outline-primary me-1" (click)="editar(c)" title="Editar"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm" [class]="c.activo ? 'btn-outline-danger' : 'btn-outline-success'" (click)="estado(c)" title="Activar / inactivar">
                <i class="bi" [class]="c.activo ? 'bi-x-circle' : 'bi-check-circle'"></i></button>
            </td>
          </tr>
        } @empty { <tr><td colspan="6" class="text-center text-muted py-4">Sin clientes.</td></tr> }
      </tbody>
    </table>
  </div>
<app-paginador [tabla]="tabla" /></div>

  <app-modal [abierto]="modal" [titulo]="form.id ? 'Editar cliente' : 'Nuevo cliente'" (cerrar)="modal=false">
    <form #f="ngForm" class="row g-3" novalidate>
      <div class="col-md-3"><label class="form-label requerido">Tipo doc.</label>
        <select class="form-select" name="tipo" [(ngModel)]="form.tipoDocumento" required>
          @for (t of tipos; track t) { <option [value]="t">{{ t }}</option> }</select></div>
      <div class="col-md-4"><label class="form-label requerido">Número</label>
        <input class="form-control" name="doc" [(ngModel)]="form.numeroDocumento" required pattern="^[A-Za-z0-9-]{5,20}$" #d="ngModel" [class.is-invalid]="d.invalid && enviado">
        <div class="invalid-feedback">5 a 20 caracteres alfanuméricos.</div></div>
      <div class="col-md-5"><label class="form-label requerido">Fecha de nacimiento</label>
        <input class="form-control" type="date" name="fn" [(ngModel)]="form.fechaNacimiento" required [max]="maxNacimiento" #fn="ngModel" [class.is-invalid]="fn.invalid && enviado">
        <div class="invalid-feedback">Obligatoria; el propietario debe ser mayor de edad.</div></div>
      <div class="col-md-6"><label class="form-label requerido">Nombres</label>
        <input class="form-control" name="nom" [(ngModel)]="form.nombres" required maxlength="100" #n="ngModel" [class.is-invalid]="n.invalid && enviado"></div>
      <div class="col-md-6"><label class="form-label requerido">Apellidos</label>
        <input class="form-control" name="ape" [(ngModel)]="form.apellidos" required maxlength="100" #a="ngModel" [class.is-invalid]="a.invalid && enviado"></div>
      <div class="col-md-3"><label class="form-label">Género</label>
        <select class="form-select" name="gen" [(ngModel)]="form.genero"><option value="">-</option><option value="F">F</option><option value="M">M</option><option value="O">Otro</option></select></div>
      <div class="col-md-4"><label class="form-label">Teléfono</label>
        <input class="form-control" name="tel" [(ngModel)]="form.telefono" pattern="^[0-9+ ()-]{7,20}$" #t="ngModel" [class.is-invalid]="t.invalid && enviado"></div>
      <div class="col-md-5"><label class="form-label">Correo</label>
        <input class="form-control" type="email" name="email" [(ngModel)]="form.email" email #em="ngModel" [class.is-invalid]="em.invalid && enviado"></div>
      <div class="col-12"><label class="form-label">Dirección</label><input class="form-control" name="dir" [(ngModel)]="form.direccion"></div>
    </form>
    <div pie><button class="btn btn-light" (click)="modal=false">Cancelar</button><button class="btn btn-primary" (click)="guardar(f)">Guardar</button></div>
  </app-modal>

  <app-modal [abierto]="!!detalle" [titulo]="'Propietario: ' + (detalle?.nombres ?? '') + ' ' + (detalle?.apellidos ?? '')" tamano="xl" (cerrar)="detalle=null">
    <h6>Mascotas</h6>
    <ul class="list-inline">@for (m of mascotas; track m.mascotaId) { <li class="list-inline-item badge bg-light text-dark border p-2">
      <i class="fa-solid fa-paw me-1"></i>{{ m.nombreMascota }} ({{ m.raza.especie }} - {{ m.raza.nombre }})</li> } @empty { <li class="text-muted">Sin mascotas.</li> }</ul>
    @if (puedeFacturar) {
      <h6 class="mt-3">Historial de facturación</h6>
      <table class="table table-sm"><thead><tr><th>Factura</th><th>Fecha</th><th>Mascota</th><th>Estado</th><th class="text-end">Total</th><th class="text-end">Saldo</th></tr></thead>
        <tbody>@for (f of facturas; track f.id) { <tr><td>{{ f.numero }}</td><td>{{ f.fechaGeneracion | date:'dd/MM/yyyy' }}</td><td>{{ f.mascota.nombreMascota }}</td>
          <td><app-estado [valor]="f.estado" /></td><td class="text-end">{{ f.total | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
          <td class="text-end">{{ f.saldo | currency:'COP':'symbol-narrow':'1.0-0' }}</td></tr> } @empty { <tr><td colspan="6" class="text-muted">Sin facturas.</td></tr> }</tbody></table>
    }
    <div pie><button class="btn btn-light" (click)="detalle=null">Cerrar</button></div>
  </app-modal>
  `
})
export class ClientesComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  tipos = ['CC', 'CE', 'PA', 'PPT', 'NIT'];
  clientes: Cliente[] = [];
  filtro = '';
  tabla = new Tabla<Cliente>({ doc: x => x.numeroDocumento, nombre: x => x.nombres + ' ' + x.apellidos, tel: x => x.telefono, email: x => x.email, activo: x => x.activo }, { campo: 'nombre' });
  modal = false;
  enviado = false;
  form: any = {};
  detalle: Cliente | null = null;
  mascotas: Mascota[] = [];
  facturas: any[] = [];
  maxNacimiento = sumarDias(hoyISO(), -365 * 18 - 5);
  puedeFacturar = this.auth.tienePerfil('ADMIN', 'RECEPCION');

  ngOnInit(): void { this.cargar(); }

  cargar(): void { this.api.get<Cliente[]>('/cliente/listar').subscribe({ next: c => this.clientes = c, error: e => Mensajes.error(e) }); }

  filtrados(): Cliente[] {
    return this.clientes.filter(c => contiene(this.filtro, [c.nombres + ' ' + c.apellidos, c.numeroDocumento, c.telefono, c.email]));
  }

  nuevo(): void { this.form = { tipoDocumento: 'CC', genero: '' }; this.enviado = false; this.modal = true; }

  editar(c: Cliente): void { this.form = { ...c }; this.enviado = false; this.modal = true; }

  guardar(f: NgForm): void {
    this.enviado = true;
    if (f.invalid) { return; }
    const op = this.form.id ? this.api.put<Respuesta>('/cliente/actualizar', this.form) : this.api.post<Respuesta>('/cliente/guardar', this.form);
    op.subscribe({ next: r => { Mensajes.exito(r.message); this.modal = false; this.cargar(); }, error: e => Mensajes.error(e) });
  }

  async estado(c: Cliente): Promise<void> {
    if (!await Mensajes.confirmar(`¿${c.activo ? 'Inactivar' : 'Activar'} a ${c.nombres} ${c.apellidos}?`)) { return; }
    this.api.patch<Respuesta>('/cliente/cambiar-estado', {}, { clienteId: c.id, activo: !c.activo })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.cargar(); }, error: e => Mensajes.error(e) });
  }

  verDetalle(c: Cliente): void {
    this.detalle = c; this.mascotas = []; this.facturas = [];
    this.api.get<Mascota[]>('/mascota/buscar-by-cliente', { clienteId: c.id }).subscribe(m => this.mascotas = m);
    if (this.puedeFacturar) { this.api.get<any[]>('/factura/listar', { clienteId: c.id }).subscribe(f => this.facturas = f); }
  }
}
