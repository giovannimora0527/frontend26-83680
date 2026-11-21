import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Mensajes } from '../../core/mensajes';
import { Especializacion, Impuesto, Respuesta, Tarifa } from '../../core/models';
import { ModalComponent } from '../../shared/modal.component';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

/** Módulo administrativo: especialidades, tarifas, impuestos y log de tarifas. */
@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [OrdenComponent, PaginadorComponent, FormsModule, ModalComponent, CurrencyPipe, DatePipe],
  template: `
  <h4 class="titulo-pagina mb-3">Especialidades, tarifas e impuestos</h4>
  <ul class="nav nav-tabs mb-3">
    <li class="nav-item"><a class="nav-link" [class.active]="tab==='e'" (click)="tab='e'">Especialidades</a></li>
    <li class="nav-item"><a class="nav-link" [class.active]="tab==='t'" (click)="tab='t'">Tarifas de servicios</a></li>
    <li class="nav-item"><a class="nav-link" [class.active]="tab==='i'" (click)="tab='i'">Impuestos / IVA</a></li>
    <li class="nav-item"><a class="nav-link" [class.active]="tab==='h'" (click)="tab='h'; cargarHistorial()">Log de tarifas</a></li>
  </ul>

  @if (tab === 'e') {
    <div class="text-end mb-2"><button class="btn btn-primary" (click)="esp={}; modalEsp=true"><i class="bi bi-plus-lg"></i> Nueva especialidad</button></div>
    <div class="card"><table class="table table-hover mb-0">
      <thead><tr><th>Código</th><th>Nombre</th><th>Descripción</th><th>Estado</th><th></th></tr></thead>
      <tbody>@for (e of especialidades; track e.id) { <tr><td>{{ e.codigoEspecializacion }}</td><td class="fw-semibold">{{ e.nombre }}</td><td>{{ e.descripcion }}</td>
        <td><span class="badge" [class]="e.activo ? 'bg-success' : 'bg-secondary'">{{ e.activo ? 'Activa' : 'Inactiva' }}</span></td>
        <td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-primary me-1" (click)="esp=copiar(e); modalEsp=true"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm" [class]="e.activo ? 'btn-outline-danger' : 'btn-outline-success'" (click)="estadoEsp(e)"><i class="bi bi-power"></i></button></td></tr> }</tbody>
    </table></div>
  }

  @if (tab === 't') {
    <div class="text-end mb-2"><button class="btn btn-primary" (click)="nuevaTarifa()"><i class="bi bi-plus-lg"></i> Nueva tarifa</button></div>
    <div class="card"><div class="table-responsive"><table class="table table-hover mb-0">
      <thead><tr><th appOrden="codigo" [tabla]="tablaT">Código</th><th appOrden="nombre" [tabla]="tablaT">Servicio</th><th appOrden="tipo" [tabla]="tablaT">Tipo</th><th appOrden="esp" [tabla]="tablaT">Especialidad</th><th class="text-end" appOrden="valor" [tabla]="tablaT">Valor</th><th>Impuesto</th><th appOrden="duracion" [tabla]="tablaT">Duración</th><th appOrden="activo" [tabla]="tablaT">Estado</th><th></th></tr></thead>
      <tbody>@for (t of tablaT.ver(tarifas); track t.id) { <tr><td>{{ t.codigo }}</td><td class="fw-semibold">{{ t.nombre }}</td><td>{{ t.tipoServicio }}</td>
        <td>{{ t.especializacion?.nombre ?? 'General' }}</td><td class="text-end">{{ t.valor | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
        <td>{{ t.impuesto.codigo }} ({{ t.impuesto.porcentaje }}%)</td><td>{{ t.duracionMinutos }} min</td>
        <td><span class="badge" [class]="t.activo ? 'bg-success' : 'bg-secondary'">{{ t.activo ? 'Activa' : 'Inactiva' }}</span></td>
        <td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-primary me-1" (click)="editarTarifa(t)"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm" [class]="t.activo ? 'btn-outline-danger' : 'btn-outline-success'" (click)="estadoTarifa(t)"><i class="bi bi-power"></i></button></td></tr> }</tbody>
    </table></div>
<app-paginador [tabla]="tablaT" /></div>
  }

  @if (tab === 'i') {
    <div class="text-end mb-2"><button class="btn btn-primary" (click)="imp={ tipo: 'IVA' }; modalImp=true"><i class="bi bi-plus-lg"></i> Nuevo impuesto</button></div>
    <div class="card"><table class="table table-hover mb-0">
      <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Porcentaje</th><th>Estado</th><th></th></tr></thead>
      <tbody>@for (i of impuestos; track i.id) { <tr><td>{{ i.codigo }}</td><td>{{ i.nombre }}</td><td>{{ i.tipo }}</td><td>{{ i.porcentaje }}%</td>
        <td><span class="badge" [class]="i.activo ? 'bg-success' : 'bg-secondary'">{{ i.activo ? 'Activo' : 'Inactivo' }}</span></td>
        <td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-primary me-1" (click)="imp=copiar(i); modalImp=true"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm" [class]="i.activo ? 'btn-outline-danger' : 'btn-outline-success'" (click)="estadoImp(i)"><i class="bi bi-power"></i></button></td></tr> }</tbody>
    </table></div>
  }

  @if (tab === 'h') {
    <div class="card"><div class="table-responsive tabla-scroll"><table class="table table-sm table-hover mb-0">
      <thead><tr><th appOrden="fecha" [tabla]="tablaH">Fecha</th><th appOrden="tarifa" [tabla]="tablaH">Tarifa</th><th appOrden="accion" [tabla]="tablaH">Acción</th><th class="text-end">Valor anterior</th><th class="text-end">Valor nuevo</th><th>Impuesto</th><th>Detalle</th><th appOrden="usuario" [tabla]="tablaH">Usuario</th></tr></thead>
      <tbody>@for (h of tablaH.ver(historial); track h.id) { <tr><td>{{ h.fecha | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ h.tarifa.codigo }} - {{ h.tarifa.nombre }}</td><td>{{ h.accion }}</td>
        <td class="text-end">{{ h.valorAnterior != null ? (h.valorAnterior | currency:'COP':'symbol-narrow':'1.0-0') : '-' }}</td>
        <td class="text-end">{{ h.valorNuevo | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
        <td>{{ h.impuestoAnterior ?? '-' }} → {{ h.impuestoNuevo }}</td><td>{{ h.detalle }}</td><td>{{ h.usuario.nombreCompleto }}</td></tr> }</tbody>
    </table></div>
<app-paginador [tabla]="tablaH" /></div>
  }

  <app-modal [abierto]="modalEsp" [titulo]="esp.id ? 'Editar especialidad' : 'Nueva especialidad'" tamano="md" (cerrar)="modalEsp=false">
    <form #fe="ngForm" class="row g-2" novalidate>
      <div class="col-4"><label class="form-label requerido">Código</label><input class="form-control" name="c" [(ngModel)]="esp.codigoEspecializacion" required pattern="^[A-Za-z0-9_-]{2,20}$"></div>
      <div class="col-8"><label class="form-label requerido">Nombre</label><input class="form-control" name="n" [(ngModel)]="esp.nombre" required maxlength="100"></div>
      <div class="col-12"><label class="form-label requerido">Descripción</label><textarea class="form-control" name="d" [(ngModel)]="esp.descripcion" required maxlength="500"></textarea></div>
    </form>
    <div pie><button class="btn btn-light" (click)="modalEsp=false">Cancelar</button><button class="btn btn-primary" (click)="guardarEsp(fe)">Guardar</button></div>
  </app-modal>

  <app-modal [abierto]="modalTar" [titulo]="tar.id ? 'Editar tarifa' : 'Nueva tarifa'" (cerrar)="modalTar=false">
    <form #ft="ngForm" class="row g-3" novalidate>
      <div class="col-md-3"><label class="form-label requerido">Código</label><input class="form-control" name="c" [(ngModel)]="tar.codigo" required pattern="^[A-Za-z0-9_-]{2,20}$"></div>
      <div class="col-md-5"><label class="form-label requerido">Nombre del servicio</label><input class="form-control" name="n" [(ngModel)]="tar.nombre" required maxlength="150"></div>
      <div class="col-md-4"><label class="form-label requerido">Tipo de servicio</label>
        <select class="form-select" name="t" [(ngModel)]="tar.tipoServicio" required>
          @for (t of tiposServicio; track t) { <option [value]="t">{{ t }}</option> }</select></div>
      <div class="col-md-4"><label class="form-label">Especialidad</label>
        <select class="form-select" name="e" [(ngModel)]="tar.especializacionId"><option [ngValue]="null">General (todas)</option>
          @for (e of especialidades; track e.id) { <option [ngValue]="e.id">{{ e.nombre }}</option> }</select></div>
      <div class="col-md-3"><label class="form-label requerido">Valor ($)</label><input class="form-control" type="number" min="0" name="v" [(ngModel)]="tar.valor" required></div>
      <div class="col-md-3"><label class="form-label requerido">Impuesto</label>
        <select class="form-select" name="i" [(ngModel)]="tar.impuestoId" required>
          @for (i of impuestosActivos(); track i.id) { <option [ngValue]="i.id">{{ i.codigo }} ({{ i.porcentaje }}%)</option> }</select></div>
      <div class="col-md-2"><label class="form-label requerido">Duración</label><input class="form-control" type="number" min="5" max="480" name="d" [(ngModel)]="tar.duracionMinutos" required></div>
      <div class="col-12"><label class="form-label">Descripción</label><input class="form-control" name="ds" [(ngModel)]="tar.descripcion" maxlength="500"></div>
    </form>
    <p class="small text-muted mt-2 mb-0">Los cambios quedan en el log de tarifas. Las facturas ya generadas conservan el valor con el que se emitieron.</p>
    <div pie><button class="btn btn-light" (click)="modalTar=false">Cancelar</button><button class="btn btn-primary" (click)="guardarTarifa(ft)">Guardar</button></div>
  </app-modal>

  <app-modal [abierto]="modalImp" [titulo]="imp.id ? 'Editar impuesto' : 'Nuevo impuesto'" tamano="md" (cerrar)="modalImp=false">
    <form #fi="ngForm" class="row g-2" novalidate>
      <div class="col-4"><label class="form-label requerido">Código</label><input class="form-control" name="c" [(ngModel)]="imp.codigo" required maxlength="20"></div>
      <div class="col-8"><label class="form-label requerido">Nombre</label><input class="form-control" name="n" [(ngModel)]="imp.nombre" required maxlength="100"></div>
      <div class="col-6"><label class="form-label requerido">Tipo</label><select class="form-select" name="t" [(ngModel)]="imp.tipo" required><option>IVA</option><option>OTRO</option></select></div>
      <div class="col-6"><label class="form-label requerido">Porcentaje</label><input class="form-control" type="number" step="0.01" min="0" max="100" name="p" [(ngModel)]="imp.porcentaje" required></div>
    </form>
    <div pie><button class="btn btn-light" (click)="modalImp=false">Cancelar</button><button class="btn btn-primary" (click)="guardarImp(fi)">Guardar</button></div>
  </app-modal>
  `
})
export class TarifasComponent implements OnInit {
  private api = inject(ApiService);
  tab: 'e' | 't' | 'i' | 'h' = 'e';
  tiposServicio = ['CONSULTA', 'PROCEDIMIENTO', 'VACUNACION', 'CIRUGIA', 'LABORATORIO', 'OTRO'];
  especialidades: Especializacion[] = [];
  tarifas: Tarifa[] = [];
  tablaT = new Tabla<Tarifa>({ codigo: x => x.codigo, nombre: x => x.nombre, tipo: x => x.tipoServicio, esp: x => x.especializacion?.nombre ?? 'General', valor: x => Number(x.valor), duracion: x => x.duracionMinutos, activo: x => x.activo }, { campo: 'codigo' });
  impuestos: Impuesto[] = [];
  historial: any[] = [];
  tablaH = new Tabla<any>({ fecha: x => x.fecha, tarifa: x => x.tarifa.codigo, accion: x => x.accion, usuario: x => x.usuario.nombreCompleto }, { campo: 'fecha', ascendente: false, tamano: 25 });
  esp: any = {}; tar: any = {}; imp: any = {};
  modalEsp = false; modalTar = false; modalImp = false;

