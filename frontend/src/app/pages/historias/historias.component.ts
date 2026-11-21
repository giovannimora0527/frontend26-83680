import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Mensajes } from '../../core/mensajes';
import { Respuesta } from '../../core/models';
import { contiene } from '../../core/util';
import { EstadoComponent } from '../../shared/estado.component';
import { ModalComponent } from '../../shared/modal.component';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

@Component({
  selector: 'app-historias',
  standalone: true,
  imports: [OrdenComponent, PaginadorComponent, FormsModule, DatePipe, EstadoComponent, ModalComponent],
  template: `
  <div class="d-flex flex-wrap align-items-center mb-3 gap-2">
    <h4 class="titulo-pagina mb-0">Historias clínicas</h4>
    @if (esMedico) { <div class="form-check form-switch ms-3"><input class="form-check-input" type="checkbox" id="sp" [(ngModel)]="soloPropias" (change)="cargar()">
      <label class="form-check-label" for="sp">Sólo mis atenciones</label></div> }
    <input class="form-control ms-auto" style="max-width:300px" placeholder="Mascota, propietario, diagnóstico..." [(ngModel)]="filtro" (ngModelChange)="tabla.reiniciar()">
  </div>
  <div class="card"><div class="table-responsive">
    <table class="table table-hover mb-0">
      <thead><tr><th appOrden="fecha" [tabla]="tabla">Fecha</th><th appOrden="mascota" [tabla]="tabla">Mascota</th><th appOrden="prop" [tabla]="tabla">Propietario</th><th appOrden="medico" [tabla]="tabla">Veterinario</th><th>Motivo</th><th>Diagnóstico</th><th appOrden="estado" [tabla]="tabla">Estado</th><th></th></tr></thead>
      <tbody>@for (h of tabla.ver(filtradas()); track h.historia.id) {
        <tr><td>{{ h.historia.fechaHora | date:'dd/MM/yyyy HH:mm' }}</td><td class="fw-semibold">{{ h.historia.mascota.nombreMascota }}</td>
          <td>{{ h.historia.cliente.nombres }} {{ h.historia.cliente.apellidos }}</td><td>{{ h.historia.medico.nombres }} {{ h.historia.medico.apellidos }}</td>
          <td class="text-truncate" style="max-width:180px">{{ h.historia.motivo }}</td><td class="text-truncate" style="max-width:200px">{{ h.historia.diagnostico }}</td>
          <td><app-estado [valor]="h.historia.estado" /></td>
          <td><button class="btn btn-sm btn-outline-primary" (click)="ver(h)"><i class="bi bi-eye"></i></button></td></tr>
      } @empty { <tr><td colspan="8" class="text-center text-muted py-4">Sin historias clínicas.</td></tr> }</tbody>
    </table>
  </div>
<app-paginador [tabla]="tabla" /></div>

  <app-modal [abierto]="!!sel" [titulo]="'Historia clínica · ' + (sel?.historia?.mascota?.nombreMascota ?? '')" tamano="xl" (cerrar)="sel=null">
    @if (sel; as s) {
      <div class="row g-2 small">
        <div class="col-md-4"><strong>Fecha:</strong> {{ s.historia.fechaHora | date:'dd/MM/yyyy HH:mm' }}</div>
        <div class="col-md-4"><strong>Veterinario:</strong> {{ s.historia.medico.nombres }} {{ s.historia.medico.apellidos }}</div>
        <div class="col-md-4"><strong>Peso / temp.:</strong> {{ s.historia.pesoKg ?? '-' }} kg / {{ s.historia.temperaturaC ?? '-' }} °C</div>
        <div class="col-12"><strong>Motivo:</strong> {{ s.historia.motivo }}</div>
        <div class="col-12"><strong>Síntomas:</strong> {{ s.historia.sintomas ?? '-' }}</div>
        <div class="col-12"><strong>Diagnóstico:</strong> {{ s.historia.diagnostico ?? '-' }}</div>
        <div class="col-12"><strong>Observaciones:</strong> {{ s.historia.observaciones ?? '-' }}</div>
        <div class="col-12"><strong>Recomendaciones:</strong> {{ s.historia.recomendaciones ?? '-' }}</div>
      </div>
      <h6 class="mt-3">Anotaciones de evolución</h6>
      <ul class="list-group mb-2">@for (a of s.anotaciones; track a.id) { <li class="list-group-item small">
        <strong>{{ a.fecha | date:'dd/MM/yyyy HH:mm' }}</strong> · {{ a.medico.nombres }} {{ a.medico.apellidos }}<br>{{ a.descripcion }}
        @if (a.diagnostico) { <br><em>Diagnóstico: {{ a.diagnostico }}</em> }</li> } @empty { <li class="list-group-item text-muted small">Sin anotaciones.</li> }</ul>
      @if (esMedico) {
        <div class="row g-2"><div class="col-md-6"><textarea class="form-control form-control-sm" rows="2" placeholder="Nueva anotación (obligatoria)" [(ngModel)]="anot.descripcion"></textarea></div>
          <div class="col-md-4"><input class="form-control form-control-sm" placeholder="Diagnóstico (opcional)" [(ngModel)]="anot.diagnostico"></div>
          <div class="col-md-2"><button class="btn btn-sm btn-primary w-100" (click)="anotar()">Agregar</button></div></div>
      }
    }
    <div pie><button class="btn btn-light" (click)="sel=null">Cerrar</button></div>
  </app-modal>
  `
})
export class HistoriasComponent implements OnInit {
  private api = inject(ApiService);
  esMedico = inject(AuthService).tienePerfil('MEDICO');
  historias: any[] = [];
  filtro = '';
  tabla = new Tabla<any>({ fecha: x => x.historia.fechaHora, mascota: x => x.historia.mascota.nombreMascota, prop: x => (x.historia.cliente.nombres + ' ' + x.historia.cliente.apellidos), medico: x => (x.historia.medico.nombres + ' ' + x.historia.medico.apellidos), estado: x => x.historia.estado }, { campo: 'fecha', ascendente: false });
  soloPropias = false;
  sel: any = null;
  anot: any = {};

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.api.get<any[]>('/historia-clinica/listar', { soloPropias: this.soloPropias })
      .subscribe({ next: h => this.historias = h, error: e => Mensajes.error(e) });
  }

  filtradas(): any[] {
    return this.historias.filter(h => contiene(this.filtro, [h.historia.mascota.nombreMascota, h.historia.cliente.nombres + ' ' + h.historia.cliente.apellidos,
      h.historia.diagnostico, h.historia.motivo]));
  }

  ver(h: any): void { this.sel = h; this.anot = {}; }

  anotar(): void {
    if (!this.anot.descripcion?.trim()) { Mensajes.aviso('Anotación', 'Escriba la descripción.'); return; }
    this.api.post<Respuesta>('/historia-clinica/anotacion', { ...this.anot, historiaId: this.sel.historia.id }).subscribe({
      next: r => {
        Mensajes.exito(r.message);
        this.api.get<any>('/historia-clinica/consultar', { historiaId: this.sel.historia.id }).subscribe(x => { this.sel = x; this.anot = {}; this.cargar(); });
      }, error: e => Mensajes.error(e) });
  }
}
