import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Mensajes } from '../../core/mensajes';
import { Medicamento, Medico, ReporteData } from '../../core/models';
import { hoyISO, primerDiaMes } from '../../core/util';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

interface Catalogo { codigo: string; titulo: string; grupo: string; filtros: string[]; }

/** Módulo de reportes: vista previa y descarga PDF / Excel (perfil ADMIN). */
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule, DatePipe, OrdenComponent, PaginadorComponent],
  template: `
  <h4 class="titulo-pagina mb-3">Reportes administrativos, contables y de gestión</h4>
  <div class="row g-3">
    <div class="col-lg-3">
      @for (g of grupos(); track g) {
        <div class="card mb-3"><div class="card-header">{{ g }}</div>
          <div class="list-group list-group-flush">
            @for (r of delGrupo(g); track r.codigo) {
              <button class="list-group-item list-group-item-action small" [class.active]="sel?.codigo === r.codigo" (click)="elegir(r)">{{ r.titulo }}</button>
            }
          </div></div>
      }
    </div>
    <div class="col-lg-9">
      @if (sel) {
        <div class="card mb-3"><div class="card-header">{{ sel.titulo }}</div><div class="card-body row g-2 align-items-end">
          @if (tiene('fechaInicial')) {
            <div class="col-md-2"><label class="form-label">Desde</label><input type="date" class="form-control" [(ngModel)]="f.fechaInicial"></div>
            <div class="col-md-2"><label class="form-label">Hasta</label><input type="date" class="form-control" [(ngModel)]="f.fechaFinal"></div>
          }
          @if (tiene('agrupacion')) {
            <div class="col-md-2"><label class="form-label">Agrupar por</label><select class="form-select" [(ngModel)]="f.agrupacion">
              <option value="DIA">Día</option><option value="MES">Mes</option><option value="ANIO">Año</option></select></div>
          }
          @if (tiene('estado')) {
            <div class="col-md-2"><label class="form-label">Estado</label><select class="form-select" [(ngModel)]="f.estado">
              <option value="">Todos</option>
              @for (e of estados(); track e) { <option [value]="e">{{ e }}</option> }</select></div>
          }
          @if (tiene('medicoId')) {
            <div class="col-md-3"><label class="form-label">Veterinario</label><select class="form-select" [(ngModel)]="f.medicoId">
              <option [ngValue]="null">Todos</option>@for (m of medicos; track m.id) { <option [ngValue]="m.id">{{ m.nombres }} {{ m.apellidos }}</option> }</select></div>
          }
          @if (tiene('medicamentoId')) {
            <div class="col-md-3"><label class="form-label">Medicamento</label><select class="form-select" [(ngModel)]="f.medicamentoId">
              <option [ngValue]="null">Todos</option>@for (m of medicamentos; track m.id) { <option [ngValue]="m.id">{{ m.codigo }} - {{ m.nombre }}</option> }</select></div>
          }
          @if (tiene('tipo')) {
            <div class="col-md-2"><label class="form-label">Tipo</label><select class="form-select" [(ngModel)]="f.tipo">
              <option value="">Todos</option>
              @for (t of tipos(); track t) { <option [value]="t">{{ t }}</option> }</select></div>
          }
          @if (tiene('dias')) {
            <div class="col-md-2"><label class="form-label">Días a vencer</label><input type="number" min="1" max="365" class="form-control" [(ngModel)]="f.dias"></div>
          }
          <div class="col-md-auto ms-auto d-flex gap-2">
            <button class="btn btn-primary" (click)="ver()"><i class="bi bi-eye me-1"></i>Ver</button>
            <button class="btn btn-outline-danger" (click)="descargar('pdf')"><i class="fa-solid fa-file-pdf me-1"></i>PDF</button>
            <button class="btn btn-outline-success" (click)="descargar('excel')"><i class="fa-solid fa-file-excel me-1"></i>Excel</button>
          </div>
        </div></div>
        @if (datos) {
          <div class="card"><div class="card-header">
            <div class="fw-bold">{{ datos.titulo }}</div>
            <small class="text-muted">{{ datos.subtitulo }} · Generado {{ datos.generado | date:'dd/MM/yyyy HH:mm' }} por {{ datos.generadoPor }}</small>
          </div>
            <div class="table-responsive tabla-scroll"><table class="table table-sm table-striped mb-0">
              <thead><tr>@for (c of datos.columnas; track $index) { <th [class.text-end]="numerica($index)" [appOrden]="'' + $index" [tabla]="tabla">{{ c }}</th> }</tr></thead>
              <tbody>
                @for (fila of tabla.ver(datos.filas); track $index) {
                  <tr>@for (v of fila; track $index; let i = $index) { <td [class.text-end]="numerica(i)">{{ formato(v, i) }}</td> }</tr>
                } @empty { <tr><td [attr.colspan]="datos.columnas.length" class="text-center text-muted py-4">Sin registros para los filtros.</td></tr> }
              </tbody>
              @if (datos.totales) { <tfoot><tr class="table-secondary fw-bold">@for (v of datos.totales; track $index; let i = $index) {
                <td [class.text-end]="numerica(i)">{{ formato(v, i) }}</td> }</tr></tfoot> }
            </table></div>
            <app-paginador [tabla]="tabla" />
          </div>
        }
      } @else {
        <div class="alert alert-light border">Seleccione un reporte de la lista.</div>
      }
    </div>
  </div>
  `
})
export class ReportesComponent implements OnInit {
  private api = inject(ApiService);
  private moneda = new CurrencyPipe('en-US');
  private numero = new DecimalPipe('en-US');
  private fecha = new DatePipe('en-US');
  catalogo: Catalogo[] = [];
  medicos: Medico[] = [];
  medicamentos: Medicamento[] = [];
  sel: Catalogo | null = null;
  datos: ReporteData | null = null;
  tabla = new Tabla<unknown[]>({}, { tamano: 25 });
  f: any = {};

