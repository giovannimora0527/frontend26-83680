import { Injectable, signal } from '@angular/core';

/** Mensaje temporal mostrado al usuario. */
export interface Notificacion {
  id: number;
  tipo: 'exito' | 'error';
  texto: string;
}

/** Servicio de mensajes de éxito y error que se muestran en pantalla. */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  /** Lista reactiva de notificaciones visibles. */
  readonly notificaciones = signal<Notificacion[]>([]);
  private contador = 0;

  /**
   * Muestra un mensaje de éxito.
   * @param texto Mensaje para el usuario.
   */
  exito(texto: string): void {
    this.agregar('exito', texto);
  }

  /**
   * Muestra un mensaje de error.
   * @param texto Mensaje para el usuario.
   */
  error(texto: string): void {
    this.agregar('error', texto);
  }

  /**
   * Quita una notificación de la pantalla.
   * @param id Identificador de la notificación.
   */
  cerrar(id: number): void {
    this.notificaciones.update((lista) => lista.filter((n) => n.id !== id));
  }

  private agregar(tipo: Notificacion['tipo'], texto: string): void {
    const id = ++this.contador;
    this.notificaciones.update((lista) => [...lista, { id, tipo, texto }]);
    setTimeout(() => this.cerrar(id), 6000);
  }
}
