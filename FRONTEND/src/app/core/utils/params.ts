import { HttpParams } from '@angular/common/http';

/**
 * Convierte un objeto en parámetros HTTP omitiendo los valores vacíos
 * (null, undefined o cadenas en blanco) para no enviar filtros inexistentes.
 *
 * @param valores Objeto con los parámetros.
 * @returns Parámetros listos para HttpClient.
 */
export function construirParams(valores: object): HttpParams {
  let params = new HttpParams();
  for (const [clave, valor] of Object.entries(valores)) {
    if (valor === null || valor === undefined) continue;
    const texto = String(valor).trim();
    if (texto !== '') params = params.set(clave, texto);
  }
  return params;
}
