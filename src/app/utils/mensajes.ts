import { HttpErrorResponse } from '@angular/common/http';
import Swal, { SweetAlertIcon } from 'sweetalert2';

/**
 * Avisos al usuario compartidos por todas las pantallas, para que los
 * mensajes de éxito, error y confirmación se vean y se redacten igual.
 */

/**
 * Convierte un error HTTP en un texto comprensible, sin exponer detalles
 * técnicos: usa el mensaje del backend cuando existe y un texto genérico si
 * no hubo comunicación con el servidor.
 *
 * @param error error HTTP recibido.
 * @returns mensaje para el usuario.
 */
export function mensajeDeError(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No se pudo comunicar con el servidor. Verifique su conexión e intente de nuevo.';
  }
  if (typeof error.error?.message === 'string' && error.error.message.trim()) {
    return error.error.message;
  }
  if (error.status === 404) {
    return 'El registro solicitado no existe.';
  }
  return 'Ocurrió un error inesperado. Intente nuevamente.';
}

/**
 * Muestra un aviso de error.
 *
 * @param error error HTTP recibido.
 * @param titulo título del aviso.
 */
export function mostrarError(error: HttpErrorResponse, titulo: string): void {
  Swal.fire({
    icon: 'error',
    title: titulo,
    text: mensajeDeError(error),
    confirmButtonText: 'Entendido'
  });
}

/**
 * Muestra un aviso breve de éxito que se cierra solo.
 *
 * @param mensaje texto devuelto por el backend.
 */
export function notificarExito(mensaje: string): void {
  Swal.fire({
    icon: 'success',
    title: mensaje || 'Operación realizada',
    timer: 1800,
    showConfirmButton: false
  });
}

/**
 * Muestra un aviso informativo con un solo botón.
 *
 * @param titulo título del aviso.
 * @param texto explicación para el usuario.
 * @param icono icono del aviso (por defecto "info").
 */
export function avisar(titulo: string, texto: string, icono: SweetAlertIcon = 'info'): void {
  Swal.fire({ icon: icono, title: titulo, text: texto, confirmButtonText: 'Entendido' });
}

/**
 * Pide confirmación antes de una acción que no se puede deshacer fácilmente.
 *
 * @param titulo pregunta para el usuario.
 * @param texto consecuencia de la acción.
 * @param botonConfirmar texto del botón que confirma.
 * @returns true si el usuario confirmó.
 */
export async function confirmar(titulo: string, texto: string, botonConfirmar = 'Sí, continuar'): Promise<boolean> {
  const resultado = await Swal.fire({
    icon: 'question',
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: botonConfirmar,
    cancelButtonText: 'Volver'
  });
  return resultado.isConfirmed;
}
