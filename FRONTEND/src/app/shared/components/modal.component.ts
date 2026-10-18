import { Component, input, output } from '@angular/core';

/** Ventana modal reutilizable. El contenido se proyecta con ng-content. */
@Component({
  selector: 'app-modal',
  template: `
    <div class="fondo" (click)="cerrar.emit()">
      <div class="ventana" [style.max-width.px]="ancho()" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <div class="cabecera-modal">
          <h2>{{ titulo() }}</h2>
          <button type="button" class="btn chico" (click)="cerrar.emit()" aria-label="Cerrar">✕</button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .fondo { position: fixed; inset: 0; background: rgba(20, 30, 40, .45); display: flex; align-items: flex-start; justify-content: center; padding: 40px 12px; overflow-y: auto; z-index: 1000; }
    .ventana { background: #fff; border-radius: 12px; padding: 18px 20px 20px; width: 100%; box-shadow: 0 12px 40px rgba(0,0,0,.25); }
    .cabecera-modal { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .cabecera-modal h2 { margin: 0; }
  `,
})
export class ModalComponent {
  /** Título de la ventana. */
  readonly titulo = input.required<string>();
  /** Ancho máximo en píxeles. */
  readonly ancho = input(640);
  /** Se emite cuando el usuario pide cerrar la ventana. */
  readonly cerrar = output<void>();
}
