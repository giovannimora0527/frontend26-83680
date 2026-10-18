import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Cliente, Mascota, Medicamento, Medico } from '../../core/models/catalogos';
import { FormulaDetalle } from '../../core/models/formula';
import { HistoriaResumen } from '../../core/models/historia';
import { CatalogoService } from '../../core/services/catalogo.service';
import { FormulaService } from '../../core/services/formula.service';
import { HistoriaService } from '../../core/services/historia.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { mensajeDeError } from '../../core/utils/errores';
import { hoyIso } from '../../core/utils/fechas';
import { ModalComponent } from '../../shared/components/modal.component';

/** La dosis debe iniciar con un número mayor que cero seguido de la unidad (ej. "5 mg"). */
const PATRON_DOSIS = /^\s*(\d+(?:[.,]\d+)?)\s*\p{L}.*$/u;

/**
 * Validador de dosis: número positivo + unidad (misma regla que el backend).
 * @param control Control de la dosis.
 * @returns Error 'dosisInvalida' o 'dosisCero', o null si es válida.
 */
function validarDosis(control: AbstractControl): ValidationErrors | null {
  const valor = (control.value ?? '') as string;
  if (!valor.trim()) return null; // lo cubre Validators.required
  const m = PATRON_DOSIS.exec(valor);
  if (!m) return { dosisInvalida: true };
  return parseFloat(m[1].replace(',', '.')) > 0 ? null : { dosisCero: true };
}

