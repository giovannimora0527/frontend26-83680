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
  /** Hora de finalización (HH:mm:ss). */
  horaFin: string;
  /** Inicio completo (yyyy-MM-ddTHH:mm:ss), para el calendario. */
  inicio: string;
  /** Fin completo (yyyy-MM-ddTHH:mm:ss), para el calendario. */
  fin: string;
  /** Teléfono del propietario. */
  clienteTelefono?: string | null;
  /** Raza y especie de la mascota. */
  mascotaRaza?: string | null;
  /** Edad de la mascota en años. */
  mascotaEdad?: number | null;
  /** Especialidad del veterinario. */
  especialidad?: string | null;
  /** Motivo de la cancelación. */
  motivoCancelacion?: string | null;
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
  /** Hora de finalización (opcional). */
  horaFin?: string | null;
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

/** Estado de la cita con su nombre visible y color (catálogo del backend). */
export interface EstadoCitaInfo {
  /** Código del estado. */
  codigo: EstadoCita;
  /** Nombre visible. */
  nombre: string;
  /** Descripción. */
  descripcion: string | null;
  /** Color en el calendario. */
  color: string;
  /** Si es un estado final. */
  esFinal: boolean;
  /** Orden de presentación. */
  orden: number;
}

/** Cambio registrado sobre una cita. */
export interface CitaHistorial {
  /** Fecha y hora del cambio. */
  fecha: string;
  /** Usuario que hizo el cambio. */
  usuario: string;
  /** CREADA, EDITADA, REPROGRAMADA, ESTADO o REACTIVADA. */
  accion: string;
  /** Estado anterior. */
  estadoAnterior: string | null;
  /** Estado nuevo. */
  estadoNuevo: string | null;
  /** Inicio anterior. */
  inicioAnterior: string | null;
  /** Inicio nuevo. */
  inicioNuevo: string | null;
  /** Observación o motivo. */
  observacion: string | null;
}

/** Franja semanal de atención de un veterinario. */
export interface HorarioMedico {
  /** Identificador (al consultar). */
  horarioId?: number;
  /** 1 = lunes ... 7 = domingo. */
  diaSemana: number;
  /** Hora de inicio (HH:mm o HH:mm:ss). */
  horaInicio: string;
  /** Hora de fin. */
  horaFin: string;
}

/** Nombres de los días de la semana (índice 1 = lunes). */
export const DIAS_SEMANA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Nombre visible de cada estado (respaldo si el catálogo no ha cargado). */
export const NOMBRE_ESTADO_CITA: Record<EstadoCita, string> = {
  PENDIENTE: 'Pendiente',
  PROGRAMADA: 'Programada',
  CONFIRMADA: 'Confirmada',
  ATENDIDA: 'Finalizada',
  CANCELADA: 'Cancelada'
};
