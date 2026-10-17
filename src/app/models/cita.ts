import { DireccionOrden } from 'src/app/utils/orden-tabla';

/** Estados posibles de una cita médica. */
export type EstadoCita =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'ATENDIDA'
  | 'CANCELADA'
  | 'PROGRAMADA';

/** Lista de todos los estados, usada en filtros y formularios. */
export const ESTADOS_CITA: EstadoCita[] = [
  'PENDIENTE',
  'PROGRAMADA',
  'CONFIRMADA',
  'ATENDIDA',
  'CANCELADA'
];

/**
 * Estados a los que puede pasar una cita desde cada estado.
 * Debe coincidir con las transiciones que valida el backend: ATENDIDA y
 * CANCELADA son estados finales (una cancelada solo vuelve con "Reactivar").
 */
export const TRANSICIONES_CITA: Record<EstadoCita, EstadoCita[]> = {
  PENDIENTE: ['PENDIENTE', 'CONFIRMADA', 'PROGRAMADA', 'CANCELADA'],
  PROGRAMADA: ['PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA'],
  CONFIRMADA: ['CONFIRMADA', 'ATENDIDA', 'CANCELADA'],
  ATENDIDA: ['ATENDIDA'],
  CANCELADA: ['CANCELADA']
};

/** Cita médica tal como la devuelve el backend. */
export interface Cita {
  /** Identificador de la cita. */
  citaId: number;
  /** Fecha de la cita (yyyy-MM-dd). */
  fecha: string;
  /** Hora de la cita (HH:mm:ss). */
  hora: string;
  /** Identificador del cliente dueño de la mascota. */
  clienteId: number;
  /** Nombre completo del cliente. */
  clienteNombre: string;
  /** Identificador de la mascota. */
  mascotaId: number;
  /** Nombre de la mascota. */
  mascotaNombre: string;
  /** Identificador del veterinario. */
  medicoId: number;
  /** Nombre completo del veterinario. */
  medicoNombre: string;
  /** Motivo de la consulta. */
  motivo: string;
  /** Estado actual de la cita. */
  estado: EstadoCita;
  /** Fecha y hora en que se registró la cita. */
  fechaCreacion: string;
  /** Fecha y hora de la última modificación, si existe. */
  fechaModificacion?: string | null;
}

/** Datos que se envían al backend para crear o editar una cita. */
export interface CitaRq {
  /** Cliente dueño de la mascota (solo al crear). */
  clienteId?: number;
  /** Mascota que será atendida (solo al crear). */
  mascotaId?: number;
  /** Veterinario que atenderá la cita. */
  medicoId: number;
  /** Fecha de la cita (yyyy-MM-dd). */
  fecha: string;
  /** Hora de la cita (HH:mm). */
  hora: string;
  /** Motivo de la consulta. */
  motivo: string;
  /** Estado de la cita. */
  estado: EstadoCita;
}

/** Parámetros del listado de citas: página, orden y filtros. */
export interface FiltroCitas {
  /** Página solicitada (empieza en 0). */
  page: number;
  /** Registros por página. */
  size: number;
  /** Columna de orden: fecha, hora, cliente, mascota, medico o estado. */
  orden: string;
  /** Dirección del orden. */
  direccion: DireccionOrden;
  /** Texto libre de búsqueda. */
  texto: string;
  /** Estado por el que se filtra (vacío = todos). */
  estado: string;
  /** Veterinario por el que se filtra. */
  medicoId: number | null;
  /** Fecha inicial del rango (yyyy-MM-dd). */
  desde: string;
  /** Fecha final del rango (yyyy-MM-dd). */
  hasta: string;
}
