import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Cita, EstadoCita, FiltroCita } from '../../core/models/cita';
import { Cliente, Mascota, Medico } from '../../core/models/catalogos';
import { CatalogoService } from '../../core/services/catalogo.service';
import { CitaService } from '../../core/services/cita.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { mensajeDeError } from '../../core/utils/errores';
import { CambioOrden, Columna, DataTableComponent } from '../../shared/components/data-table.component';
import { CitaFormComponent } from './cita-form.component';

/** Listado de citas con filtros, orden, paginación y acciones por estado. */
@Component({
  selector: 'app-cita-list',
  imports: [ReactiveFormsModule, DataTableComponent, CitaFormComponent],
  template: `
    <div class="cabecera">
      <h1>Citas médicas</h1>
      <button class="btn primario" (click)="abrirForm(null)">+ Nueva cita</button>
    </div>
    <form class="tarjeta filtros" [formGroup]="filtros">
      <label>Buscar <input formControlName="texto" placeholder="Cliente, mascota, veterinario…" /></label>
      <label>Estado
        <select formControlName="estado">
          <option value="">Todos</option>
          @for (e of estados; track e) { <option [value]="e">{{ e }}</option> }
        </select>
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
      <ng-template #acciones let-cita>
        <div class="acciones">
          @if (cita.estado === 'PENDIENTE' || cita.estado === 'PROGRAMADA' || cita.estado === 'CONFIRMADA') {
            <button class="btn chico" (click)="abrirForm(cita)">Editar</button>
          }
          @if (cita.estado === 'CONFIRMADA') {
            <button class="btn chico" (click)="cambiarEstado(cita, 'ATENDIDA')">Marcar atendida</button>
          }
          @if (cita.estado === 'PENDIENTE' || cita.estado === 'PROGRAMADA') {
            <button class="btn chico" (click)="cambiarEstado(cita, 'CONFIRMADA')">Confirmar</button>
          }
          @if (cita.estado !== 'CANCELADA' && cita.estado !== 'ATENDIDA') {
            <button class="btn chico peligro" (click)="cancelar(cita)">Cancelar</button>
          }
          @if (cita.estado === 'CANCELADA') {
            <button class="btn chico" (click)="reactivar(cita)">Reactivar</button>
          }
        </div>
      </ng-template>
    </app-data-table>

    @if (formAbierto()) {
      <app-cita-form [cita]="citaEditando()" (guardada)="alGuardar()" (cancelar)="formAbierto.set(false)" />
    }
  `,
})
export class CitaListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly citaService = inject(CitaService);
  private readonly catalogo = inject(CatalogoService);
  private readonly avisos = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  /** Estados disponibles en el filtro. */
  protected readonly estados: EstadoCita[] = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA'];

  /** Columnas del DataTable; `clave` es el nombre de orden que acepta el backend. */
  protected readonly columnas: Columna[] = [
    { clave: 'fechaHora', titulo: 'Fecha', ordenable: true, valor: (c: Cita) => c.fechaHora.substring(0, 10) },
    { clave: 'fechaHora', titulo: 'Hora', valor: (c: Cita) => c.fechaHora.substring(11, 16) },
    { clave: 'cliente', titulo: 'Cliente', ordenable: true, valor: (c: Cita) => c.clienteNombre },
    { clave: 'mascota', titulo: 'Mascota', ordenable: true, valor: (c: Cita) => c.mascotaNombre },
    { clave: 'medico', titulo: 'Veterinario', ordenable: true, valor: (c: Cita) => c.medicoNombre },
    { clave: 'estado', titulo: 'Estado', ordenable: true, etiqueta: true, valor: (c: Cita) => c.estado },
  ];

  protected readonly filas = signal<Cita[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);
  protected readonly tamano = signal(10);
  /** Orden inicial exigido: fecha y hora descendente. */
  protected readonly sortBy = signal('fechaHora');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly cargando = signal(false);
  protected readonly formAbierto = signal(false);
  protected readonly citaEditando = signal<Cita | null>(null);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly mascotas = signal<Mascota[]>([]);
  protected readonly medicos = signal<Medico[]>([]);

  /** Formulario de filtros. */
  protected readonly filtros = this.fb.group({
    texto: [''], estado: [''],
    clienteId: this.fb.control<number | null>(null),
    mascotaId: this.fb.control<number | null>(null),
    medicoId: this.fb.control<number | null>(null),
    fechaDesde: [''], fechaHasta: [''],
  });

  /** Carga catálogos de los filtros y la primera página; recarga al cambiar cualquier filtro. */
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

  /** Las mascotas del filtro dependen del cliente elegido (o son todas si no hay cliente). */
  private cargarMascotasFiltro(clienteId: number | null): void {
    const origen = clienteId ? this.catalogo.listarMascotasDeCliente(clienteId) : this.catalogo.listarMascotas();
    origen.subscribe((d) => this.mascotas.set(d));
  }

  /** Consulta la página actual al backend con los filtros y el orden vigentes. */
  protected cargar(): void {
    const f = this.filtros.getRawValue() as unknown as FiltroCita;
    if (f.fechaDesde && f.fechaHasta && f.fechaHasta < f.fechaDesde) {
      this.avisos.error('La fecha final no puede ser anterior a la fecha inicial.');
      return;
    }
    this.cargando.set(true);
    this.citaService.listar({ page: this.pagina(), size: this.tamano(), sortBy: this.sortBy(), sortDir: this.sortDir() }, f).subscribe({
      next: (r) => { this.filas.set(r.content); this.total.set(r.totalElements); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.avisos.error(mensajeDeError(e)); },
    });
  }

  /** @param p Nueva página (desde 0). */
  protected irAPagina(p: number): void { this.pagina.set(p); this.cargar(); }

  /** @param t Nuevo tamaño de página. */
  protected cambiarTamano(t: number): void { this.tamano.set(t); this.pagina.set(0); this.cargar(); }

  /** @param o Nuevo orden elegido en el encabezado. */
  protected ordenar(o: CambioOrden): void { this.sortBy.set(o.sortBy); this.sortDir.set(o.sortDir); this.pagina.set(0); this.cargar(); }

  /** Restablece todos los filtros. */
  protected limpiar(): void {
    this.filtros.reset({ texto: '', estado: '', clienteId: null, mascotaId: null, medicoId: null, fechaDesde: '', fechaHasta: '' });
  }

  /** @param cita Cita a editar, o null para crear una nueva. */
  protected abrirForm(cita: Cita | null): void { this.citaEditando.set(cita); this.formAbierto.set(true); }

  /** Cierra el formulario y refresca el listado. */
  protected alGuardar(): void { this.formAbierto.set(false); this.cargar(); }

  /**
   * Cambia el estado de una cita; el backend valida que la transición sea permitida.
   * @param cita Cita afectada.
   * @param estado Estado destino.
   */
  protected cambiarEstado(cita: Cita, estado: EstadoCita): void {
    this.citaService.cambiarEstado(cita.id, estado).subscribe({
      next: () => { this.avisos.exito(`La cita quedó ${estado.toLowerCase()}.`); this.cargar(); },
      error: (e) => this.avisos.error(mensajeDeError(e)),
    });
  }

  /** @param cita Cita a cancelar (pide confirmación). */
  protected cancelar(cita: Cita): void {
    if (confirm(`¿Cancelar la cita de ${cita.mascotaNombre}? Para recuperarla deberá reactivarla explícitamente.`)) {
      this.cambiarEstado(cita, 'CANCELADA');
    }
  }

  /** @param cita Cita cancelada a reactivar (operación explícita). */
  protected reactivar(cita: Cita): void {
    this.citaService.reactivar(cita.id).subscribe({
      next: () => { this.avisos.exito('Cita reactivada como pendiente.'); this.cargar(); },
      error: (e) => this.avisos.error(mensajeDeError(e)),
    });
  }
}
