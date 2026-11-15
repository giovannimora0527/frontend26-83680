/** Perfil de acceso con las opciones de menú que tiene asignadas. */
export interface PerfilAcceso {
  /** Identificador del perfil. */
  perfilId: number;
  /** Código del perfil. */
  codigo: string;
  /** Nombre visible. */
  nombre: string;
  /** Indica si el perfil está activo. */
  activo: boolean;
  /** Cantidad de usuarios con este perfil. */
  totalUsuarios: number;
  /** Identificadores de las opciones asignadas. */
  menuIds: number[];
}
