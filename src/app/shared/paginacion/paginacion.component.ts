import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente reutilizable para la paginación de las tablas.
 * Uso: <app-paginacion [paginaActual]="pagina" [totalPaginas]="total" (cambiarPagina)="irA($event)">
 */
@Component({
  selector: 'app-paginacion',
  imports: [CommonModule],
  template: `
    <nav *ngIf="totalPaginas > 1" aria-label="Paginación">
      <ul class="pagination justify-content-end mb-0">
        <li class="page-item" [class.disabled]="paginaActual === 1">
          <button class="page-link" type="button" (click)="ir(paginaActual - 1)">Anterior</button>
        </li>
        <li class="page-item" *ngFor="let pagina of paginas" [class.active]="pagina === paginaActual">
          <button class="page-link" type="button" (click)="ir(pagina)">{{ pagina }}</button>
        </li>
        <li class="page-item" [class.disabled]="paginaActual === totalPaginas">
          <button class="page-link" type="button" (click)="ir(paginaActual + 1)">Siguiente</button>
        </li>
      </ul>
    </nav>
  `
})
export class PaginacionComponent {
  /** Página que se está mostrando. */
  @Input() paginaActual = 1;
  /** Total de páginas. */
  @Input() totalPaginas = 0;
  /** Avisa al padre la nueva página. */
  @Output() cambiarPagina = new EventEmitter<number>();

  /** Lista de números de página para pintar los botones. */
  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  /**
   * Cambia de página si está dentro del rango.
   * @param pagina página a la que se quiere ir.
   */
  ir(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.cambiarPagina.emit(pagina);
    }
  }
}
