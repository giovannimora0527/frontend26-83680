import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Mensajes } from '../../core/mensajes';
import { contiene } from '../../core/util';
import { EstadoComponent } from '../../shared/estado.component';
import { ModalComponent } from '../../shared/modal.component';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

/** Consulta de fórmulas emitidas por el veterinario (la formulación se hace en la atención). */
@Component({
  selector: 'app-formulas',
  standalone: true,
  imports: [OrdenComponent, PaginadorComponent, FormsModule, DatePipe, RouterLink, EstadoComponent, ModalComponent],
  template: `
  <div class="d-flex flex-wrap align-items-center mb-3 gap-2">
    <h4 class="titulo-pagina mb-0">Fórmulas médicas</h4>
    <input class="form-control ms-auto" style="max-width:300px" placeholder="Número, mascota, propietario..." [(ngModel)]="filtro" (ngModelChange)="tabla.reiniciar()">
  </div>
  <div class="card"><div class="table-responsive"><table class="table table-hover mb-0">
    <thead><tr><th appOrden="numero" [tabla]="tabla">Número</th><th appOrden="fecha" [tabla]="tabla">Emisión</th><th appOrden="mascota" [tabla]="tabla">Mascota</th><th appOrden="prop" [tabla]="tabla">Propietario</th><th appOrden="items" [tabla]="tabla">Medicamentos</th><th appOrden="estado" [tabla]="tabla">Estado</th><th appOrden="despacho" [tabla]="tabla">Despacho</th><th></th></tr></thead>
    <tbody>@for (f of tabla.ver(filtradas()); track f.id) {
      <tr><td class="fw-semibold">{{ f.numero ?? 'Borrador #' + f.id }}</td><td>{{ f.fechaEmision | date:'dd/MM/yyyy' }}</td><td>{{ f.mascota.nombreMascota }}</td>
        <td>{{ f.cita.cliente.nombres }} {{ f.cita.cliente.apellidos }}</td><td>{{ f.detalles.length }}</td>
        <td><app-estado [valor]="f.estado" /></td><td><app-estado [valor]="f.estadoDespacho" /></td>
        <td class="text-end text-nowrap">
          <a class="btn btn-sm btn-outline-secondary me-1" [routerLink]="['/inicio/atencion', f.cita.id]" title="Ir a la atención"><i class="fa-solid fa-notes-medical"></i></a>
          <button class="btn btn-sm btn-outline-primary me-1" (click)="ver(f)"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-outline-danger" (click)="pdf(f)"><i class="fa-solid fa-file-pdf"></i></button></td></tr>
    } @empty { <tr><td colspan="8" class="text-center text-muted py-4">Sin fórmulas.</td></tr> }</tbody>
  </table></div>
<app-paginador [tabla]="tabla" /></div>

  <app-modal [abierto]="!!sel" [titulo]="'Fórmula ' + (sel?.numero ?? '')" tamano="xl" (cerrar)="sel=null">
    @if (sel; as f) {
      <table class="table table-sm"><thead><tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Duración</th><th>Prescrito</th><th>Despachado</th><th>Vía</th><th>Indicaciones</th></tr></thead>
        <tbody>@for (d of f.detalles; track d.id) { <tr><td>{{ d.medicamento.nombre }}</td><td>{{ d.dosis }}</td><td>c/{{ d.frecuenciaHoras }} h</td><td>{{ d.duracionDias }} d</td>
          <td>{{ d.cantidadPrescrita }}</td><td>{{ d.cantidadDespachada }}</td><td>{{ d.viaAdministracion }}</td><td>{{ d.indicaciones }}</td></tr> }</tbody></table>
      <h6>Historial de estados</h6>
      <table class="table table-sm"><thead><tr><th>Fecha</th><th>De</th><th>A</th><th>Observación</th><th>Usuario</th></tr></thead>
        <tbody>@for (h of historial; track h.id) { <tr><td>{{ h.fecha | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ h.estadoAnterior }}</td><td>{{ h.estadoNuevo }}</td>
          <td>{{ h.observacion }}</td><td>{{ h.usuario.nombreCompleto }}</td></tr> }</tbody></table>
    }
    <div pie><button class="btn btn-light" (click)="sel=null">Cerrar</button></div>
  </app-modal>
  `
})
export class FormulasComponent implements OnInit {
  private api = inject(ApiService);
  formulas: any[] = [];
  filtro = '';
  tabla = new Tabla<any>({ numero: x => x.numero, fecha: x => x.fechaEmision, mascota: x => x.mascota.nombreMascota, prop: x => (x.cita.cliente.nombres + ' ' + x.cita.cliente.apellidos), items: x => x.detalles.length, estado: x => x.estado, despacho: x => x.estadoDespacho }, { campo: 'fecha', ascendente: false });
  sel: any = null;
  historial: any[] = [];

  ngOnInit(): void {
    this.api.get<any[]>('/formula-medica/listar').subscribe({ next: f => this.formulas = f, error: e => Mensajes.error(e) });
  }

  filtradas(): any[] {
    return this.formulas.filter(f => contiene(this.filtro, [f.numero, f.mascota.nombreMascota, f.cita.cliente.nombres + ' ' + f.cita.cliente.apellidos, f.estadoDespacho]));
  }

  ver(f: any): void {
    this.sel = f; this.historial = [];
    this.api.get<any[]>('/formula-medica/historial', { formulaId: f.id }).subscribe(h => this.historial = h);
  }

  pdf(f: any): void {
    this.api.descargar('/formula-medica/pdf', { formulaId: f.id }, 'formula.pdf').subscribe({ error: e => Mensajes.error(e) });
  }
}
