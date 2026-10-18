/**
 * Devuelve la fecha de hoy en formato yyyy-MM-dd usando la hora local del navegador.
 *
 * @returns Fecha local en formato ISO (solo día).
 */
export function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Une una fecha (yyyy-MM-dd) y una hora (HH:mm) en un LocalDateTime ISO que entiende el backend.
 *
 * @param fecha Fecha en formato yyyy-MM-dd.
 * @param hora Hora en formato HH:mm.
 * @returns Texto yyyy-MM-ddTHH:mm:00.
 */
export function unirFechaHora(fecha: string, hora: string): string {
  return `${fecha}T${hora.length === 5 ? hora + ':00' : hora}`;
}

/**
 * Separa un LocalDateTime del backend en fecha y hora para los inputs del formulario.
 *
 * @param fechaHora Texto yyyy-MM-ddTHH:mm[:ss].
 * @returns Objeto con la fecha y la hora (HH:mm).
 */
export function separarFechaHora(fechaHora: string): { fecha: string; hora: string } {
  const [fecha, resto = ''] = fechaHora.split('T');
  return { fecha, hora: resto.substring(0, 5) };
}

/**
 * Indica si una fecha y hora ya pasaron respecto al momento actual.
 *
 * @param fecha Fecha yyyy-MM-dd.
 * @param hora Hora HH:mm.
 * @returns true si la fecha-hora es anterior a ahora.
 */
export function esPasada(fecha: string, hora: string): boolean {
  return new Date(unirFechaHora(fecha, hora)).getTime() < Date.now();
}
