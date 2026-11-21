import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Mensajes } from '../core/mensajes';
import { Cita, Cliente, Horario, Mascota, Medico, Respuesta, Tarifa } from '../core/models';
import { DIAS_SEMANA, hoyISO } from '../core/util';
import { ModalComponent } from './modal.component';

/** Formulario de cita reutilizado por recepción (módulo de citas) y por el veterinario (calendario). */
@Component({
  selector: 'app-cita-form',
  standalone: true,
  imports: [FormsModule, ModalComponent, DatePipe],
  template: `
  <app-modal [abierto]="abierto" [titulo]="cita ? 'Editar cita #' + cita.id : 'Nueva cita'" (cerrar)="cerrar.emit()">
    <form #f="ngForm" class="row g-3" novalidate>
      <div class="col-md-6"><label class="form-label requerido">Propietario</label>
        <select class="form-select" name="cli" [(ngModel)]="clienteId" (ngModelChange)="cargarMascotas()" required [disabled]="!!cita"
                #c="ngModel" [class.is-invalid]="c.invalid && enviado">
          @for (c of clientes; track c.id) { <option [ngValue]="c.id">{{ c.nombres }} {{ c.apellidos }} · {{ c.numeroDocumento }}</option> }
        </select></div>
      <div class="col-md-6"><label class="form-label requerido">Mascota</label>
        <select class="form-select" name="mas" [(ngModel)]="form.mascotaId" required [disabled]="!!cita || !clienteId"
                #m="ngModel" [class.is-invalid]="m.invalid && enviado">
          @for (m of mascotas; track m.mascotaId) { <option [ngValue]="m.mascotaId">{{ m.nombreMascota }} ({{ m.raza.especie }})</option> }
        </select></div>
      @if (!medicoFijo) {
        <div class="col-md-6"><label class="form-label requerido">Veterinario</label>
          <select class="form-select" name="med" [(ngModel)]="form.medicoId" (ngModelChange)="cargarDisponibilidad()" required
                  #md="ngModel" [class.is-invalid]="md.invalid && enviado">
            @for (m of medicos; track m.id) { <option [ngValue]="m.id">{{ m.nombres }} {{ m.apellidos }} · {{ m.especializacion.nombre }}</option> }
          </select></div>
      }
      <div class="col-md-6"><label class="form-label">Tipo de consulta / servicio</label>
        <select class="form-select" name="tar" [(ngModel)]="form.tarifaId" (ngModelChange)="calcularFin()">
          <option [ngValue]="null">Sin especificar (30 min)</option>
          @for (t of tarifas; track t.id) { <option [ngValue]="t.id">{{ t.nombre }} ({{ t.duracionMinutos }} min)</option> }
        </select></div>
      <div class="col-md-4"><label class="form-label requerido">Fecha</label>
        <input class="form-control" type="date" name="fecha" [(ngModel)]="fecha" (ngModelChange)="cargarDisponibilidad()" required [min]="hoy"
               #fe="ngModel" [class.is-invalid]="fe.invalid && enviado"></div>
      <div class="col-md-4"><label class="form-label requerido">Hora inicio</label>
        <input class="form-control" type="time" name="hi" [(ngModel)]="horaInicio" (ngModelChange)="calcularFin()" required step="900"
               #hi="ngModel" [class.is-invalid]="hi.invalid && enviado"></div>
      <div class="col-md-4"><label class="form-label requerido">Hora fin</label>
        <input class="form-control" type="time" name="hf" [(ngModel)]="horaFin" required step="300" #hf="ngModel" [class.is-invalid]="hf.invalid && enviado"></div>
      @if (form.medicoId && fecha) {
        <div class="col-12"><div class="alert alert-light border small mb-0">
          <strong>Disponibilidad {{ dias[diaSemana()] }}:</strong>
          @for (h of horariosDia(); track $index) { <span class="badge bg-success-subtle text-success-emphasis me-1">{{ h.horaInicio.substring(0,5) }} - {{ h.horaFin.substring(0,5) }}</span> }
          @empty { <span class="text-danger">El veterinario no atiende este día.</span> }
          @if (ocupadas.length) { <br><strong>Ocupado:</strong>
            @for (o of ocupadas; track o.id) { <span class="badge bg-danger-subtle text-danger-emphasis me-1">{{ o.fechaHora | date:'HH:mm' }} - {{ o.fechaHoraFin | date:'HH:mm' }}</span> } }
        </div></div>
      }
      <div class="col-md-8"><label class="form-label requerido">Motivo de la consulta</label>
        <textarea class="form-control" rows="2" name="mot" [(ngModel)]="form.motivo" required maxlength="2000" #mo="ngModel" [class.is-invalid]="mo.invalid && enviado"></textarea></div>
      @if (!cita) {
        <div class="col-md-4"><label class="form-label">Estado inicial</label>
          <select class="form-select" name="est" [(ngModel)]="form.estado"><option value="PROGRAMADA">Programada</option><option value="PENDIENTE">Pendiente</option><option value="CONFIRMADA">Confirmada</option></select></div>
      }
    </form>
    <div pie><button class="btn btn-light" (click)="cerrar.emit()">Cancelar</button>
      <button class="btn btn-primary" (click)="guardar(f)" [disabled]="guardando">Guardar</button></div>
  </app-modal>
  `
})
export class CitaFormComponent implements OnInit, OnChanges {
  private api = inject(ApiService);
  @Input() abierto = false;
  @Input() cita: Cita | null = null;
  /** Si se define, la cita queda en la agenda de ese veterinario (perfil MEDICO). */
  @Input() medicoFijo: number | null = null;
  @Input() inicioSugerido: Date | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<void>();

