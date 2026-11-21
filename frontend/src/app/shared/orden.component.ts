import { Component, HostBinding, HostListener, Input } from '@angular/core';
import { Tabla } from '../core/tabla';

/**
 * Encabezado ordenable: <th appOrden="nombre" [tabla]="tabla">Nombre</th>
 * Clic o Enter alternan ascendente, descendente y sin orden.
 */
@Component({
  selector: 'th[appOrden]',
  standalone: true,
  template: `<span class="d-inline-flex align-items-center gap-1"><ng-content></ng-content><i [class]="tabla.icono(appOrden)"></i></span>`,
  host: { class: 'ordenable', tabindex: '0', role: 'columnheader' }
})
export class OrdenComponent {
  @Input({ required: true }) appOrden!: string;
  @Input({ required: true }) tabla!: Tabla<any>;

  @HostBinding('attr.aria-sort') get ariaSort(): string {
    return this.tabla.aria(this.appOrden);
  }

  @HostListener('click')
  @HostListener('keydown.enter')
  alternar(): void {
    this.tabla.ordenar(this.appOrden);
  }
}
