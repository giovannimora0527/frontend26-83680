/**
 * Funciones de apoyo reutilizadas por las tablas (datatables) de los módulos:
 * búsqueda, filtros por fecha, ordenamiento y textos que se muestran al usuario.
 */

/**
 * Normaliza un texto eliminando acentos y convirtiendo a minúsculas para comparar búsquedas.
 * @param texto Texto a normalizar.
 * @returns Texto normalizado.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Compara dos valores para ordenar las filas de una tabla.
 * Las fechas llegan en formato ISO (yyyy-MM-ddTHH:mm:ss), por eso se pueden comparar como texto.
 * @param valorA Primer valor.
 * @param valorB Segundo valor.
 * @param ascendente true para ordenar de menor a mayor.
 * @returns Número negativo, cero o positivo según el orden.
 */
export function compararValores(
  valorA: string | number | null | undefined,
  valorB: string | number | null | undefined,
  ascendente: boolean
): number {
  let resultado: number;
  if (typeof valorA === 'number' && typeof valorB === 'number') {
    resultado = valorA - valorB;
  } else {
    resultado = normalizarTexto(String(valorA ?? '')).localeCompare(normalizarTexto(String(valorB ?? '')));
  }
  return ascendente ? resultado : -resultado;
}

/**
 * Indica si una fecha está dentro del rango seleccionado en los filtros.
 * @param fecha Fecha del registro.
 * @param desde Fecha inicial del filtro (yyyy-MM-dd), puede estar vacía.
 * @param hasta Fecha final del filtro (yyyy-MM-dd), puede estar vacía.
 * @returns true si la fecha cumple el filtro.
 */
export function estaEnRangoFechas(fecha: Date | string | undefined, desde: string, hasta: string): boolean {
  const valor = String(fecha ?? '').substring(0, 10);
  if (desde && valor < desde) {
    return false;
  }
  if (hasta && valor > hasta) {
    return false;
  }
  return true;
}

/**
 * Une nombres y apellidos de un cliente o veterinario.
 * @param persona Objeto con nombres y apellidos.
 * @returns Nombre completo o un guion si no hay datos.
 */
export function nombreCompleto(persona?: { nombres?: string; apellidos?: string } | null): string {
  if (!persona) {
    return '-';
  }
  return `${persona.nombres ?? ''} ${persona.apellidos ?? ''}`.trim();
}

/**
 * Convierte un estado en mayúscula a un texto legible. Ej: PENDIENTE -> Pendiente.
 * @param estado Estado guardado en la base de datos.
 * @returns Estado con la primera letra en mayúscula.
 */
export function textoEstado(estado?: string): string {
  if (!estado) {
    return '-';
  }
  const texto = estado.toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.substring(1);
}

/**
 * Devuelve la fecha actual en formato yyyy-MM-dd para los campos tipo date.
 * @returns Fecha de hoy.
 */
export function fechaHoy(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}
