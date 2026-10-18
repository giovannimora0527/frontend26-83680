import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Medico } from '../../core/models/catalogos';
import { Anotacion, FiltroAnotacion, HistoriaDetalle } from '../../core/models/historia';
import { AnotacionService } from '../../core/services/anotacion.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { HistoriaService } from '../../core/services/historia.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { mensajeDeError } from '../../core/utils/errores';
import { CambioOrden, Columna, DataTableComponent } from '../../shared/components/data-table.component';
import { ModalComponent } from '../../shared/components/modal.component';

/**
 * Modal con el detalle completo de una historia clínica, el histórico de anotaciones de la mascota
 * (DataTable con filtros, orden y paginación) y el formulario para agregar anotaciones.
 */
@Component({
  selector: 'app-historia-detalle',
  imports: [ReactiveFormsModule, ModalComponent, DataTableComponent],
  template: `
    <app-modal [titulo]="'Historia clínica #' + historiaId()" [ancho]="900" (cerrar)="cerrar.emit()">
      @if (historia(); as h) {
        <dl class="detalle">
          <dt>Estado</dt><dd><span class="badge badge-{{ h.estado.toLowerCase() }}">{{ h.estado }}</span></dd>
          <dt>Fecha y hora</dt><dd>{{ h.fechaHora.replace('T', ' ').substring(0, 16) }}</dd>
          <dt>Cliente</dt><dd>{{ h.clienteNombre }}</dd>
          <dt>Mascota</dt><dd>{{ h.mascotaNombre }}</dd>
          <dt>Veterinario</dt><dd>{{ h.medicoNombre }}</dd>
          <dt>Cita de origen</dt><dd>#{{ h.citaId }}</dd>
          <dt>Motivo</dt><dd>{{ h.motivoConsulta }}</dd>
          <dt>Diagnóstico</dt><dd>{{ h.diagnostico }}</dd>
          <dt>Observaciones</dt><dd>{{ h.observaciones || '—' }}</dd>
        </dl>

        <div class="cabecera" style="margin-top: 18px">
          <h2>Histórico de anotaciones de {{ h.mascotaNombre }}</h2>
          @if (h.estado === 'ABIERTA') {
            <div class="acciones">
              <button class="btn chico primario" (click)="formAnotacion.set(!formAnotacion())">{{ formAnotacion() ? 'Ocultar formulario' : '+ Nueva anotación' }}</button>
              <button class="btn chico" (click)="cerrarHistoria()">Cerrar historia</button>
            </div>
          } @else {
            <span class="aviso">Historia cerrada: no admite nuevas anotaciones.</span>
          }
        </div>

        @if (formAnotacion() && h.estado === 'ABIERTA') {
          <form class="tarjeta formulario" [formGroup]="formNota" (ngSubmit)="guardarAnotacion()" style="margin-bottom: 14px">
            <label>Veterinario *
              <select formControlName="medicoId" [class.invalido]="formNota.controls.medicoId.invalid && formNota.controls.medicoId.touched">
                <option [ngValue]="null">Seleccione…</option>
                @for (m of medicos(); track m.id) { <option [ngValue]="m.id">{{ m.nombres }} {{ m.apellidos }}</option> }
              </select>
            </label>
            <label>Descripción *
              <input formControlName="descripcion" maxlength="255" [class.invalido]="formNota.controls.descripcion.invalid && formNota.controls.descripcion.touched" />
            </label>
            <label class="ancho">Observación *
              <textarea rows="2" formControlName="observacion" maxlength="2000" [class.invalido]="formNota.controls.observacion.invalid && formNota.controls.observacion.touched"></textarea>
            </label>
            <label class="ancho">Diagnóstico o evolución *
              <textarea rows="2" formControlName="diagnosticoEvolucion" maxlength="2000" [class.invalido]="formNota.controls.diagnosticoEvolucion.invalid && formNota.controls.diagnosticoEvolucion.touched"></textarea>
            </label>
            @if (formNota.touched && formNota.invalid) { <span class="error-campo ancho">Todos los campos marcados con * son obligatorios.</span> }
            <div class="pie-modal ancho"><button class="btn primario" type="submit" [disabled]="guardandoNota()">{{ guardandoNota() ? 'Guardando…' : 'Guardar anotación' }}</button></div>
          </form>
        }

        <form class="filtros" [formGroup]="filtros">
          <label>Buscar <input formControlName="texto" placeholder="Texto de la anotación…" /></label>
          <label>Desde <input type="date" formControlName="fechaDesde" /></label>
          <label>Hasta <input type="date" formControlName="fechaHasta" /></label>
        </form>
        <app-data-table [columnas]="columnas" [filas]="filas()" [totalElementos]="total()" [pagina]="pagina()" [tamano]="tamano()"
          [sortBy]="sortBy()" [sortDir]="sortDir()" [cargando]="cargando()"
          (cambiarPagina)="irAPagina($event)" (cambiarTamano)="cambiarTamano($event)" (ordenar)="ordenar($event)">
          <ng-template #acciones let-nota><button class="btn chico" (click)="verAnotacion(nota.id)">Ver detalle</button></ng-template>
        </app-data-table>
      } @else {
        <p>Cargando historia…</p>
      }

      @if (anotacionVista(); as a) {
        <app-modal titulo="Detalle de la anotación" [ancho]="560" (cerrar)="anotacionVista.set(null)">
          <dl class="detalle">
            <dt>Fecha y hora</dt><dd>{{ a.fecha.replace('T', ' ').substring(0, 16) }}</dd>
            <dt>Veterinario</dt><dd>{{ a.medicoNombre }}</dd>
            <dt>Historia</dt><dd>#{{ a.historiaId }}</dd>
            <dt>Descripción</dt><dd>{{ a.descripcion }}</dd>
            <dt>Observación</dt><dd>{{ a.observacion || '—' }}</dd>
            <dt>Diagnóstico / evolución</dt><dd>{{ a.diagnosticoEvolucion || '—' }}</dd>
          </dl>
        </app-modal>
      }
    </app-modal>
  `,
})
export class HistoriaDetalleComponent implements OnInit {
  /** Identificador de la historia a mostrar. */
  readonly historiaId = input.required<number>();
  /** Se emite al cerrar el modal. */
  readonly cerrar = output<void>();
  /** Se emite cuando la historia cambió (por ejemplo, se cerró) para refrescar el listado. */
  readonly cambio = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly historiaService = inject(HistoriaService);
  private readonly anotaciones = inject(AnotacionService);
  private readonly catalogo = inject(CatalogoService);
  private readonly avisos = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly historia = signal<HistoriaDetalle | null>(null);
  protected readonly medicos = signal<Medico[]>([]);
  protected readonly formAnotacion = signal(false);
  protected readonly guardandoNota = signal(false);
  protected readonly anotacionVista = signal<Anotacion | null>(null);

