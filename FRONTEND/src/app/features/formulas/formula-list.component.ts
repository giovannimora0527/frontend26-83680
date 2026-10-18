import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Mascota, Medicamento, Medico } from '../../core/models/catalogos';
import { FiltroFormula, FormulaDetalle, FormulaResumen } from '../../core/models/formula';
import { CatalogoService } from '../../core/services/catalogo.service';
import { FormulaService } from '../../core/services/formula.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { mensajeDeError } from '../../core/utils/errores';
import { CambioOrden, Columna, DataTableComponent } from '../../shared/components/data-table.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { FormulaFormComponent } from './formula-form.component';

/** Listado de fórmulas médicas con filtros, orden, paginación, edición, detalle e inactivación. */
@Component({
  selector: 'app-formula-list',
  imports: [ReactiveFormsModule, DataTableComponent, ModalComponent, FormulaFormComponent],
  template: `
    <div class="cabecera">
      <h1>Fórmulas médicas</h1>
      <button class="btn primario" (click)="abrirForm(null)">+ Nueva fórmula</button>
    </div>
    <form class="tarjeta filtros" [formGroup]="filtros">
      <label>Buscar <input formControlName="texto" placeholder="Mascota, veterinario, medicamento…" /></label>
      <label>Mascota
        <select formControlName="mascotaId">
          <option [ngValue]="null">Todas</option>
          @for (m of mascotas(); track m.mascotaId) { <option [ngValue]="m.mascotaId">{{ m.nombreMascota }}</option> }
        </select>
      </label>
      <label>Veterinario
        <select formControlName="medicoId">
          <option [ngValue]="null">Todos</option>
          @for (m of medicos(); track m.id) { <option [ngValue]="m.id">{{ m.nombres }} {{ m.apellidos }}</option> }
        </select>
      </label>
      <label>Medicamento
        <select formControlName="medicamentoId">
          <option [ngValue]="null">Todos</option>
          @for (m of medicamentos(); track m.id) { <option [ngValue]="m.id">{{ m.nombre }}</option> }
        </select>
      </label>
      <label>Estado
        <select formControlName="activa"><option value="">Todas</option><option value="true">Activas</option><option value="false">Inactivas</option></select>
      </label>
      <label>Emitida desde <input type="date" formControlName="fechaDesde" /></label>
      <label>Emitida hasta <input type="date" formControlName="fechaHasta" /></label>
      <button type="button" class="btn" (click)="limpiar()">Limpiar filtros</button>
    </form>

    <app-data-table [columnas]="columnas" [filas]="filas()" [totalElementos]="total()" [pagina]="pagina()" [tamano]="tamano()"
      [sortBy]="sortBy()" [sortDir]="sortDir()" [cargando]="cargando()"
      (cambiarPagina)="irAPagina($event)" (cambiarTamano)="cambiarTamano($event)" (ordenar)="ordenar($event)">
      <ng-template #acciones let-f>
        <div class="acciones">
          <button class="btn chico" (click)="ver(f.id)">Ver</button>
          @if (f.activa) {
            <button class="btn chico" (click)="editar(f.id)">Editar</button>
            <button class="btn chico peligro" (click)="inactivar(f)">Inactivar</button>
          }
        </div>
      </ng-template>
    </app-data-table>

    @if (formAbierto()) {
      <app-formula-form [formula]="editando()" (guardada)="alGuardar()" (cancelar)="formAbierto.set(false)" />
    }
    @if (detalle(); as d) {
      <app-modal [titulo]="'Fórmula #' + d.id" (cerrar)="detalle.set(null)">
        <dl class="detalle">
          <dt>Estado</dt><dd><span class="badge" [class.badge-activa]="d.activa" [class.badge-inactiva]="!d.activa">{{ d.activa ? 'Activa' : 'Inactiva' }}</span></dd>
          <dt>Mascota</dt><dd>{{ d.mascotaNombre }}</dd>
          <dt>Cliente</dt><dd>{{ d.clienteNombre }}</dd>
          <dt>Consulta</dt><dd>Historia #{{ d.historiaId }} (cita #{{ d.citaId }}) · {{ d.fechaConsulta.replace('T', ' ').substring(0, 16) }}</dd>
          <dt>Veterinario</dt><dd>{{ d.medicoNombre }}</dd>
          <dt>Medicamento</dt><dd>{{ d.medicamentoNombre }}</dd>
          <dt>Fecha de emisión</dt><dd>{{ d.fechaEmision }}</dd>
          <dt>Dosis</dt><dd>{{ d.dosis }}</dd>
          <dt>Frecuencia</dt><dd>{{ d.frecuencia }}</dd>
          <dt>Duración</dt><dd>{{ d.duracionDias }} días</dd>
          <dt>Indicaciones</dt><dd>{{ d.indicaciones }}</dd>
          <dt>Creada</dt><dd>{{ d.fechaCreacion.replace('T', ' ').substring(0, 16) }}</dd>
          <dt>Última actualización</dt><dd>{{ d.fechaActualizacion ? d.fechaActualizacion.replace('T', ' ').substring(0, 16) : '—' }}</dd>
        </dl>
      </app-modal>
    }
  `,
})
export class FormulaListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly formulaService = inject(FormulaService);
  private readonly catalogo = inject(CatalogoService);
  private readonly avisos = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  /** Columnas del listado: solo un resumen; el resto se ve en el detalle. */
  protected readonly columnas: Columna[] = [
    { clave: 'fechaEmision', titulo: 'Emisión', ordenable: true, valor: (f: FormulaResumen) => f.fechaEmision },
    { clave: 'mascota', titulo: 'Mascota', ordenable: true, valor: (f: FormulaResumen) => f.mascotaNombre },
    { clave: 'medico', titulo: 'Veterinario', ordenable: true, valor: (f: FormulaResumen) => f.medicoNombre },
    { clave: 'medicamento', titulo: 'Medicamento', ordenable: true, valor: (f: FormulaResumen) => f.medicamentoNombre },
    { clave: 'fechaCreacion', titulo: 'Creada', ordenable: true, valor: (f: FormulaResumen) => f.fechaCreacion.replace('T', ' ').substring(0, 16) },
    { clave: 'estado', titulo: 'Estado', ordenable: true, etiqueta: true, valor: (f: FormulaResumen) => (f.activa ? 'Activa' : 'Inactiva') },
  ];

  protected readonly filas = signal<FormulaResumen[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);
  protected readonly tamano = signal(10);
  /** Orden inicial exigido: fecha de creación descendente (las más recientes primero). */
  protected readonly sortBy = signal('fechaCreacion');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly cargando = signal(false);
  protected readonly formAbierto = signal(false);
  protected readonly editando = signal<FormulaDetalle | null>(null);
  protected readonly detalle = signal<FormulaDetalle | null>(null);

  protected readonly mascotas = signal<Mascota[]>([]);
  protected readonly medicos = signal<Medico[]>([]);
  protected readonly medicamentos = signal<Medicamento[]>([]);

  protected readonly filtros = this.fb.group({
    texto: [''],
    mascotaId: this.fb.control<number | null>(null),
    medicoId: this.fb.control<number | null>(null),
    medicamentoId: this.fb.control<number | null>(null),
    activa: [''], fechaDesde: [''], fechaHasta: [''],
  });

  /** Carga catálogos de filtros y la primera página; recarga al cambiar los filtros. */
  ngOnInit(): void {
    this.catalogo.listarMascotas().subscribe((d) => this.mascotas.set(d));
    this.catalogo.listarMedicos().subscribe((d) => this.medicos.set(d));
    this.catalogo.listarMedicamentos().subscribe((d) => this.medicamentos.set(d));
    this.filtros.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.pagina.set(0); this.cargar(); });
    this.cargar();
  }

  /** Consulta la página actual al backend. */
  protected cargar(): void {
    const f = this.filtros.getRawValue() as unknown as FiltroFormula;
    if (f.fechaDesde && f.fechaHasta && f.fechaHasta < f.fechaDesde) {
      this.avisos.error('La fecha final no puede ser anterior a la fecha inicial.');
      return;
    }
    this.cargando.set(true);
    this.formulaService.listar({ page: this.pagina(), size: this.tamano(), sortBy: this.sortBy(), sortDir: this.sortDir() }, f).subscribe({
      next: (r) => { this.filas.set(r.content); this.total.set(r.totalElements); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.avisos.error(mensajeDeError(e)); },
    });
  }

  /** @param p Nueva página. */
  protected irAPagina(p: number): void { this.pagina.set(p); this.cargar(); }
  /** @param t Nuevo tamaño de página. */
  protected cambiarTamano(t: number): void { this.tamano.set(t); this.pagina.set(0); this.cargar(); }
  /** @param o Nuevo orden. */
  protected ordenar(o: CambioOrden): void { this.sortBy.set(o.sortBy); this.sortDir.set(o.sortDir); this.pagina.set(0); this.cargar(); }

  /** Restablece los filtros. */
  protected limpiar(): void {
    this.filtros.reset({ texto: '', mascotaId: null, medicoId: null, medicamentoId: null, activa: '', fechaDesde: '', fechaHasta: '' });
  }

  /** @param id Identificador de la fórmula cuyo detalle completo se consulta. */
  protected ver(id: number): void {
    this.formulaService.obtener(id).subscribe({ next: (d) => this.detalle.set(d), error: (e) => this.avisos.error(mensajeDeError(e)) });
  }

  /** @param id Identificador de la fórmula a editar (se consulta el detalle completo). */
  protected editar(id: number): void {
    this.formulaService.obtener(id).subscribe({ next: (d) => this.abrirForm(d), error: (e) => this.avisos.error(mensajeDeError(e)) });
  }

  /** @param formula Fórmula a editar, o null para crear una nueva. */
  protected abrirForm(formula: FormulaDetalle | null): void { this.editando.set(formula); this.formAbierto.set(true); }

  /** Cierra el formulario y refresca el listado. */
  protected alGuardar(): void { this.formAbierto.set(false); this.cargar(); }

  /** @param f Fórmula a inactivar (no existe eliminación física). */
  protected inactivar(f: FormulaResumen): void {
    if (!confirm(`¿Inactivar la fórmula de ${f.mascotaNombre}? Quedará en el historial pero no podrá editarse.`)) return;
    this.formulaService.inactivar(f.id).subscribe({
      next: () => { this.avisos.exito('Fórmula inactivada correctamente.'); this.cargar(); },
      error: (e) => this.avisos.error(mensajeDeError(e)),
    });
  }
}
