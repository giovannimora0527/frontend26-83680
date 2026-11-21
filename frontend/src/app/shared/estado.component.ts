import { Component, Input } from '@angular/core';
import { claseEstado, etiqueta } from '../core/util';

/** Etiqueta de color para estados (citas, facturas, despachos, inventario). */
@Component({
  selector: 'app-estado',
  standalone: true,
  template: `<span class="badge" [class]="clase">{{ texto }}</span>`
})
export class EstadoComponent {
  @Input() valor: string | null | undefined = '';
  @Input() textoPersonalizado?: string;
  get clase(): string { return 'badge ' + claseEstado(this.valor); }
  get texto(): string { return this.textoPersonalizado ?? etiqueta(this.valor); }
}