  /** Columnas del histórico; por defecto la más reciente primero. */
  protected readonly columnas: Columna[] = [
    { clave: 'fecha', titulo: 'Fecha y hora', ordenable: true, valor: (a: Anotacion) => a.fecha.replace('T', ' ').substring(0, 16) },
    { clave: 'medico', titulo: 'Veterinario', ordenable: true, valor: (a: Anotacion) => a.medicoNombre },
    { clave: 'historia', titulo: 'Historia', valor: (a: Anotacion) => '#' + a.historiaId },
    { clave: 'descripcion', titulo: 'Descripción', valor: (a: Anotacion) => a.descripcion },
  ];
  protected readonly filas = signal<Anotacion[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);
  protected readonly tamano = signal(5);
  protected readonly sortBy = signal('fecha');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly cargando = signal(false);

  protected readonly filtros = this.fb.group({ texto: [''], fechaDesde: [''], fechaHasta: [''] });
  protected readonly formNota = this.fb.group({
    medicoId: this.fb.control<number | null>(null, Validators.required),
    descripcion: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]),
    observacion: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2000)]),
    diagnosticoEvolucion: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2000)]),
  });

  /** Carga la historia, los veterinarios y el histórico; recarga al cambiar los filtros. */
  ngOnInit(): void {
    this.catalogo.listarMedicos().subscribe((d) => this.medicos.set(d));
    this.cargarHistoria(true);
    this.filtros.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.pagina.set(0); this.cargarAnotaciones(); });
  }

  /**
   * Consulta la historia; la primera vez también carga el histórico de la mascota.
   * @param primeraVez Si es true, al terminar carga las anotaciones.
   */
  private cargarHistoria(primeraVez: boolean): void {
    this.historiaService.obtener(this.historiaId()).subscribe({
      next: (h) => { this.historia.set(h); if (primeraVez) this.cargarAnotaciones(); },
      error: (e) => { this.avisos.error(mensajeDeError(e)); this.cerrar.emit(); },
    });
  }

  /** Consulta el histórico de anotaciones de la mascota con filtros, orden y paginación. */
  protected cargarAnotaciones(): void {
    const h = this.historia();
    if (!h) return;
    const f = { ...this.filtros.getRawValue(), mascotaId: h.mascotaId } as unknown as FiltroAnotacion;
    if (f.fechaDesde && f.fechaHasta && f.fechaHasta < f.fechaDesde) {
      this.avisos.error('La fecha final no puede ser anterior a la fecha inicial.');
      return;
    }
    this.cargando.set(true);
    this.anotaciones.listar({ page: this.pagina(), size: this.tamano(), sortBy: this.sortBy(), sortDir: this.sortDir() }, f).subscribe({
      next: (r) => { this.filas.set(r.content); this.total.set(r.totalElements); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.avisos.error(mensajeDeError(e)); },
    });
  }

  /** @param p Nueva página. */
  protected irAPagina(p: number): void { this.pagina.set(p); this.cargarAnotaciones(); }
  /** @param t Nuevo tamaño de página. */
  protected cambiarTamano(t: number): void { this.tamano.set(t); this.pagina.set(0); this.cargarAnotaciones(); }
  /** @param o Nuevo orden. */
  protected ordenar(o: CambioOrden): void { this.sortBy.set(o.sortBy); this.sortDir.set(o.sortDir); this.pagina.set(0); this.cargarAnotaciones(); }

  /** @param id Identificador de la anotación cuyo detalle se consulta. */
  protected verAnotacion(id: number): void {
    this.anotaciones.obtener(id).subscribe({ next: (a) => this.anotacionVista.set(a), error: (e) => this.avisos.error(mensajeDeError(e)) });
  }

  /** Valida y agrega una anotación a la historia abierta. */
  protected guardarAnotacion(): void {
    if (this.formNota.invalid) { this.formNota.markAllAsTouched(); return; }
    const v = this.formNota.getRawValue();
    this.guardandoNota.set(true);
    this.anotaciones.crear({
      historiaId: this.historiaId(), medicoId: v.medicoId!, descripcion: v.descripcion.trim(),
      observacion: v.observacion.trim(), diagnosticoEvolucion: v.diagnosticoEvolucion.trim(),
    }).subscribe({
      next: () => {
        this.guardandoNota.set(false);
        this.avisos.exito('Anotación agregada correctamente.');
        this.formNota.reset({ medicoId: null, descripcion: '', observacion: '', diagnosticoEvolucion: '' });
        this.formAnotacion.set(false);
        this.pagina.set(0); this.sortBy.set('fecha'); this.sortDir.set('desc');
        this.cargarAnotaciones();
      },
      error: (e) => { this.guardandoNota.set(false); this.avisos.error(mensajeDeError(e)); },
    });
  }

  /** Cierra la historia (queda solo lectura) tras pedir confirmación. */
  protected cerrarHistoria(): void {
    if (!confirm('¿Cerrar la historia clínica? Después no se podrán agregar anotaciones.')) return;
    this.historiaService.cerrar(this.historiaId()).subscribe({
      next: (h) => { this.historia.set(h); this.formAnotacion.set(false); this.avisos.exito('Historia clínica cerrada.'); this.cambio.emit(); },
      error: (e) => this.avisos.error(mensajeDeError(e)),
    });
  }
}