  copiar<T>(o: T): T { return { ...o }; }

  ngOnInit(): void { this.cargarTodo(); }

  cargarTodo(): void {
    this.api.get<Especializacion[]>('/especializacion/listar').subscribe(e => this.especialidades = e);
    this.api.get<Tarifa[]>('/tarifa/listar').subscribe(t => this.tarifas = t);
    this.api.get<Impuesto[]>('/tarifa/impuestos').subscribe(i => this.impuestos = i);
  }

  cargarHistorial(): void { this.api.get<any[]>('/tarifa/historial').subscribe(h => this.historial = h); }
  impuestosActivos(): Impuesto[] { return this.impuestos.filter(i => i.activo); }

  private resultado = { next: (r: Respuesta) => { Mensajes.exito(r.message); this.modalEsp = this.modalTar = this.modalImp = false; this.cargarTodo(); },
    error: (e: unknown) => Mensajes.error(e) };

  guardarEsp(f: NgForm): void {
    if (f.invalid) { Mensajes.aviso('Datos incompletos', 'Revise los campos obligatorios.'); return; }
    (this.esp.id ? this.api.put<Respuesta>('/especializacion/actualizar', this.esp) : this.api.post<Respuesta>('/especializacion/crear', this.esp)).subscribe(this.resultado);
  }

