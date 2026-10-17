/**
 * Versiones reducidas de las entidades que se usan para llenar los combos
 * de los formularios (cliente → mascota → cita / historia / fórmula).
 */

/** Cliente reducido para el combo de clientes. */
export interface ClienteOpcion {
  /** Identificador del cliente. */
  clienteId: number;
  /** Nombres del cliente. */
  nombres: string;
  /** Apellidos del cliente. */
  apellidos: string;
}

/** Mascota reducida para el combo de mascotas. */
export interface MascotaOpcion {
  /** Identificador de la mascota. */
  mascotaId: number;
  /** Nombre de la mascota. */
  nombreMascota: string;
}

/** Veterinario reducido para el combo de veterinarios. */
export interface MedicoOpcion {
  /** Identificador del veterinario (el backend lo expone como "id"). */
  id: number;
  /** Nombres del veterinario. */
  nombres: string;
  /** Apellidos del veterinario. */
  apellidos: string;
}

/** Medicamento reducido para el combo de medicamentos. */
export interface MedicamentoOpcion {
  /** Identificador del medicamento. */
  id: number;
  /** Nombre comercial o genérico. */
  nombre: string;
  /** Presentación (tabletas, jarabe, ampolla...). */
  presentacion: string;
}
