import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Cita, EstadoCita } from '../../core/models/cita';
import { Cliente, Mascota, Medico } from '../../core/models/catalogos';
import { CatalogoService } from '../../core/services/catalogo.service';
import { CitaService } from '../../core/services/cita.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { esPasada, hoyIso, separarFechaHora, unirFechaHora } from '../../core/utils/fechas';
import { mensajeDeError } from '../../core/utils/errores';
import { ModalComponent } from '../../shared/components/modal.component';

/** Transiciones de estado permitidas (espejo de EstadoCita del backend; el backend las valida igual). */
export const TRANSICIONES: Record<EstadoCita, EstadoCita[]> = {
  PENDIENTE: ['CONFIRMADA', 'PROGRAMADA', 'CANCELADA'],
  PROGRAMADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['ATENDIDA', 'CANCELADA'],
  ATENDIDA: [],
  CANCELADA: [],
};

/**
 * Crea un validador de grupo: la fecha y hora de la cita no pueden estar en el pasado.
 * Al editar, si la agenda no cambió respecto a la original se permite (solo se exige al reprogramar).
 * @param original Fecha y hora originales de la cita (solo en edición).
 * @returns Validador que devuelve el error 'fechaPasada' o null.
 */
function fechaNoPasada(original?: { fecha: string; hora: string }) {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const fecha = grupo.get('fecha')?.value as string;
    const hora = grupo.get('hora')?.value as string;
    if (original && fecha === original.fecha && hora === original.hora) return null;
    return fecha && hora && esPasada(fecha, hora) ? { fechaPasada: true } : null;
  };
}

