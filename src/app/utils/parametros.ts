import { HttpParams } from '@angular/common/http';

/**
 * Convierte un objeto de filtros en parámetros de consulta, omitiendo los
 * valores vacíos (null, undefined o texto en blanco) para no enviar filtros
 * que el usuario no eligió.
 *
 * @param filtro objeto con los parámetros del listado.
 * @returns parámetros listos para la petición GET.
 */
export function aParametros(filtro: object): HttpParams {
  let params = new HttpParams();
  Object.entries(filtro).forEach(([clave, valor]) => {
    if (valor === null || valor === undefined) {
      return;
    }
    const texto = String(valor).trim();
    if (texto) {
      params = params.set(clave, texto);
    }
  });
  return params;
}
