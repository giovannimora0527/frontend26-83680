/** Especialización médica de un veterinario tal como la devuelve el backend. */
export interface Especializacion {
  /** Identificador de la especialización. */
  id: number;
  /** Nombre (único). */
  nombre: string;
  /** Descripción del área. */
  descripcion: string | null;
  /** Código corto y único (por ejemplo "CIR-01"). */
  codigoEspecializacion: string;
}

/** Datos que se envían al backend para crear o editar una especialización. */
export interface EspecializacionRq {
  /** Nombre. */
  nombre: string;
  /** Descripción (opcional). */
  descripcion: string;
  /** Código en mayúsculas. */
  codigoEspecializacion: string;
}
