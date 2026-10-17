/** Especies sugeridas al registrar una raza (se puede escribir otra). */
export const ESPECIES_SUGERIDAS: string[] = ['Canino', 'Felino', 'Ave', 'Roedor', 'Reptil', 'Equino', 'Bovino'];

/** Raza de mascota tal como la devuelve el backend. */
export interface Raza {
  /** Identificador de la raza. */
  razaId: number;
  /** Nombre de la raza (único dentro de la especie). */
  nombre: string;
  /** Especie a la que pertenece (Canino, Felino...). */
  especie: string;
  /** Fecha y hora de registro. */
  fechaCreacion?: string;
  /** Fecha y hora de la última modificación, si existe. */
  fechaModificacion?: string | null;
}

/** Datos que se envían al backend para crear o editar una raza. */
export interface RazaRq {
  /** Nombre de la raza. */
  nombre: string;
  /** Especie. */
  especie: string;
}
