/**
 * Normaliza un texto para comparar búsquedas: minúsculas y sin tildes,
 * así "Andrés" coincide con "andres".
 *
 * @param texto texto original (null o undefined se tratan como vacío).
 * @returns texto normalizado.
 */
export function normalizarTexto(texto: string | number | null | undefined): string {
  return String(texto ?? '')
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}