  estadoEsp(e: Especializacion): void {
    this.api.patch<Respuesta>('/especializacion/cambiar-estado', {}, { id: e.id, activo: !e.activo }).subscribe(this.resultado);
  }

  nuevaTarifa(): void { this.tar = { tipoServicio: 'CONSULTA', duracionMinutos: 30, especializacionId: null }; this.modalTar = true; }

  editarTarifa(t: Tarifa): void {
    this.tar = { ...t, especializacionId: t.especializacion?.id ?? null, impuestoId: t.impuesto.id };
    this.modalTar = true;
  }

  guardarTarifa(f: NgForm): void {
    if (f.invalid) { Mensajes.aviso('Datos incompletos', 'Revise los campos obligatorios.'); return; }
    const body = { id: this.tar.id, codigo: this.tar.codigo, nombre: this.tar.nombre, descripcion: this.tar.descripcion,
      tipoServicio: this.tar.tipoServicio, especializacionId: this.tar.especializacionId, valor: this.tar.valor,
      impuestoId: this.tar.impuestoId, duracionMinutos: this.tar.duracionMinutos };
    (body.id ? this.api.put<Respuesta>('/tarifa/actualizar', body) : this.api.post<Respuesta>('/tarifa/crear', body)).subscribe(this.resultado);
  }

  estadoTarifa(t: Tarifa): void {
    this.api.patch<Respuesta>('/tarifa/cambiar-estado', {}, { tarifaId: t.id, activo: !t.activo }).subscribe(this.resultado);
  }

  guardarImp(f: NgForm): void {
    if (f.invalid) { Mensajes.aviso('Datos incompletos', 'Revise los campos obligatorios.'); return; }
    (this.imp.id ? this.api.put<Respuesta>('/tarifa/impuestos', this.imp) : this.api.post<Respuesta>('/tarifa/impuestos', this.imp)).subscribe(this.resultado);
  }

  estadoImp(i: Impuesto): void {
    this.api.patch<Respuesta>('/tarifa/impuestos/cambiar-estado', {}, { id: i.id, activo: !i.activo }).subscribe(this.resultado);
  }
}
