import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Mensajes } from '../../core/mensajes';
import { Especializacion, Horario, Medico, Respuesta } from '../../core/models';
import { DIAS_SEMANA, contiene } from '../../core/util';
import { ModalComponent } from '../../shared/modal.component';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

@Component({
  selector: 'app-medicos',
  standalone: true,
  imports: [OrdenComponent, PaginadorComponent, FormsModule, ModalComponent],
  template: `
  <div class="d-flex flex-wrap align-items-center mb-3 gap-2">
    <h4 class="titulo-pagina mb-0">Gestión de veterinarios</h4>
    <input class="form-control ms-auto" style="max-width:260px" placeholder="Buscar..." [(ngModel)]="filtro" (ngModelChange)="tabla.reiniciar()">
    <button class="btn btn-primary" (click)="nuevo()"><i class="bi bi-plus-lg me-1"></i>Nuevo veterinario</button>
  </div>
  <div class="card"><div class="table-responsive">
    <table class="table table-hover mb-0">
      <thead><tr><th appOrden="doc" [tabla]="tabla">Documento</th><th appOrden="nombre" [tabla]="tabla">Nombre</th><th appOrden="esp" [tabla]="tabla">Especialidad</th><th appOrden="registro" [tabla]="tabla">Registro</th><th>Contacto</th><th appOrden="estado" [tabla]="tabla">Estado</th><th></th></tr></thead>
      <tbody>
        @for (m of tabla.ver(filtrados()); track m.id) {
          <tr>
            <td>{{ m.tipoDocumento }} {{ m.numeroDocumento }}</td><td class="fw-semibold">{{ m.nombres }} {{ m.apellidos }}</td>
            <td>{{ m.especializacion.nombre }}</td><td>{{ m.registroProfesional }}</td><td>{{ m.telefono }}<br><small class="text-muted">{{ m.email }}</small></td>
            <td><span class="badge" [class]="m.estado ? 'bg-success' : 'bg-secondary'">{{ m.estado ? 'Activo' : 'Inactivo' }}</span></td>
            <td class="text-end text-nowrap">
              <button class="btn btn-sm btn-outline-secondary me-1" (click)="abrirHorarios(m)" title="Horarios de disponibilidad"><i class="bi bi-clock"></i></button>
              <button class="btn btn-sm btn-outline-primary me-1" (click)="editar(m)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm" [class]="m.estado ? 'btn-outline-danger' : 'btn-outline-success'" (click)="estado(m)">
                <i class="bi" [class]="m.estado ? 'bi-person-x' : 'bi-person-check'"></i></button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>
<app-paginador [tabla]="tabla" /></div>

  <app-modal [abierto]="modal" [titulo]="form.id ? 'Editar veterinario' : 'Nuevo veterinario'" (cerrar)="modal=false">
    <form #f="ngForm" class="row g-3" novalidate>
      <div class="col-md-3"><label class="form-label requerido">Tipo doc.</label>
        <select class="form-select" name="tipo" [(ngModel)]="form.tipoDocumento" required>
          @for (t of ['CC','CE','PA','PPT']; track t) { <option [value]="t">{{ t }}</option> }</select></div>
      <div class="col-md-4"><label class="form-label requerido">Número</label>
        <input class="form-control" name="doc" [(ngModel)]="form.numeroDocumento" required maxlength="20" #d="ngModel" [class.is-invalid]="d.invalid && enviado"></div>
      <div class="col-md-5"><label class="form-label requerido">Registro profesional</label>
        <input class="form-control" name="reg" [(ngModel)]="form.registroProfesional" required maxlength="50" #r="ngModel" [class.is-invalid]="r.invalid && enviado"></div>
      <div class="col-md-6"><label class="form-label requerido">Nombres</label>
        <input class="form-control" name="nom" [(ngModel)]="form.nombres" required #n="ngModel" [class.is-invalid]="n.invalid && enviado"></div>
      <div class="col-md-6"><label class="form-label requerido">Apellidos</label>
        <input class="form-control" name="ape" [(ngModel)]="form.apellidos" required #a="ngModel" [class.is-invalid]="a.invalid && enviado"></div>
      <div class="col-md-4"><label class="form-label requerido">Especialidad</label>
        <select class="form-select" name="esp" [(ngModel)]="form.especializacionId" required #e="ngModel" [class.is-invalid]="e.invalid && enviado">
          @for (e of especialidades; track e.id) { <option [ngValue]="e.id">{{ e.nombre }}</option> }</select></div>
      <div class="col-md-4"><label class="form-label">Teléfono</label><input class="form-control" name="tel" [(ngModel)]="form.telefono"></div>
      <div class="col-md-4"><label class="form-label">Correo</label><input class="form-control" type="email" name="em" [(ngModel)]="form.email" email></div>
    </form>
    <div pie><button class="btn btn-light" (click)="modal=false">Cancelar</button><button class="btn btn-primary" (click)="guardar(f)">Guardar</button></div>
  </app-modal>

  <app-modal [abierto]="!!medicoHorario" [titulo]="'Horarios de disponibilidad: ' + (medicoHorario?.nombres ?? '') + ' ' + (medicoHorario?.apellidos ?? '')" (cerrar)="medicoHorario=null">
    <p class="text-muted small">Las citas sólo se pueden programar dentro de estas franjas.</p>
    <table class="table table-sm align-middle">
      <thead><tr><th>Día</th><th>Desde</th><th>Hasta</th><th></th></tr></thead>
      <tbody>
        @for (h of horarios; track $index) {
          <tr>
            <td><select class="form-select form-select-sm" [(ngModel)]="h.diaSemana" [name]="'d'+$index">
              @for (d of [1,2,3,4,5,6,7]; track d) { <option [ngValue]="d">{{ dias[d] }}</option> }</select></td>
            <td><input type="time" class="form-control form-control-sm" [(ngModel)]="h.horaInicio" [name]="'i'+$index"></td>
            <td><input type="time" class="form-control form-control-sm" [(ngModel)]="h.horaFin" [name]="'f'+$index"></td>
            <td><button class="btn btn-sm btn-outline-danger" (click)="horarios.splice($index,1)"><i class="bi bi-trash"></i></button></td>
          </tr>
        }
      </tbody>
    </table>
    <button class="btn btn-sm btn-outline-primary" (click)="horarios.push({ diaSemana: 1, horaInicio: '08:00', horaFin: '12:00' })">
      <i class="bi bi-plus"></i> Agregar franja</button>
    <div pie><button class="btn btn-light" (click)="medicoHorario=null">Cancelar</button><button class="btn btn-primary" (click)="guardarHorarios()">Guardar horarios</button></div>
  </app-modal>
  `
})
export class MedicosComponent implements OnInit {
  private api = inject(ApiService);
  dias = DIAS_SEMANA;
  medicos: Medico[] = [];
  especialidades: Especializacion[] = [];
  filtro = '';
  tabla = new Tabla<Medico>({ doc: x => x.numeroDocumento, nombre: x => x.nombres + ' ' + x.apellidos, esp: x => x.especializacion.nombre, registro: x => x.registroProfesional, estado: x => x.estado }, { campo: 'nombre' });
  modal = false;
  enviado = false;
  form: any = {};
  medicoHorario: Medico | null = null;
  horarios: Horario[] = [];

