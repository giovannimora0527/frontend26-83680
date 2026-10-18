import { Component, inject } from '@angular/core';
import { NotificacionService } from '../../core/services/notificacion.service';

/** Contenedor de mensajes de éxito y error (esquina superior derecha). */
@Component({
  selector: 'app-toast',
  template: `
    <div class="toasts" aria-live="polite">
      @for (n of servicio.notificaciones(); track n.id) {
        <div class="toast" [class.toast-error]="n.tipo === 'error'" [class.toast-exito]="n.tipo === 'exito'" role="status">
          <span>{{ n.texto }}</span>
          <button type="button" class="toast-x" (click)="servicio.cerrar(n.id)" aria-label="Cerrar">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts { position: fixed; top: 68px; right: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 2000; max-width: 380px; }
    .toast { display: flex; justify-content: space-between; gap: 12px; padding: 10px 14px; border-radius: 8px; background: #fff; border-left: 5px solid; box-shadow: 0 4px 14px rgba(0,0,0,.15); font-size: .9rem; }
    .toast-exito { border-color: var(--c-ok); } .toast-error { border-color: var(--c-error); }
    .toast-x { background: none; border: 0; font-size: 1.2rem; cursor: pointer; line-height: 1; }
  `,
})
export class ToastComponent {
  /** Servicio que mantiene la lista de notificaciones. */
  protected readonly servicio = inject(NotificacionService);
}