/** Formulario (modal) para crear o editar una cita con combos dependientes Cliente → Mascota. */
@Component({
  selector: 'app-cita-form',
  imports: [ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal [titulo]="cita() ? 'Editar cita #' + cita()!.id : 'Nueva cita'" (cerrar)="cancelar.emit()">
      @if (bloqueoAgenda()) {
        <p class="aviso">Una cita confirmada no puede cambiar de fecha, hora ni veterinario; solo el motivo o el estado.</p>
      }
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
        <label>Veterinario *
          <select formControlName="medicoId" [class.invalido]="invalido('medicoId')">
            <option [ngValue]="null">Seleccione…</option>
            @for (m of medicos(); track m.id) { <option [ngValue]="m.id">{{ m.nombres }} {{ m.apellidos }}</option> }
          </select>
          @if (invalido('medicoId')) { <span class="error-campo">El veterinario es obligatorio.</span> }
        </label>
        <label>Estado *
          <select formControlName="estado">
            @for (e of estadosDisponibles(); track e) { <option [value]="e">{{ e }}</option> }
          </select>
        </label>
        <div class="formulario ancho" formGroupName="agenda" style="grid-template-columns: 1fr 1fr; padding: 0">
          <label>Fecha *
            <input type="date" formControlName="fecha" [min]="hoy" [class.invalido]="invalidoAgenda('fecha')" />
            @if (invalidoAgenda('fecha')) { <span class="error-campo">La fecha es obligatoria.</span> }
          </label>
          <label>Hora *
            <input type="time" formControlName="hora" step="900" [class.invalido]="invalidoAgenda('hora')" />
            @if (invalidoAgenda('hora')) { <span class="error-campo">La hora es obligatoria.</span> }
          </label>
          @if (form.controls.agenda.errors?.['fechaPasada'] && form.controls.agenda.touched) {
            <span class="error-campo ancho">No se pueden registrar citas en fechas u horas anteriores a la actual.</span>
          }
        </div>
        <label class="ancho">Motivo de la consulta *
          <textarea rows="3" formControlName="motivo" maxlength="500" [class.invalido]="invalido('motivo')"></textarea>
          @if (invalido('motivo')) { <span class="error-campo">El motivo es obligatorio (máximo 500 caracteres).</span> }
        </label>
        <div class="pie-modal ancho">
          <button type="button" class="btn" (click)="cancelar.emit()">Cancelar</button>
          <button type="submit" class="btn primario" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar' }}</button>
        </div>
      </form>
    </app-modal>
  `,
})
export class CitaFormComponent implements OnInit {
  /** Cita a editar; si es null se crea una nueva. */
  readonly cita = input<Cita | null>(null);
  /** Se emite cuando la cita se guardó correctamente. */
  readonly guardada = output<void>();
  /** Se emite cuando el usuario cancela. */
  readonly cancelar = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly catalogo = inject(CatalogoService);
  private readonly citaService = inject(CitaService);
  private readonly avisos = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  /** Fecha mínima seleccionable (hoy). */
  protected readonly hoy = hoyIso();
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly mascotas = signal<Mascota[]>([]);
  protected readonly medicos = signal<Medico[]>([]);
  protected readonly guardando = signal(false);
  protected readonly estadosDisponibles = signal<EstadoCita[]>(['PENDIENTE', 'CONFIRMADA', 'PROGRAMADA']);
  protected readonly bloqueoAgenda = signal(false);

  /** Formulario reactivo de la cita. */
  protected readonly form = this.fb.group({
    clienteId: this.fb.control<number | null>(null, Validators.required),
    mascotaId: this.fb.control<number | null>({ value: null, disabled: true }, Validators.required),
    medicoId: this.fb.control<number | null>(null, Validators.required),
    estado: this.fb.nonNullable.control<EstadoCita>('PENDIENTE'),
    agenda: this.fb.nonNullable.group(
      { fecha: ['', Validators.required], hora: ['', Validators.required] },
      { validators: fechaNoPasada() },
    ),
    motivo: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(500), Validators.pattern(/\S/)]),
  });

  /** Carga catálogos y, si es edición, precarga los datos y restringe lo que no se puede cambiar. */
  ngOnInit(): void {
    this.catalogo.listarClientes().subscribe({ next: (d) => this.clientes.set(d), error: (e) => this.avisos.error(mensajeDeError(e)) });
    this.catalogo.listarMedicos().subscribe({ next: (d) => this.medicos.set(d), error: (e) => this.avisos.error(mensajeDeError(e)) });

    // Combo dependiente: al cambiar el cliente se consultan solo sus mascotas.
    this.form.controls.clienteId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => this.cargarMascotas(id, true));

    const cita = this.cita();
    if (cita) {
      const { fecha, hora } = separarFechaHora(cita.fechaHora);
      this.form.controls.agenda.setValidators(fechaNoPasada({ fecha, hora }));
      this.form.patchValue({ medicoId: cita.medicoId, estado: cita.estado, agenda: { fecha, hora }, motivo: cita.motivo }, { emitEvent: false });
      this.form.controls.clienteId.setValue(cita.clienteId, { emitEvent: false });
      this.cargarMascotas(cita.clienteId, false, cita.mascotaId);
      // Reglas: no se cambia cliente/mascota; una cita confirmada no cambia agenda.
      this.form.controls.clienteId.disable();
      this.form.controls.mascotaId.disable();
      this.estadosDisponibles.set([cita.estado, ...TRANSICIONES[cita.estado]]);
      if (cita.estado === 'CONFIRMADA') {
        this.bloqueoAgenda.set(true);
        this.form.controls.medicoId.disable();
        this.form.controls.agenda.disable();
      }
    }
  }

  /**
   * Consulta las mascotas del cliente elegido y habilita el combo de mascotas.
   * @param clienteId Cliente seleccionado (o null).
   * @param reiniciar Si es true limpia la mascota previamente elegida.
   * @param seleccionar Mascota a seleccionar al terminar la carga (modo edición).
   */
  private cargarMascotas(clienteId: number | null, reiniciar: boolean, seleccionar?: number): void {
    const control = this.form.controls.mascotaId;
    if (reiniciar) control.setValue(null);
    this.mascotas.set([]);
    if (!clienteId) { control.disable(); return; }
    this.catalogo.listarMascotasDeCliente(clienteId).subscribe({
      next: (lista) => {
        this.mascotas.set(lista);
        if (!this.cita()) control.enable();
        if (seleccionar) control.setValue(seleccionar);
      },
      error: (e) => this.avisos.error(mensajeDeError(e)),
    });
  }

  /** @returns true si el control raíz es inválido y ya fue tocado. */
  protected invalido(nombre: 'clienteId' | 'mascotaId' | 'medicoId' | 'motivo'): boolean {
    const c = this.form.controls[nombre];
    return c.invalid && (c.touched || c.dirty);
  }

  /** @returns true si un control de la agenda es inválido y ya fue tocado. */
  protected invalidoAgenda(nombre: 'fecha' | 'hora'): boolean {
    const c = this.form.controls.agenda.controls[nombre];
    return c.invalid && c.touched;
  }

  /** Valida el formulario y crea o actualiza la cita; el backend vuelve a validar las reglas críticas. */
  protected guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const rq = {
      clienteId: v.clienteId!, mascotaId: v.mascotaId!, medicoId: v.medicoId!,
      fechaHora: unirFechaHora(v.agenda.fecha, v.agenda.hora), motivo: v.motivo.trim(), estado: v.estado,
    };
    this.guardando.set(true);
    const cita = this.cita();
    const peticion = cita ? this.citaService.actualizar(cita.id, rq) : this.citaService.crear(rq);
    peticion.subscribe({
      next: () => { this.avisos.exito(cita ? 'Cita actualizada correctamente.' : 'Cita registrada correctamente.'); this.guardada.emit(); },
      error: (e) => { this.guardando.set(false); this.avisos.error(mensajeDeError(e)); },
    });
  }
}
