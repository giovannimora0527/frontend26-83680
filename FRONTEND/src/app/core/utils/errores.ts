import { HttpErrorResponse } from '@angular/common/http';

/**
 * Traduce cualquier error HTTP a un mensaje comprensible para el usuario,
 * sin exponer detalles técnicos (trazas, URLs, nombres de clases).
 *
 * @param error Error recibido en el subscribe.
 * @returns Mensaje en español.
 */
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado. Intente nuevamente.';
  }
  if (error.status === 0) {
    return 'No fue posible comunicarse con el servidor. Verifique su conexión o que el servicio esté en ejecución.';
  }
  const mensajeServidor = typeof error.error === 'object' && error.error ? (error.error as { message?: string }).message : undefined;
  if (mensajeServidor) return mensajeServidor;
  switch (error.status) {
    case 400: return 'Los datos enviados no son válidos.';
    case 404: return 'El registro solicitado no fue encontrado.';
    case 409: return 'La operación entra en conflicto con información ya registrada.';
    case 422: return 'La operación no cumple las reglas del negocio.';
    default: return 'El servidor no pudo procesar la solicitud. Intente más tarde.';
  }
}
