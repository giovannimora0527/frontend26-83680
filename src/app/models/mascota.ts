import { Cliente } from './cliente';
import { Raza } from './raza';

/** Edad máxima aceptada, en años (debe coincidir con el backend). */
export const EDAD_MAXIMA_MASCOTA = 40;

/** Mascota tal como la devuelve el backend, con su raza y su dueño. */
export interface Mascota {
  /** Identificador de la mascota. */
  mascotaId: number;
  /** Nombre (único entre las mascotas del mismo cliente). */
  nombreMascota: string;
  /** Edad en años. */
  edad: number;
  /** Fecha y hora de registro. */
  fechaRegistro?: string;
  /** Fecha y hora de la última modificación, si existe. */
  fechaModificacion?: string | null;
  /** Raza de la mascota. */
  raza: Raza;
  /** Cliente dueño. */
  cliente: Cliente;
}

/**
 * Datos que se envían al backend para crear o editar una mascota. El dueño
 * solo se envía al crear: una mascota no cambia de dueño.
 */
export interface MascotaRq {
  /** Nombre de la mascota. */
  nombreMascota: string;
  /** Edad en años. */
  edad: number;
  /** Raza elegida. */
  razaId: number;
  /** Cliente dueño (solo al crear). */
  clienteId?: number;
}
