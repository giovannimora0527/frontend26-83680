import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Barra de paginación reutilizable para los DataTables paginados en el
 * backend: muestra "Mostrando X–Y de Z", el selector de registros por página
 * y los botones de página (máximo cinco, centrados en la actual).
 */
@Component({
  selector: 'app-paginador',
  imports: [CommonModule, FormsModule],
  templateUrl: './paginador.component.html'
})
export class PaginadorComponent {
  /** Página actual (empieza en 0). */
  @Input() pagina = 0;
  /** Total de páginas. */
  @Input() totalPaginas = 0;
  /** Total de registros que cumplen los filtros. */
  @Input() totalRegistros = 0;
  /** Registros por página. */
  @Input() tamano = 10;
  /** Opciones del selector de registros por página. */
  @Input() opciones: number[] = [5, 10, 20, 50];
  /** Texto de accesibilidad de la barra (por ejemplo "Paginación de citas"). */
  @Input() etiqueta = 'Paginación';

  /** Emite la página elegida por el usuario. */
  @Output() cambioPagina = new EventEmitter<number>();
  /** Emite la nueva cantidad de registros por página. */
  @Output() cambioTamano = new EventEmitter<number>();

  /** Primer registro mostrado en la página actual. */
  get registroInicial(): number {
    return this.totalRegistros === 0 ? 0 : this.pagina * this.tamano + 1;
  }

  /** Último registro mostrado en la página actual. */
  get registroFinal(): number {
    return Math.min((this.pagina + 1) * this.tamano, this.totalRegistros);
  }

  /** Números de página visibles en la barra. */
  get paginasVisibles(): number[] {
    const inicio = Math.max(0, Math.min(this.pagina - 2, this.totalPaginas - 5));
    const fin = Math.min(this.totalPaginas, inicio + 5);
    return Array.from({ length: fin - inicio }, (_, i) => inicio + i);
  }

  /**
   * Solicita un cambio de página si el número es válido.
   *
   * @param pagina número de página (empieza en 0).
   */
  irA(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas || pagina === this.pagina) {
      return;
    }
    this.cambioPagina.emit(pagina);
  }

  /**
   * Solicita un cambio en la cantidad de registros por página.
   *
   * @param tamano nueva cantidad elegida.
   */
  cambiarTamano(tamano: number): void {
    this.cambioTamano.emit(Number(tamano));
  }
}