  ngOnInit(): void {
    this.api.get<Catalogo[]>('/reporte/catalogo').subscribe({ next: c => this.catalogo = c, error: e => Mensajes.error(e) });
    this.api.get<Medico[]>('/medico/listar').subscribe(m => this.medicos = m);
    this.api.get<Medicamento[]>('/medicamento/listar').subscribe(m => this.medicamentos = m);
  }

  grupos(): string[] { return [...new Set(this.catalogo.map(c => c.grupo))]; }
  delGrupo(g: string): Catalogo[] { return this.catalogo.filter(c => c.grupo === g); }
  tiene(filtro: string): boolean { return !!this.sel?.filtros.includes(filtro); }

  elegir(r: Catalogo): void {
    this.sel = r; this.datos = null;
    this.f = { fechaInicial: primerDiaMes(), fechaFinal: hoyISO(), agrupacion: 'DIA', estado: '', tipo: '', medicoId: null, medicamentoId: null, dias: 30 };
  }

  estados(): string[] {
    return this.sel?.codigo === 'facturas' ? ['PENDIENTE', 'PAGO_PARCIAL', 'PAGADA', 'ANULADA']
      : ['PENDIENTE', 'CONFIRMADA', 'EN_ATENCION', 'ATENDIDA', 'CANCELADA'];
  }

  tipos(): string[] {
    return this.sel?.codigo === 'movimientos' ? ['ENTRADA', 'SALIDA'] : ['CONSULTA', 'PROCEDIMIENTO', 'VACUNACION', 'CIRUGIA', 'LABORATORIO', 'OTRO'];
  }

  private parametros(): Record<string, any> {
    if (this.tiene('fechaInicial') && this.f.fechaInicial > this.f.fechaFinal) { throw new Error('La fecha inicial no puede ser mayor a la final.'); }
    const p: Record<string, any> = {};
    this.sel!.filtros.forEach(k => p[k] = this.f[k]);
    return p;
  }

  ver(): void {
    try {
      this.api.get<ReporteData>('/reporte/' + this.sel!.codigo, this.parametros())
        .subscribe({ next: d => { this.datos = d; this.tabla.campo = null; this.tabla.reiniciar(); }, error: e => Mensajes.error(e) });
    } catch (e: any) { Mensajes.aviso('Filtros', e.message); }
  }

  descargar(tipo: 'pdf' | 'excel'): void {
    try {
      this.api.descargar(`/reporte/${this.sel!.codigo}/${tipo}`, this.parametros(), `reporte.${tipo === 'pdf' ? 'pdf' : 'xlsx'}`)
        .subscribe({ error: e => Mensajes.error(e) });
    } catch (e: any) { Mensajes.aviso('Filtros', e.message); }
  }

  numerica(i: number): boolean { return ['MONEDA', 'ENTERO', 'DECIMAL'].includes(this.datos?.tipos[i] ?? ''); }

  formato(v: any, i: number): string {
    if (v === null || v === undefined) { return ''; }
    const t = this.datos?.tipos[i];
    if (typeof v === 'number') {
      return t === 'MONEDA' ? (this.moneda.transform(v, 'COP', 'symbol-narrow', '1.0-2') ?? '') : (this.numero.transform(v, '1.0-2') ?? '');
    }
    if (t === 'FECHA_HORA' && typeof v === 'string') { return this.fecha.transform(v, 'dd/MM/yyyy HH:mm') ?? v; }
    if (t === 'FECHA' && typeof v === 'string') { return this.fecha.transform(v, 'dd/MM/yyyy') ?? v; }
    return String(v);
  }
}
