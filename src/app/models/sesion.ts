/**
 * Opcion del menu que el backend asigna al perfil.
 */
export interface MenuItem {
  menuId: number;
  code: string;
  title: string;
  url: string;
  icon: string;
}

/**
 * Sesion del usuario (respuesta del login).
 */
export interface Sesion {
  token?: string;
  fechaExpiracion?: string;
  usuarioId: number;
  username: string;
  perfilId: number;
  perfilNombre: string;
  medicoId?: number;
  medicoNombre?: string;
  menus: MenuItem[];
}

/** Ids de los perfiles (tabla perfil). */
export const PERFIL = {
  ADMINISTRADOR: 1,
  RECEPCION: 2,
  MEDICO: 3,
  DESPACHO_MEDICO: 4
};
