import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Mensajes } from '../../core/mensajes';
import { Cita, Medico, Respuesta } from '../../core/models';
import { contiene, hoyISO, sumarDias } from '../../core/util';
import { CitaFormComponent } from '../../shared/cita-form.component';
import { EstadoComponent } from '../../shared/estado.component';
import { ModalComponent } from '../../shared/modal.component';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

/** Módulo de citas para Recepción y Administración (vista de lista). */
@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [OrdenComponent, PaginadorComponent, FormsModule, DatePipe, CitaFormComponent, EstadoComponent, ModalComponent],
  template: `
  <div class="d-flex flex-wrap align-items-center mb-3 gap-2">
    <h4 class="titulo-pagina mb-0">Gestión de citas</h4>
    <button class="btn btn-primary ms-auto" (click)="nueva()"><i class="bi bi-plus-lg me-1"></i>Nueva cita</button>
  </div>
  <div class="card mb-3"><div class="card-body row g-2 align-items-end">
    <div class="col-md-2"><label class="form-label">Desde</label><input type="date" class="form-control" [(ngModel)]="desde"></div>
    <div class="col-md-2"><label class="form-label">Hasta</label><input type="date" class="form-control" [(ngModel)]="hasta"></div>
    <div class="col-md-3"><label class="form-label">Veterinario</label><select class="form-select" [(ngModel)]="medicoId"><option [ngValue]="null">Todos</option>
      @for (m of medicos; track m.id) { <option [ngValue]="m.id">{{ m.nombres }} {{ m.apellidos }}</option> }</select></div>
    <div class="col-md-2"><label class="form-label">Estado</label><select class="form-select" [(ngModel)]="estado"><option value="">Todos</option>
      @for (e of estados; track e) { <option [value]="e">{{ e }}</option> }</select></div>
    <div class="col-md-1"><button class="btn btn-outline-primary w-100" (click)="cargar()"><i class="bi bi-search"></i></button></div>
    <div class="col-md-2"><input class="form-control" placeholder="Filtrar..." [(ngModel)]="filtro" (ngModelChange)="tabla.reiniciar()"></div>
  </div></div>
  <div class="card"><div class="table-responsive">
    <table class="table table-hover mb-0">
      <thead><tr><th appOrden="id" [tabla]="tabla">#</th><th appOrden="fecha" [tabla]="tabla">Fecha</th><th appOrden="hora" [tabla]="tabla">Horario</th><th appOrden="mascota" [tabla]="tabla">Mascota</th><th appOrden="prop" [tabla]="tabla">Propietario</th><th appOrden="medico" [tabla]="tabla">Veterinario</th><th appOrden="servicio" [tabla]="tabla">Servicio</th><th>Motivo</th><th appOrden="estado" [tabla]="tabla">Estado</th><th></th></tr></thead>
      <tbody>
        @for (c of tabla.ver(filtradas()); track c.id) {
          <tr>
            <td>{{ c.id }}</td><td>{{ c.fechaHora | date:'dd/MM/yyyy' }}</td><td>{{ c.fechaHora | date:'HH:mm' }} - {{ c.fechaHoraFin | date:'HH:mm' }}</td>
            <td class="fw-semibold">{{ c.mascota.nombreMascota }}</td><td>{{ c.cliente.nombres }} {{ c.cliente.apellidos }}</td>
            <td>{{ c.medico.nombres }} {{ c.medico.apellidos }}</td><td>{{ c.tarifa?.nombre ?? '-' }}</td>
            <td class="text-truncate" style="max-width:200px" [title]="c.motivo">{{ c.motivo }}</td><td><app-estado [valor]="c.estado" /></td>
            <td class="text-end text-nowrap">
              <button class="btn btn-sm btn-outline-secondary me-1" title="Trazabilidad" (click)="verHistorial(c)"><i class="bi bi-clock-history"></i></button>
              @if (editable(c)) {
                <button class="btn btn-sm btn-outline-primary me-1" title="Editar" (click)="editar(c)"><i class="bi bi-pencil"></i></button>
                @if (c.estado !== 'CONFIRMADA') { <button class="btn btn-sm btn-outline-success me-1" title="Confirmar" (click)="cambiar(c,'CONFIRMADA')"><i class="bi bi-check2"></i></button> }
                <button class="btn btn-sm btn-outline-danger" title="Cancelar" (click)="cancelar(c)"><i class="bi bi-x-lg"></i></button>
              }
              @if (c.estado === 'CANCELADA') { <button class="btn btn-sm btn-outline-warning" title="Reactivar" (click)="reactivar(c)"><i class="bi bi-arrow-counterclockwise"></i></button> }
            </td>
          </tr>
        } @empty { <tr><td colspan="10" class="text-center text-muted py-4">Sin citas para los filtros.</td></tr> }
      </tbody>
    </table>
  </div>
<app-paginador [tabla]="tabla" /></div>

  <app-cita-form [abierto]="formAbierto" [cita]="citaEditar" (cerrar)="formAbierto=false" (guardado)="formAbierto=false; cargar()" />

  <app-modal [abierto]="!!histCita" [titulo]="'Trazabilidad de la cita #' + (histCita?.id ?? '')" (cerrar)="histCita=null">
    <table class="table table-sm"><thead><tr><th>Fecha</th><th>Acción</th><th>Estado</th><th>Horario</th><th>Observación</th><th>Usuario</th></tr></thead>
      <tbody>@for (h of historial; track h.id) { <tr><td>{{ h.fecha | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ h.accion }}</td>
        <td>{{ h.estadoAnterior ?? '' }} → {{ h.estadoNuevo }}</td>
        <td>@if (h.fechaNueva) { {{ h.fechaAnterior ? (h.fechaAnterior | date:'dd/MM HH:mm') + ' → ' : '' }}{{ h.fechaNueva | date:'dd/MM HH:mm' }} }</td>
        <td>{{ h.observacion }}</td><td>{{ h.usuario?.nombreCompleto }}</td></tr> }</tbody></table>
    <div pie><button class="btn btn-light" (click)="histCita=null">Cerrar</button></div>
  </app-modal>
  `
})
export class CitasComponent implements OnInit {
  private api = inject(ApiService);
  estados = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA', 'EN_ATENCION', 'ATENDIDA', 'CANCELADA'];
  citas: Cita[] = [];
  medicos: Medico[] = [];
  desde = sumarDias(hoyISO(), -7);
  hasta = sumarDias(hoyISO(), 30);
  medicoId: number | null = null;
  estado = '';
  filtro = '';
  tabla = new Tabla<Cita>({ id: x => x.id, fecha: x => x.fechaHora, hora: x => x.fechaHora.substring(11), mascota: x => x.mascota.nombreMascota, prop: x => (x.cliente.nombres + ' ' + x.cliente.apellidos), medico: x => (x.medico.nombres + ' ' + x.medico.apellidos), servicio: x => x.tarifa?.nombre, estado: x => x.estado }, { campo: 'fecha' });
  formAbierto = false;
  citaEditar: Cita | null = null;
  histCita: Cita | null = null;
  historial: any[] = [];

