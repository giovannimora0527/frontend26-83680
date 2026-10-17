import { Modal } from 'bootstrap';

/**
 * Envoltura de un modal de Bootstrap identificado por su id en la plantilla.
 * Crea la instancia la primera vez que se abre, para que el elemento ya
 * exista en el DOM.
 */
export class ModalBootstrap {
  /** Instancia de Bootstrap (se crea al abrir por primera vez). */
  private instancia: Modal | null = null;

  /**
   * @param id atributo id del elemento .modal en la plantilla.
   */
  constructor(private readonly id: string) { }

  /** Muestra el modal. */
  abrir(): void {
    const elemento = document.getElementById(this.id);
    if (elemento) {
      this.instancia ??= new Modal(elemento);
      this.instancia.show();
    }
  }

  /** Oculta el modal. */
  cerrar(): void {
    this.instancia?.hide();
  }

  /** Libera la instancia (llamar en ngOnDestroy). */
  destruir(): void {
    this.instancia?.dispose();
    this.instancia = null;
  }
}
