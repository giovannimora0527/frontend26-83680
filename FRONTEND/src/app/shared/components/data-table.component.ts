import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, computed, contentChild, input, output } from '@angular/core';

/** Definición de una columna del DataTable. */
export interface Columna {
  /** Nombre del campo que el backend acepta en sortBy (solo si es ordenable). */
  clave: string;
  /** Encabezado visible. */
  titulo: string;
  /** Si la columna permite ordenar al hacer clic en el encabezado. */
  ordenable?: boolean;
  /** Función que obtiene el texto a mostrar de cada fila. */
  valor: (fila: any) => string;
  /** Si es true, el valor se muestra como etiqueta de color (estados). */
  etiqueta?: boolean;
}

/** Evento de cambio de orden. */
export interface CambioOrden {
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

/**
 * Tabla de datos reutilizable con paginación y ordenamiento del lado del servidor.
 * La plantilla de acciones por fila se proyecta con <ng-template #acciones let-fila>.
 */
@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet],
  template: `
    <div class="contenedor" [class.cargando]="cargando()">
      <table>
        <thead>
          <tr>
            @for (c of columnas(); track $index) {
              <th [class.ordenable]="c.ordenable" (click)="c.ordenable && clicEncabezado(c.clave)">
                {{ c.titulo }}
                @if (c.ordenable && sortBy() === c.clave) { <span>{{ sortDir() === 'asc' ? '▲' : '▼' }}</span> }
              </th>
            }
            @if (acciones()) { <th>Acciones</th> }
          </tr>
        </thead>
        <tbody>
          @for (fila of filas(); track $index) {
            <tr>
              @for (c of columnas(); track $index) {
                <td>
                  @if (c.etiqueta) {
                    <span class="badge badge-{{ c.valor(fila).toLowerCase() }}">{{ c.valor(fila) }}</span>
                  } @else { {{ c.valor(fila) }} }
                </td>
              }
              @if (acciones(); as tpl) {
                <td><ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: fila }" /></td>
              }
            </tr>
          } @empty {
            <tr><td class="vacio" [attr.colspan]="columnas().length + 1">{{ cargando() ? 'Cargando…' : 'No hay registros para mostrar.' }}</td></tr>
          }
        </tbody>
      </table>
    </div>
    <div class="pie">
      <span>{{ rango() }}</span>
      <div class="controles">
        <label class="inline">Filas
          <select [value]="tamano()" (change)="cambiarTamano.emit(+$any($event.target).value)">
            @for (t of opcionesTamano; track t) { <option [value]="t" [selected]="t === tamano()">{{ t }}</option> }
          </select>
        </label>
        <button type="button" class="btn chico" [disabled]="pagina() === 0 || cargando()" (click)="cambiarPagina.emit(pagina() - 1)">‹ Anterior</button>
        <span>Página {{ pagina() + 1 }} de {{ totalPaginas() || 1 }}</span>
        <button type="button" class="btn chico" [disabled]="pagina() + 1 >= totalPaginas() || cargando()" (click)="cambiarPagina.emit(pagina() + 1)">Siguiente ›</button>
      </div>
    </div>
  `,
  styles: `
    .contenedor { overflow-x: auto; border: 1px solid var(--c-borde); border-radius: 8px; background: #fff; transition: opacity .15s; }
    .cargando { opacity: .55; }
    table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid #edf0f3; }
    th { background: #f0f4f7; font-weight: 600; white-space: nowrap; user-select: none; }
    th.ordenable { cursor: pointer; } th.ordenable:hover { background: #e4eaef; }
    tr:last-child td { border-bottom: 0; }
    .vacio { text-align: center; color: var(--c-suave); padding: 24px; }
    .pie { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: .85rem; color: var(--c-suave); flex-wrap: wrap; gap: 8px; }
    .controles { display: flex; align-items: center; gap: 10px; }
    .inline { flex-direction: row; align-items: center; gap: 6px; }
  `,
})
export class DataTableComponent {
  /** Columnas a mostrar. */
  readonly columnas = input.required<Columna[]>();
  /** Filas de la página actual. */
  readonly filas = input<any[]>([]);
  /** Total de registros que cumplen los filtros (todas las páginas). */
  readonly totalElementos = input(0);
  /** Página actual (desde 0). */
  readonly pagina = input(0);
  /** Cantidad de filas por página. */
  readonly tamano = input(10);
  /** Campo por el que está ordenada la tabla. */
  readonly sortBy = input('');
  /** Dirección del orden actual. */
  readonly sortDir = input<'asc' | 'desc'>('desc');
  /** Indica que se está consultando el backend. */
  readonly cargando = input(false);

  /** Se emite con la nueva página (desde 0). */
  readonly cambiarPagina = output<number>();
  /** Se emite con el nuevo tamaño de página. */
  readonly cambiarTamano = output<number>();
  /** Se emite con el nuevo campo y dirección de orden. */
  readonly ordenar = output<CambioOrden>();

  /** Plantilla opcional de acciones por fila. */
  protected readonly acciones = contentChild<TemplateRef<unknown>>('acciones');
  /** Tamaños de página disponibles. */
  protected readonly opcionesTamano = [5, 10, 20, 50];

  /** Total de páginas calculado con el total y el tamaño. */
  protected readonly totalPaginas = computed(() => Math.ceil(this.totalElementos() / this.tamano()));
  /** Texto "Mostrando X–Y de N". */
  protected readonly rango = computed(() => {
    const total = this.totalElementos();
    if (total === 0) return 'Sin resultados';
    const desde = this.pagina() * this.tamano() + 1;
    const hasta = Math.min(total, desde + this.tamano() - 1);
    return `Mostrando ${desde}–${hasta} de ${total}`;
  });

  /**
   * Alterna el orden de una columna: si ya estaba ordenada invierte la dirección.
   * @param clave Campo de la columna pulsada.
   */
  protected clicEncabezado(clave: string): void {
    const dir = this.sortBy() === clave && this.sortDir() === 'asc' ? 'desc' : 'asc';
    this.ordenar.emit({ sortBy: clave, sortDir: dir });
  }
}
