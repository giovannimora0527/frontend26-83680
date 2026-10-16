import { HttpErrorResponse } from '@angular/common/http';

/**
 * Funciones de ayuda que se reutilizan en varias pantallas.
 */

/**
 * Saca un mensaje entendible para el usuario a partir del error del backend.
 * @param error error que devuelve HttpClient.
 * @returns mensaje para mostrar.
 */
export function obtenerMensajeError(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No hay comunicación con el servidor. Verifique que el backend esté encendido.';
  }
  if (error.error && typeof error.error.message === 'string') {
    return error.error.message;
  }
  if (error.status === 404) {
    return 'El registro o servicio solicitado no fue encontrado.';
  }
  return 'Ocurrió un error inesperado, intente de nuevo.';
}

/**
 * Quita tildes y pasa a minúsculas, sirve para los filtros de búsqueda.
 * @param texto texto original.
 * @returns texto normalizado.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Compara dos valores para ordenar una tabla (números, fechas o textos).
 * @param a primer valor.
 * @param b segundo valor.
 * @param direccion 'asc' o 'desc'.
 * @returns número negativo, cero o positivo.
 */
export function compararValores(a: string | number, b: string | number, direccion: 'asc' | 'desc'): number {
  const comparacion = typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a ?? '').localeCompare(String(b ?? ''), 'es', { numeric: true, sensitivity: 'base' });
  return direccion === 'asc' ? comparacion : -comparacion;
}

/**
 * Devuelve la fecha de hoy en formato yyyy-MM-dd (para los input type="date").
 * @returns fecha de hoy.
 */
export function fechaHoy(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/**
 * Devuelve la hora actual en formato HH:mm (para los input type="time").
 * @returns la hora actual.
 */
export function horaActual(): string {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
}

/**
 * Pasa a milisegundos una fecha que viene como texto, para poder ordenar.
 * @param fecha fecha en texto.
 * @returns milisegundos o 0 si no hay fecha.
 */
export function fechaANumero(fecha?: string): number {
  return fecha ? new Date(fecha).getTime() : 0;
}

/**
 * Clase css de la pildora segun el estado de una cita (ver styles.scss).
 * @param estado estado de la cita.
 * @returns clase css.
 */
export function claseEstado(estado?: string): string {
  return estado ? `estado-${estado}` : 'estado-sin-cita';
}
