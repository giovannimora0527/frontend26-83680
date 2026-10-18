/** Estados posibles de una cita (coinciden con el enum EstadoCita del backend). */
export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA' | 'PROGRAMADA';

/** Cita tal como la devuelve el backend. */
export interface Cita {
  id: number;
  clienteId: number;
  clienteNombre: string;
  mascotaId: number;
  mascotaNombre: string;
  medicoId: number;
  medicoNombre: string;
  fechaHora: string;
  motivo: string;
  estado: EstadoCita;
}

/** Datos que se envían para crear o actualizar una cita. */
export interface CitaRq {
  clienteId: number;
  mascotaId: number;
  medicoId: number;
  fechaHora: string;
  motivo: string;
  estado: EstadoCita;
}

/** Filtros del listado de citas. */
export interface FiltroCita {
  texto?: string;
  estado?: string;
  clienteId?: number | null;
  mascotaId?: number | null;
  medicoId?: number | null;
  fechaDesde?: string;
  fechaHasta?: string;
}