/** Formulario (modal) para crear o editar una fórmula médica. */
@Component({
  selector: 'app-formula-form',
  imports: [ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal [titulo]="formula() ? 'Editar fórmula #' + formula()!.id : 'Nueva fórmula médica'" [ancho]="720" (cerrar)="cancelar.emit()">
      <form [formGroup]="form" (ngSubmit)="guardar()" class="formulario">
        @if (formula(); as f) {
          <dl class="detalle ancho">
            <dt>Mascota</dt><dd>{{ f.mascotaNombre }} (cliente {{ f.clienteNombre }})</dd>
            <dt>Consulta</dt><dd>Historia #{{ f.historiaId }} · {{ f.fechaConsulta.replace('T', ' ').substring(0, 16) }}</dd>
            <dt>Veterinario</dt><dd>{{ f.medicoNombre }}</dd>
          </dl>
          <p class="aviso ancho">La mascota, la consulta y el veterinario no pueden cambiarse; solo la prescripción.</p>
        } @else {
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
          <label class="ancho">Historia clínica / consulta *
            <select formControlName="historiaId" [class.invalido]="invalido('historiaId')">
              <option [ngValue]="null">{{ form.controls.mascotaId.value ? (historias().length ? 'Seleccione…' : 'La mascota no tiene consultas registradas') : 'Primero elija una mascota' }}</option>
              @for (h of historias(); track h.id) { <option [ngValue]="h.id">#{{ h.id }} · {{ h.fechaHora.replace('T', ' ').substring(0, 16) }} · {{ h.motivoConsulta }}</option> }
            </select>
            @if (invalido('historiaId')) { <span class="error-campo">Debe asociar la fórmula a una consulta de la mascota.</span> }
          </label>
          <label>Veterinario *
            <select formControlName="medicoId" [class.invalido]="invalido('medicoId')">
              <option [ngValue]="null">Seleccione…</option>
              @for (m of medicos(); track m.id) { <option [ngValue]="m.id">{{ m.nombres }} {{ m.apellidos }}</option> }
            </select>
            @if (invalido('medicoId')) { <span class="error-campo">El veterinario es obligatorio.</span> }
          </label>
        }
        <label>Medicamento *
          <select formControlName="medicamentoId" [class.invalido]="invalido('medicamentoId')">
            <option [ngValue]="null">Seleccione…</option>
            @for (m of medicamentos(); track m.id) { <option [ngValue]="m.id">{{ m.nombre }}{{ m.presentacion ? ' — ' + m.presentacion : '' }}</option> }
          </select>
          @if (invalido('medicamentoId')) { <span class="error-campo">El medicamento es obligatorio.</span> }
        </label>
        <label>Fecha de emisión *
          <input type="date" formControlName="fechaEmision" [min]="fechaMinima()" [class.invalido]="invalido('fechaEmision')" />
          @if (form.controls.fechaEmision.errors?.['requerida'] || form.controls.fechaEmision.errors?.['required']) { <span class="error-campo">La fecha de emisión es obligatoria.</span> }
          @if (form.controls.fechaEmision.errors?.['anteriorConsulta']) { <span class="error-campo">No puede ser anterior a la fecha de la consulta ({{ fechaMinima() }}).</span> }
        </label>
        <label>Dosis * <small>(número + unidad, ej. 5 mg)</small>
          <input formControlName="dosis" maxlength="255" [class.invalido]="invalido('dosis')" />
          @if (form.controls.dosis.touched && form.controls.dosis.errors?.['required']) { <span class="error-campo">La dosis es obligatoria.</span> }
          @if (form.controls.dosis.errors?.['dosisInvalida']) { <span class="error-campo">Escriba un número seguido de la unidad (por ejemplo: 5 mg, 1 tableta).</span> }
          @if (form.controls.dosis.errors?.['dosisCero']) { <span class="error-campo">La dosis debe ser mayor que cero.</span> }
        </label>
        <label>Frecuencia * <small>(ej. cada 8 horas)</small>
          <input formControlName="frecuencia" maxlength="100" [class.invalido]="invalido('frecuencia')" />
          @if (invalido('frecuencia')) { <span class="error-campo">La frecuencia es obligatoria.</span> }
        </label>
        <label>Duración del tratamiento (días) *
          <input type="number" formControlName="duracionDias" min="1" max="365" [class.invalido]="invalido('duracionDias')" />
          @if (invalido('duracionDias')) { <span class="error-campo">Ingrese un número entero de días entre 1 y 365.</span> }
        </label>
        <label class="ancho">Indicaciones *
          <textarea rows="3" formControlName="indicaciones" maxlength="255" [class.invalido]="invalido('indicaciones')"></textarea>
          @if (invalido('indicaciones')) { <span class="error-campo">Las indicaciones son obligatorias.</span> }
        </label>
        <div class="pie-modal ancho">
          <button type="button" class="btn" (click)="cancelar.emit()">Cancelar</button>
          <button type="submit" class="btn primario" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar' }}</button>
        </div>
      </form>
    </app-modal>
  `,
})
export class FormulaFormComponent implements OnInit {
  /** Fórmula a editar; si es null se crea una nueva. */
  readonly formula = input<FormulaDetalle | null>(null);
  /** Se emite cuando la fórmula se guardó. */
  readonly guardada = output<void>();
  /** Se emite cuando el usuario cancela. */
  readonly cancelar = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly catalogo = inject(CatalogoService);
  private readonly historiaService = inject(HistoriaService);
  private readonly formulaService = inject(FormulaService);
  private readonly avisos = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly mascotas = signal<Mascota[]>([]);
  protected readonly historias = signal<HistoriaResumen[]>([]);
  protected readonly medicos = signal<Medico[]>([]);
  protected readonly medicamentos = signal<Medicamento[]>([]);
  protected readonly guardando = signal(false);
  /** Fecha mínima de emisión: el día de la consulta asociada (vacío si aún no hay consulta). */
  protected readonly fechaMinima = signal('');

  /** Formulario reactivo de la fórmula. */
  protected readonly form = this.fb.group({
    clienteId: this.fb.control<number | null>(null, Validators.required),
    mascotaId: this.fb.control<number | null>({ value: null, disabled: true }, Validators.required),
    historiaId: this.fb.control<number | null>({ value: null, disabled: true }, Validators.required),
    medicoId: this.fb.control<number | null>(null, Validators.required),
    medicamentoId: this.fb.control<number | null>(null, Validators.required),
    fechaEmision: this.fb.nonNullable.control(hoyIso(), [Validators.required, (c: AbstractControl) => this.validarEmision(c)]),
    dosis: this.fb.nonNullable.control('', [Validators.required, validarDosis]),
    frecuencia: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]),
    duracionDias: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(365), Validators.pattern(/^\d+$/)]),
    indicaciones: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]),
  });

  /**
   * La fecha de emisión no puede ser anterior a la fecha de la consulta asociada.
   * @param control Control de la fecha de emisión.
   * @returns Error 'anteriorConsulta' o null.
   */
  private validarEmision(control: AbstractControl): ValidationErrors | null {
    const minima = this.fechaMinima();
    const valor = control.value as string;
    return minima && valor && valor < minima ? { anteriorConsulta: true } : null;
  }

  /** Carga catálogos; en creación enlaza Cliente → Mascota → Historia, en edición precarga la fórmula. */
  ngOnInit(): void {
    this.catalogo.listarMedicamentos().subscribe({ next: (d) => this.medicamentos.set(d), error: (e) => this.avisos.error(mensajeDeError(e)) });
    const f = this.formula();
    if (f) {
      // Edición: la asociación (mascota, historia, veterinario) es inmutable, se quitan sus validaciones.
      for (const k of ['clienteId', 'mascotaId', 'historiaId', 'medicoId'] as const) this.form.controls[k].clearValidators();
      this.form.patchValue({
        medicamentoId: f.medicamentoId, fechaEmision: f.fechaEmision, dosis: f.dosis,
        frecuencia: f.frecuencia, duracionDias: f.duracionDias, indicaciones: f.indicaciones,
      });
      this.fechaMinima.set(f.fechaConsulta.substring(0, 10));
      this.form.controls.fechaEmision.updateValueAndValidity();
      return;
    }
    this.catalogo.listarClientes().subscribe({ next: (d) => this.clientes.set(d), error: (e) => this.avisos.error(mensajeDeError(e)) });
    this.catalogo.listarMedicos().subscribe({ next: (d) => this.medicos.set(d), error: (e) => this.avisos.error(mensajeDeError(e)) });

    const { clienteId, mascotaId, historiaId, medicoId, fechaEmision } = this.form.controls;
    clienteId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      mascotaId.setValue(null); this.mascotas.set([]);
      if (!id) { mascotaId.disable(); return; }
      this.catalogo.listarMascotasDeCliente(id).subscribe({
        next: (lista) => { this.mascotas.set(lista); mascotaId.enable(); },
        error: (e) => this.avisos.error(mensajeDeError(e)),
      });
    });
    mascotaId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      historiaId.setValue(null); this.historias.set([]);
      if (!id) { historiaId.disable(); return; }
      this.historiaService.listar({ page: 0, size: 100, sortBy: 'fechaHora', sortDir: 'desc' }, { mascotaId: id }).subscribe({
        next: (r) => { this.historias.set(r.content); historiaId.enable(); },
        error: (e) => this.avisos.error(mensajeDeError(e)),
      });
    });
    // Al elegir la consulta se sugiere su veterinario y se fija la fecha mínima de emisión.
    historiaId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      const h = this.historias().find((x) => x.id === id);
      this.fechaMinima.set(h ? h.fechaHora.substring(0, 10) : '');
      if (h) medicoId.setValue(h.medicoId);
      fechaEmision.updateValueAndValidity();
    });
  }

  /** @returns true si el control es inválido y ya fue tocado. */
  protected invalido(nombre: 'clienteId' | 'mascotaId' | 'historiaId' | 'medicoId' | 'medicamentoId' | 'fechaEmision' | 'dosis' | 'frecuencia' | 'duracionDias' | 'indicaciones'): boolean {
    const c = this.form.controls[nombre];
    return c.invalid && (c.touched || c.dirty);
  }

  /** Valida y crea o actualiza la fórmula; el backend revalida todas las reglas de negocio. */
  protected guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const f = this.formula();
    const rq = {
      mascotaId: f ? f.mascotaId : v.mascotaId!, historiaId: f ? f.historiaId : v.historiaId!, medicoId: f ? f.medicoId : v.medicoId!,
      medicamentoId: v.medicamentoId!, fechaEmision: v.fechaEmision, dosis: v.dosis.trim(),
      frecuencia: v.frecuencia.trim(), duracionDias: Number(v.duracionDias), indicaciones: v.indicaciones.trim(),
    };
    this.guardando.set(true);
    (f ? this.formulaService.actualizar(f.id, rq) : this.formulaService.crear(rq)).subscribe({
      next: () => { this.avisos.exito(f ? 'Fórmula actualizada correctamente.' : 'Fórmula registrada correctamente.'); this.guardada.emit(); },
      error: (e) => { this.guardando.set(false); this.avisos.error(mensajeDeError(e)); },
    });
  }
}
