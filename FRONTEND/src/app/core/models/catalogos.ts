/** Cliente de la clínica (solo los campos que usa la interfaz). */
export interface Cliente {
  clienteId: number;
  nombres: string;
  apellidos: string;
  numeroDocumento?: string;
}

/** Raza de una mascota. */
export interface Raza {
  razaId: number;
  nombre: string;
  especie: string;
}

/** Mascota asociada a un cliente. */
export interface Mascota {
  mascotaId: number;
  nombreMascota: string;
  edad: number;
  raza?: Raza;
  cliente?: Cliente;
}

/** Veterinario. */
export interface Medico {
  id: number;
  nombres: string;
  apellidos: string;
}

/** Medicamento del catálogo. */
export interface Medicamento {
  id: number;
  nombre: string;
  presentacion?: string;
}