  dias = DIAS_SEMANA;
  hoy = hoyISO();
  clientes: Cliente[] = [];
  mascotas: Mascota[] = [];
  medicos: Medico[] = [];
  tarifas: Tarifa[] = [];
  horarios: Horario[] = [];
  ocupadas: Cita[] = [];
  clienteId: number | null = null;
  fecha = '';
  horaInicio = '';
  horaFin = '';
  form: any = {};
  enviado = false;
  guardando = false;

  ngOnInit(): void {
    this.api.get<Cliente[]>('/cliente/listar').subscribe(c => this.clientes = c.filter(x => x.activo));
    this.api.get<Tarifa[]>('/tarifa/listar', { soloActivas: true }).subscribe(t => this.tarifas = t);
    if (!this.medicoFijo) { this.api.get<Medico[]>('/medico/listar', { soloActivos: true }).subscribe(m => this.medicos = m); }
  }

  ngOnChanges(): void {
    if (!this.abierto) { return; }
    this.enviado = false;
    if (this.cita) {
      const c = this.cita;
      this.clienteId = c.cliente.id;
      this.form = { id: c.id, mascotaId: c.mascota.mascotaId, medicoId: c.medico.id, tarifaId: c.tarifa?.id ?? null, motivo: c.motivo };
      this.fecha = c.fechaHora.substring(0, 10);
      this.horaInicio = c.fechaHora.substring(11, 16);
      this.horaFin = c.fechaHoraFin.substring(11, 16);
      this.cargarMascotas(false);
    } else {
      this.clienteId = null; this.mascotas = [];
      this.form = { medicoId: this.medicoFijo, tarifaId: null, estado: 'PROGRAMADA' };
      const d = this.inicioSugerido;
      this.fecha = d ? d.toISOString().substring(0, 10) : '';
      if (d) {
        const p = (n: number) => String(n).padStart(2, '0');
        this.fecha = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
        this.horaInicio = `${p(d.getHours())}:${p(d.getMinutes())}`;
      } else { this.horaInicio = ''; }
      this.calcularFin();
    }
    this.cargarDisponibilidad();
  }

  cargarMascotas(limpiar = true): void {
    if (limpiar) { this.form.mascotaId = null; }
    if (!this.clienteId) { this.mascotas = []; return; }
    this.api.get<Mascota[]>('/mascota/buscar-by-cliente', { clienteId: this.clienteId })
      .subscribe(m => this.mascotas = m.filter(x => x.activo || x.mascotaId === this.form.mascotaId));
  }

  calcularFin(): void {
    if (!this.horaInicio) { return; }
    const dur = this.tarifas.find(t => t.id === this.form.tarifaId)?.duracionMinutos ?? 30;
    const [h, m] = this.horaInicio.split(':').map(Number);
    const total = h * 60 + m + dur;
    this.horaFin = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  diaSemana(): number {
    if (!this.fecha) { return 0; }
    const d = new Date(this.fecha + 'T00:00:00').getDay();
    return d === 0 ? 7 : d;
  }

  horariosDia(): Horario[] { return this.horarios.filter(h => h.diaSemana === this.diaSemana()); }

  cargarDisponibilidad(): void {
    const medicoId = this.form.medicoId;
    if (!medicoId) { return; }
    this.api.get<Horario[]>('/medico/horarios', { medicoId }).subscribe(h => this.horarios = h);
    this.ocupadas = [];
    if (this.fecha && !this.medicoFijo) {
      this.api.get<Cita[]>('/cita/listar', { fechaInicial: this.fecha, fechaFinal: this.fecha, medicoId })
        .subscribe(c => this.ocupadas = c.filter(x => x.estado !== 'CANCELADA' && x.id !== this.form.id));
    }
  }

  guardar(f: NgForm): void {
    this.enviado = true;
    if (f.invalid || !this.form.mascotaId || !this.form.medicoId) { return; }
    if (this.horaFin <= this.horaInicio) { Mensajes.aviso('Horario inválido', 'La hora fin debe ser posterior a la hora de inicio.'); return; }
    const body = { ...this.form, fechaHora: `${this.fecha}T${this.horaInicio}:00`, fechaHoraFin: `${this.fecha}T${this.horaFin}:00` };
    this.guardando = true;
    const op = this.cita ? this.api.put<Respuesta>('/cita/actualizar', body) : this.api.post<Respuesta>('/cita/crear', body);
    op.subscribe({
      next: r => { this.guardando = false; Mensajes.exito(r.message); this.guardado.emit(); },
      error: e => { this.guardando = false; Mensajes.error(e, 'No se pudo agendar'); }
    });
  }
}
