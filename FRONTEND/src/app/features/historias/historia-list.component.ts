import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Cliente, Mascota, Medico } from '../../core/models/catalogos';
import { FiltroHistoria, HistoriaResumen } from '../../core/models/historia';
import { CatalogoService } from '../../core/services/catalogo.service';
import { HistoriaService } from '../../core/services/historia.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { mensajeDeError } from '../../core/utils/errores';
import { CambioOrden, Columna, DataTableComponent } from '../../shared/components/data-table.component';
import { HistoriaDetalleComponent } from './historia-detalle.component';
import { HistoriaFormComponent } from './historia-form.component';

/** Listado de historias clínicas (consultas) con filtros, orden y paginación. */
@Component({
  selector: 'app-historia-list',
  imports: [ReactiveFormsModule, DataTableComponent, HistoriaFormComponent, HistoriaDetalleComponent],
  template: `
    <div class="cabecera">
      <h1>Historias clínicas</h1>
      <button class="btn primario" (click)="formAbierto.set(true)">+ Nueva historia</button>
    </div>
    <form class="tarjeta filtros" [formGroup]="filtros">
      <label>Buscar <input formControlName="texto" placeholder="Cliente, mascota, motivo…" /></label>
      <label>Estado
        <select formControlName="estado"><option value="">Todos</option><option value="ABIERTA">ABIERTA</option><option value="CERRADA">CERRADA</option></select>
      </label>
      <label>Cliente
        <select formControlName="clienteId">
          <option [ngValue]="null">Todos</option>
          @for (c of clientes(); track c.clienteId) { <option [ngValue]="c.clienteId">{{ c.nombres }} {{ c.apellidos }}</option> }
        </select>
      </label>
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
      <label>Desde <input type="date" formControlName="fechaDesde" /></label>
      <label>Hasta <input type="date" formControlName="fechaHasta" /></label>
      <button type="button" class="btn" (click)="limpiar()">Limpiar filtros</button>
    </form>

    <app-data-table [columnas]="columnas" [filas]="filas()" [totalElementos]="total()" [pagina]="pagina()" [tamano]="tamano()"
      [sortBy]="sortBy()" [sortDir]="sortDir()" [cargando]="cargando()"
      (cambiarPagina)="irAPagina($event)" (cambiarTamano)="cambiarTamano($event)" (ordenar)="ordenar($event)">
      <ng-template #acciones let-h><button class="btn chico" (click)="historiaVista.set(h.id)">Ver</button></ng-template>
    </app-data-table>

    @if (formAbierto()) {
      <app-historia-form (guardada)="formAbierto.set(false); cargar()" (cancelar)="formAbierto.set(false)" />
    }
    @if (historiaVista(); as id) {
      <app-historia-detalle [historiaId]="id" (cerrar)="historiaVista.set(null)" (cambio)="cargar()" />
    }
  `,
})
export class HistoriaListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly historiaService = inject(HistoriaService);
  private readonly catalogo = inject(CatalogoService);
  private readonly avisos = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  /** Columnas del DataTable. */
  protected readonly columnas: Columna[] = [
    { clave: 'fechaHora', titulo: 'Fecha', ordenable: true, valor: (h: HistoriaResumen) => h.fechaHora.replace('T', ' ').substring(0, 16) },
    { clave: 'mascota', titulo: 'Mascota', ordenable: true, valor: (h: HistoriaResumen) => h.mascotaNombre },
    { clave: 'cliente', titulo: 'Cliente', ordenable: true, valor: (h: HistoriaResumen) => h.clienteNombre },
    { clave: 'medico', titulo: 'Veterinario', ordenable: true, valor: (h: HistoriaResumen) => h.medicoNombre },
    { clave: 'motivo', titulo: 'Motivo de consulta', ordenable: true, valor: (h: HistoriaResumen) => h.motivoConsulta },
    { clave: 'estado', titulo: 'Estado', ordenable: true, etiqueta: true, valor: (h: HistoriaResumen) => h.estado },
  ];

  protected readonly filas = signal<HistoriaResumen[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);
  protected readonly tamano = signal(10);
  /** Orden inicial exigido: fecha y hora de la consulta descendente. */
  protected readonly sortBy = signal('fechaHora');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly cargando = signal(false);
  protected readonly formAbierto = signal(false);
  protected readonly historiaVista = signal<number | null>(null);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly mascotas = signal<Mascota[]>([]);
  protected readonly medicos = signal<Medico[]>([]);

  protected readonly filtros = this.fb.group({
    texto: [''], estado: [''],
    clienteId: this.fb.control<number | null>(null),
    mascotaId: this.fb.control<number | null>(null),
    medicoId: this.fb.control<number | null>(null),
    fechaDesde: [''], fechaHasta: [''],
  });

  /** Carga catálogos y la primera página; recarga al cambiar los filtros. */
  ngOnInit(): void {
    this.catalogo.listarClientes().subscribe((d) => this.clientes.set(d));
    this.catalogo.listarMedicos().subscribe((d) => this.medicos.set(d));
    this.cargarMascotasFiltro(null);
    this.filtros.controls.clienteId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      this.filtros.controls.mascotaId.setValue(null, { emitEvent: false });
      this.cargarMascotasFiltro(id);
    });
    this.filtros.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.pagina.set(0); this.cargar(); });
    this.cargar();
  }

  private cargarMascotasFiltro(clienteId: number | null): void {
    (clienteId ? this.catalogo.listarMascotasDeCliente(clienteId) : this.catalogo.listarMascotas()).subscribe((d) => this.mascotas.set(d));
  }

  /** Consulta la página actual al backend. */
  protected cargar(): void {
    const f = this.filtros.getRawValue() as unknown as FiltroHistoria;
    if (f.fechaDesde && f.fechaHasta && f.fechaHasta < f.fechaDesde) {
      this.avisos.error('La fecha final no puede ser anterior a la fecha inicial.');
      return;
    }
    this.cargando.set(true);
    this.historiaService.listar({ page: this.pagina(), size: this.tamano(), sortBy: this.sortBy(), sortDir: this.sortDir() }, f).subscribe({
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
    this.filtros.reset({ texto: '', estado: '', clienteId: null, mascotaId: null, medicoId: null, fechaDesde: '', fechaHasta: '' });
  }
}
