import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Modal liviano (sin JS de Bootstrap). */
@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (abierto) {
      <div class="modal d-block" tabindex="-1" role="dialog" (click)="fondo($event)">
        <div class="modal-dialog modal-dialog-scrollable" [class]="'modal-' + tamano">
          <div class="modal-content shadow">
            <div class="modal-header bg-light">
              <h5 class="modal-title">{{ titulo }}</h5>
              <button type="button" class="btn-close" aria-label="Cerrar" (click)="cerrar.emit()"></button>
            </div>
            <div class="modal-body"><ng-content></ng-content></div>
            <div class="modal-footer"><ng-content select="[pie]"></ng-content></div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    }
  `
})
export class ModalComponent {
  @Input() abierto = false;
  @Input() titulo = '';
  @Input() tamano: 'sm' | 'lg' | 'xl' | 'md' = 'lg';
  @Output() cerrar = new EventEmitter<void>();

  fondo(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal')) { this.cerrar.emit(); }
  }
}