  ngOnInit(): void {
    this.cargar();
    this.api.get<Especializacion[]>('/especializacion/listar', { soloActivas: true }).subscribe(e => this.especialidades = e);
  }

  cargar(): void { this.api.get<Medico[]>('/medico/listar').subscribe({ next: m => this.medicos = m, error: e => Mensajes.error(e) }); }

  filtrados(): Medico[] {
    return this.medicos.filter(m => contiene(this.filtro, [m.nombres + ' ' + m.apellidos, m.numeroDocumento, m.especializacion.nombre, m.registroProfesional]));
  }

  nuevo(): void { this.form = { tipoDocumento: 'CC' }; this.enviado = false; this.modal = true; }

  editar(m: Medico): void {
    this.form = { ...m, especializacionId: m.especializacion.id };
    this.enviado = false; this.modal = true;
  }

  guardar(f: NgForm): void {
    this.enviado = true;
    if (f.invalid) { return; }
    const op = this.form.id ? this.api.put<Respuesta>('/medico/actualizar', this.form) : this.api.post<Respuesta>('/medico/crear', this.form);
    op.subscribe({ next: r => { Mensajes.exito(r.message); this.modal = false; this.cargar(); }, error: e => Mensajes.error(e) });
  }

  async estado(m: Medico): Promise<void> {
    if (!await Mensajes.confirmar(`¿${m.estado ? 'Inactivar' : 'Activar'} a ${m.nombres} ${m.apellidos}? Un veterinario inactivo no recibe citas.`)) { return; }
    this.api.patch<Respuesta>('/medico/cambiar-estado', {}, { medicoId: m.id, activo: !m.estado })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.cargar(); }, error: e => Mensajes.error(e) });
  }

  abrirHorarios(m: Medico): void {
    this.medicoHorario = m;
    this.api.get<Horario[]>('/medico/horarios', { medicoId: m.id }).subscribe(h =>
      this.horarios = h.map(x => ({ diaSemana: x.diaSemana, horaInicio: x.horaInicio.substring(0, 5), horaFin: x.horaFin.substring(0, 5) })));
  }

  guardarHorarios(): void {
    if (this.horarios.some(h => !h.horaInicio || !h.horaFin || h.horaInicio >= h.horaFin)) {
      Mensajes.aviso('Horario inválido', 'Cada franja debe tener hora de inicio menor que la hora de fin.');
      return;
    }
    this.api.put<Respuesta>('/medico/horarios', { medicoId: this.medicoHorario!.id, horarios: this.horarios })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.medicoHorario = null; }, error: e => Mensajes.error(e) });
  }
}
