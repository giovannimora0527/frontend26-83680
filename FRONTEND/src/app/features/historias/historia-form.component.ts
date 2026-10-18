import { Component, DestroyRef, OnInit, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Cita } from '../../core/models/cita';
import { Cliente, Mascota, Medico } from '../../core/models/catalogos';
import { CatalogoService } from '../../core/services/catalogo.service';
import { CitaService } from '../../core/services/cita.service';
import { HistoriaService } from '../../core/services/historia.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { mensajeDeError } from '../../core/utils/errores';
import { separarFechaHora, unirFechaHora } from '../../core/utils/fechas';
import { ModalComponent } from '../../shared/components/modal.component';

/**
 * Validador de grupo: la fecha y hora de la consulta no pueden ser futuras.
 * @param grupo Grupo con fecha y hora.
 * @returns Error 'fechaFutura' o null.
 */
function consultaNoFutura(grupo: AbstractControl): ValidationErrors | null {
  const fecha = grupo.get('fecha')?.value as string;
  const hora = grupo.get('hora')?.value as string;
  return fecha && hora && new Date(unirFechaHora(fecha, hora)).getTime() > Date.now() ? { fechaFutura: true } : null;
}

/** Formulario (modal) para crear una historia clínica: Cliente → Mascota → Cita atendida. */
@Component({
  selector: 'app-historia-form',
  imports: [ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal titulo="Nueva historia clínica" [ancho]="720" (cerrar)="cancelar.emit()">
      <form [formGroup]="form" (ngSubmit)="guardar()" class="formulario">
        <label>Cliente *
          <select formControlName="clienteId" [class.invalido]="invalido('clienteId')">
            <option [ngValue]="null">Seleccione…</option>
            @for (c of clientes(); track c.clienteId) { <option [ngValue]="c.clienteId">{{ c.nombres }} {{ c.apellidos }}</option> }
          </select>
          @if (invalido('clienteId')) { <span class="error-campo">El cliente es obligatorio.</span> }
        </label>
        <label>Mascota *
          <select formControlName="mascotaId" [class.invalido]="invalido('mascotaId')">
            <option [ngValue]="null">{{ form.controls.clienteId.value ? 'Seleccione…' : 'Primero elija un cliente' }}</option>
            @for (m of mascotas(); track m.mascotaId) { <option [ngValue]="m.mascotaId">{{ m.nombreMascota }}</option> }
          </select>
          @if (invalido('mascotaId')) { <span class="error-campo">La mascota es obligatoria.</span> }
        </label>
        <label class="ancho">Cita atendida *
          <select formControlName="citaId" [class.invalido]="invalido('citaId')">
            <option [ngValue]="null">{{ form.controls.mascotaId.value ? (citas().length ? 'Seleccione…' : 'La mascota no tiene citas atendidas') : 'Primero elija una mascota' }}</option>
            @for (c of citas(); track c.id) { <option [ngValue]="c.id">#{{ c.id }} · {{ c.fechaHora.substring(0, 10) }} {{ c.fechaHora.substring(11, 16) }} · {{ c.medicoNombre }}</option> }
          </select>
          @if (invalido('citaId')) { <span class="error-campo">Debe elegir la cita atendida que origina la historia.</span> }
        </label>
        <label>Veterinario *
          <select formControlName="medicoId" [class.invalido]="invalido('medicoId')">
            <option [ngValue]="null">Seleccione…</option>
            @for (m of medicos(); track m.id) { <option [ngValue]="m.id">{{ m.nombres }} {{ m.apellidos }}</option> }
          </select>
          @if (invalido('medicoId')) { <span class="error-campo">El veterinario es obligatorio.</span> }
        </label>
        <div class="formulario" formGroupName="momento" style="grid-template-columns: 1fr 1fr; padding: 0">
          <label>Fecha *<input type="date" formControlName="fecha" /></label>
          <label>Hora *<input type="time" formControlName="hora" /></label>
        </div>
        @if (form.controls.momento.errors?.['fechaFutura']) {
          <span class="error-campo ancho">La fecha de la consulta no puede ser futura.</span>
        }
        <label class="ancho">Motivo de consulta *
          <textarea rows="2" formControlName="motivoConsulta" maxlength="1000" [class.invalido]="invalido('motivoConsulta')"></textarea>
          @if (invalido('motivoConsulta')) { <span class="error-campo">El motivo es obligatorio.</span> }
        </label>
        <label class="ancho">Diagnóstico *
          <textarea rows="3" formControlName="diagnostico" maxlength="2000" [class.invalido]="invalido('diagnostico')"></textarea>
          @if (invalido('diagnostico')) { <span class="error-campo">El diagnóstico es obligatorio.</span> }
        </label>
        <label class="ancho">Observaciones
          <textarea rows="2" formControlName="observaciones" maxlength="2000"></textarea>
        </label>
        <div class="pie-modal ancho">
          <button type="button" class="btn" (click)="cancelar.emit()">Cancelar</button>
          <button type="submit" class="btn primario" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar' }}</button>
        </div>
      </form>
    </app-modal>
  `,
})
export class HistoriaFormComponent implements OnInit {
  /** Se emite cuando la historia se creó correctamente. */
  readonly guardada = output<void>();
  /** Se emite cuando el usuario cancela. */
  readonly cancelar = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly catalogo = inject(CatalogoService);
  private readonly citaService = inject(CitaService);
  private readonly historiaService = inject(HistoriaService);
  private readonly avisos = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly mascotas = signal<Mascota[]>([]);
  protected readonly medicos = signal<Medico[]>([]);
  protected readonly citas = signal<Cita[]>([]);
  protected readonly guardando = signal(false);

  /** Formulario reactivo de la historia clínica. */
  protected readonly form = this.fb.group({
    clienteId: this.fb.control<number | null>(null, Validators.required),
    mascotaId: this.fb.control<number | null>({ value: null, disabled: true }, Validators.required),
    citaId: this.fb.control<number | null>({ value: null, disabled: true }, Validators.required),
    medicoId: this.fb.control<number | null>(null, Validators.required),
    momento: this.fb.nonNullable.group({ fecha: ['', Validators.required], hora: ['', Validators.required] }, { validators: consultaNoFutura }),
    motivoConsulta: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)]),
    diagnostico: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2000)]),
    observaciones: this.fb.nonNullable.control('', Validators.maxLength(2000)),
  });

  /** Carga catálogos y enlaza los combos dependientes Cliente → Mascota → Cita. */
  ngOnInit(): void {
    this.catalogo.listarClientes().subscribe({ next: (d) => this.clientes.set(d), error: (e) => this.avisos.error(mensajeDeError(e)) });
    this.catalogo.listarMedicos().subscribe({ next: (d) => this.medicos.set(d), error: (e) => this.avisos.error(mensajeDeError(e)) });

    const { clienteId, mascotaId, citaId } = this.form.controls;
    clienteId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      mascotaId.setValue(null); this.mascotas.set([]);
      if (!id) { mascotaId.disable(); return; }
      this.catalogo.listarMascotasDeCliente(id).subscribe({
        next: (lista) => { this.mascotas.set(lista); mascotaId.enable(); },
        error: (e) => this.avisos.error(mensajeDeError(e)),
      });
    });
    mascotaId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      citaId.setValue(null); this.citas.set([]);
      if (!id) { citaId.disable(); return; }
      const cliente = clienteId.value;
      this.citaService.listar({ page: 0, size: 100, sortBy: 'fechaHora', sortDir: 'desc' }, { estado: 'ATENDIDA', clienteId: cliente, mascotaId: id }).subscribe({
        next: (r) => { this.citas.set(r.content); citaId.enable(); },
        error: (e) => this.avisos.error(mensajeDeError(e)),
      });
    });
    // Al elegir la cita se precargan veterinario, fecha, hora y motivo (editables).
    citaId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      const cita = this.citas().find((c) => c.id === id);
      if (!cita) return;
      const { fecha, hora } = separarFechaHora(cita.fechaHora);
      this.form.patchValue({ medicoId: cita.medicoId, momento: { fecha, hora }, motivoConsulta: cita.motivo });
    });
  }

  /** @returns true si el control es inválido y ya fue tocado. */
  protected invalido(nombre: 'clienteId' | 'mascotaId' | 'citaId' | 'medicoId' | 'motivoConsulta' | 'diagnostico'): boolean {
    const c = this.form.controls[nombre];
    return c.invalid && (c.touched || c.dirty);
  }

  /** Valida y crea la historia; el backend revalida que la cita sea atendida y pertenezca a la mascota. */
  protected guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.historiaService.crear({
      clienteId: v.clienteId!, mascotaId: v.mascotaId!, citaId: v.citaId!, medicoId: v.medicoId!,
      fechaHora: unirFechaHora(v.momento.fecha, v.momento.hora), motivoConsulta: v.motivoConsulta.trim(),
      diagnostico: v.diagnostico.trim(), observaciones: v.observaciones.trim() || undefined,
    }).subscribe({
      next: () => { this.avisos.exito('Historia clínica registrada correctamente.'); this.guardada.emit(); },
      error: (e) => { this.guardando.set(false); this.avisos.error(mensajeDeError(e)); },
    });
  }
}
