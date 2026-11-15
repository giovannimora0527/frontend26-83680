/** Códigos de perfil con los que se adaptan las acciones de cada pantalla. */
export type Rol = 'ADMIN' | 'VETERINARIO' | 'RECEPCIONISTA' | 'DESPACHO_MEDICO';

/** Credenciales para iniciar sesión. */
export interface LoginRq {
  /** Nombre de usuario. */
  username: string;
  /** Contraseña. */
  password: string;
}

/** Opción de menú administrada desde la base de datos. */
export interface MenuOpcion {
  /** Identificador de la opción. */
  menuId: number;
  /** Código de la opción. */
  code: string;
  /** Título visible. */
  title: string;
  /** Ruta de la pantalla. */
  url: string;
  /** Clases CSS del icono. */
  icon: string;
  /** Indica si la opción se muestra. */
  activo: boolean;
}

/** Datos del usuario autenticado. */
export interface Perfil {
  /** Identificador del usuario. */
  id: number;
  /** Nombre de usuario. */
  username: string;
  /** Correo electrónico. */
  email: string;
  /** Código del perfil. */
  rol: Rol;
  /** Nombre visible del perfil. */
  perfilNombre: string;
  /** Opciones de menú activas del perfil. */
  menus: MenuOpcion[];
  /** Veterinario enlazado al usuario, si lo tiene. */
  medicoId: number | null;
  /** Nombre completo del veterinario enlazado. */
  medicoNombre: string | null;
}

/** Respuesta de un inicio de sesión exitoso. */
export interface LoginRs {
  /** Token que se envía en cada petición. */
  token: string;
  /** Datos del usuario autenticado. */
  perfil: Perfil;
}
