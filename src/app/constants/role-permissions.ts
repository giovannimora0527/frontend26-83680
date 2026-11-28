/** Rutas por grupo lógico de rol.
 *  La comparación se hace quitando tildes y en minúsculas para evitar
 *  desincronización con los nombres exactos en BD.
 */
const RUTAS_RECEPCION: string[] = [
  'citas', 'clientes', 'especializaciones', 'formulas',
  'historias', 'mascotas', 'medicos', 'razas', 'tarifas', 'facturas',
];
const RUTAS_MEDICO: string[] = ['citas', 'formulas', 'historias'];
const RUTAS_DESPACHO: string[] = ['medicamentos', 'formulas', 'despachos'];

/** Normaliza un string: minúsculas + sin tildes. */
function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Mapa normalizado → rutas | '*'. */
const PERMISOS_NORMALIZADOS: Record<string, string[] | '*'> = {
  administrador: '*',
  recepcion: RUTAS_RECEPCION,
  medico: RUTAS_MEDICO,
  despacho_medico: RUTAS_DESPACHO,
};

export function rolPuedeAcceder(rol: string, ruta: string): boolean {
  const permisos = PERMISOS_NORMALIZADOS[normalizar(rol)];
  if (!permisos) return false;
  if (permisos === '*') return true;
  return permisos.includes(ruta);
}
