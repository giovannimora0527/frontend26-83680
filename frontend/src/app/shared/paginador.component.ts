import { Component, Input } from '@angular/core';
import { Tabla } from '../core/tabla';

/** Pie de tabla: rango mostrado, tamaño de página y botones de navegación. */
@Component({
  selector: 'app-paginador',
  standalone: true,
  template: `
  @if (tabla.total > 0) {
    <div class="d-flex flex-wrap align-items-center gap-2 px-3 py-2 border-top small">
      <span class="text-muted">Mostrando {{ tabla.desde }}–{{ tabla.hasta }} de {{ tabla.total }}</span>
      <label class="d-flex align-items-center gap-1 ms-2 text-muted">Filas
        <select class="form-select form-select-sm" style="width:auto" [value]="tabla.tamano"
                (change)="tabla.cambiarTamano(+$any($event.target).value)">
          @for (t of tabla.tamanos; track t) { <option [value]="t" [selected]="t === tabla.tamano">{{ t }}</option> }
        </select>
      </label>
      @if (tabla.paginas > 1) {
        <nav class="ms-auto" aria-label="Paginación">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" [class.disabled]="tabla.pagina === 1">
              <button class="page-link" (click)="tabla.irA(1)" aria-label="Primera">&laquo;</button></li>
            <li class="page-item" [class.disabled]="tabla.pagina === 1">
              <button class="page-link" (click)="tabla.irA(tabla.pagina - 1)" aria-label="Anterior">&lsaquo;</button></li>
            @for (p of botones(); track p) {
              <li class="page-item" [class.active]="p === tabla.pagina">
                <button class="page-link" (click)="tabla.irA(p)" [attr.aria-current]="p === tabla.pagina ? 'page' : null">{{ p }}</button></li>
            }
            <li class="page-item" [class.disabled]="tabla.pagina === tabla.paginas">
              <button class="page-link" (click)="tabla.irA(tabla.pagina + 1)" aria-label="Siguiente">&rsaquo;</button></li>
            <li class="page-item" [class.disabled]="tabla.pagina === tabla.paginas">
              <button class="page-link" (click)="tabla.irA(tabla.paginas)" aria-label="Última">&raquo;</button></li>
          </ul>
        </nav>
      }
    </div>
  }
  `
})
export class PaginadorComponent {
  @Input({ required: true }) tabla!: Tabla<any>;

  /** Hasta cinco números alrededor de la página actual. */
  botones(): number[] {
    const total = this.tabla.paginas;
    let inicio = Math.max(1, this.tabla.pagina - 2);
    const fin = Math.min(total, inicio + 4);
    inicio = Math.max(1, fin - 4);
    const r: number[] = [];
    for (let p = inicio; p <= fin; p++) { r.push(p); }
    return r;
  }
}
