/** Utilidades de fecha y hora en la zona horaria local del navegador. */

/**
 * Fecha de hoy en formato yyyy-MM-dd.
 *
 * @returns fecha actual.
 */
export function hoyIso(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/**
 * Recorta una hora a formato HH:mm.
 *
 * @param hora hora en formato HH:mm o HH:mm:ss.
 * @returns hora en formato HH:mm (vacío si no hay hora).
 */
export function horaCorta(hora: string | null | undefined): string {
  return hora ? hora.substring(0, 5) : '';
}

/**
 * Toma solo la parte de fecha de un valor yyyy-MM-ddTHH:mm:ss.
 *
 * @param fechaHora fecha y hora en formato ISO.
 * @returns fecha en formato yyyy-MM-dd (vacío si no hay valor).
 */
export function soloFecha(fechaHora: string | null | undefined): string {
  return fechaHora ? fechaHora.substring(0, 10) : '';
}
