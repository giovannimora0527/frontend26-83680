/**
 * Usuario del sistema tal como lo devuelve el backend. La contraseña (ni su
 * hash) nunca viaja al frontend.
 */
export interface Usuario {
  /** Identificador del usuario. */
  id: number;
  /** Nombre de usuario para iniciar sesión (único). */
  username: string;
  /** Correo electrónico (único). */
  email: string;
  /** Código del perfil. */
  rol: string;
  /** Identificador del perfil. */
  perfilId: number;
  /** Nombre visible del perfil. */
  perfilNombre: string;
  /** Fecha y hora de creación. */
  fechaCreacion?: string;
  /** Indica si puede iniciar sesión. */
  activo: boolean;
}

/** Datos que se envían al backend para crear o editar un usuario. */
export interface UsuarioRq {
  /** Nombre de usuario. */
  username: string;
  /** Correo electrónico. */
  email: string;
  /** Perfil de acceso. */
  perfilId: number;
  /** Contraseña: obligatoria al crear; al editar solo se envía si se cambia. */
  password?: string;
}