  ngOnInit(): void {
    this.api.get<Medico[]>('/medico/listar').subscribe(m => this.medicos = m);
    this.cargar();
  }

  cargar(): void {
    if (this.desde > this.hasta) { Mensajes.aviso('Fechas', 'La fecha inicial no puede ser mayor a la final.'); return; }
    this.api.get<Cita[]>('/cita/listar', { fechaInicial: this.desde, fechaFinal: this.hasta, medicoId: this.medicoId, estado: this.estado })
      .subscribe({ next: c => this.citas = c, error: e => Mensajes.error(e) });
  }

  filtradas(): Cita[] {
    return this.citas.filter(c => contiene(this.filtro, [c.mascota.nombreMascota, c.cliente.nombres + ' ' + c.cliente.apellidos,
      c.medico.nombres + ' ' + c.medico.apellidos, c.motivo, c.cliente.numeroDocumento]));
  }

  editable(c: Cita): boolean { return ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA'].includes(c.estado); }

  nueva(): void { this.citaEditar = null; this.formAbierto = true; }
  editar(c: Cita): void { this.citaEditar = c; this.formAbierto = true; }

  cambiar(c: Cita, estado: string): void {
    this.api.patch<Respuesta>('/cita/cambiar-estado', { citaId: c.id, estado })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.cargar(); }, error: e => Mensajes.error(e) });
  }

  async cancelar(c: Cita): Promise<void> {
    const motivo = await Mensajes.pedirTexto('Cancelar cita', 'Motivo de la cancelación (queda en el historial)');
    if (!motivo) { return; }
    this.api.patch<Respuesta>('/cita/cambiar-estado', { citaId: c.id, estado: 'CANCELADA', observacion: motivo })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.cargar(); }, error: e => Mensajes.error(e) });
  }

  async reactivar(c: Cita): Promise<void> {
    if (!await Mensajes.confirmar('La cita volverá a estado PENDIENTE si el horario sigue disponible.')) { return; }
    this.api.patch<Respuesta>('/cita/reactivar', {}, { citaId: c.id })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.cargar(); }, error: e => Mensajes.error(e) });
  }

  verHistorial(c: Cita): void {
    this.histCita = c; this.historial = [];
    this.api.get<any[]>('/cita/historial', { citaId: c.id }).subscribe(h => this.historial = h);
  }
}
