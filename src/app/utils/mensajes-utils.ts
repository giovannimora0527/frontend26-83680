import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

/**
 * Mensajes reutilizados por los módulos para informar éxito o error al usuario.
 */

/**
 * Obtiene un mensaje claro a partir del error devuelto por el backend,
 * sin mostrar información técnica.
 * @param error Error de la petición HTTP.
 * @returns Mensaje para el usuario.
 */
export function obtenerMensajeError(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No fue posible comunicarse con el servidor. Verifique que el backend esté en funcionamiento.';
  }
  if (error.error?.message) {
    return error.error.message;
  }
  return 'Ocurrió un error inesperado, intente nuevamente.';
}

/**
 * Muestra una alerta de error con el mensaje devuelto por el backend.
 * @param error Error de la petición HTTP.
 */
export function mostrarError(error: HttpErrorResponse) {
  Swal.fire({
    icon: 'error',
    title: 'No se pudo completar la operación',
    text: obtenerMensajeError(error)
  });
}

/**
 * Muestra una alerta de éxito.
 * @param mensaje Mensaje a mostrar.
 */
export function mostrarExito(mensaje: string) {
  Swal.fire({
    icon: 'success',
    title: 'Proceso exitoso',
    text: mensaje,
    timer: 2500
  });
}

/**
 * Muestra una advertencia, se usa en las validaciones del formulario.
 * @param titulo Título de la alerta.
 * @param mensaje Mensaje a mostrar.
 */
export function mostrarAdvertencia(titulo: string, mensaje: string) {
  Swal.fire({
    icon: 'warning',
    title: titulo,
    text: mensaje
  });
}

/**
 * Pide confirmación al usuario antes de una acción importante.
 * @param titulo Título de la ventana.
 * @param mensaje Pregunta que se le hace al usuario.
 * @returns Promesa con true si el usuario confirma.
 */
export function confirmarAccion(titulo: string, mensaje: string): Promise<boolean> {
  return Swal.fire({
    icon: 'question',
    title: titulo,
    text: mensaje,
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar'
  }).then((resultado) => resultado.isConfirmed);
}
