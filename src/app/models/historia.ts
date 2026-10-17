import { DireccionOrden } from 'src/app/utils/orden-tabla';

/**
 * Estados de una historia clínica.
 * ABIERTA: el paciente sigue en seguimiento y se le pueden agregar anotaciones.
 * CERRADA: el caso terminó; queda solo para consulta.
 */
export type EstadoHistoria = 'ABIERTA' | 'CERRADA';

/** Lista de estados, usada en el filtro del listado. */
export const ESTADOS_HISTORIA: EstadoHistoria[] = ['ABIERTA', 'CERRADA'];

/** Historia clínica (consulta) tal como la devuelve el backend. */
export interface HistoriaClinica {
  /** Identificador de la historia clínica. */
  historiaId: number;
  /** Fecha de la consulta (yyyy-MM-dd); la toma el backend de la cita. */
  fecha: string;
  /** Hora de la consulta (HH:mm:ss). */
  hora: string;
  /** Identificador del cliente dueño de la mascota. */
  clienteId: number;
  /** Nombre completo del cliente. */
  clienteNombre: string;
  /** Identificador de la mascota. */
  mascotaId: number;
  /** Nombre de la mascota. */
  mascotaNombre: string;
  /** Identificador del veterinario que atendió. */
  medicoId: number;
  /** Nombre completo del veterinario. */
  medicoNombre: string;
  /** Cita atendida que originó la historia. */
  citaId: number;
  /** Motivo de la consulta. */
  motivo: string;
  /** Diagnóstico del veterinario. */
  diagnostico: string;
  /** Observaciones de la consulta. */
  observaciones: string | null;
  /** Estado de la historia. */
  estado: EstadoHistoria;
  /** Cantidad de anotaciones registradas. */
  totalAnotaciones: number;
  /** Fecha y hora en que se registró la historia. */
  fechaCreacion: string;
}

/** Datos que se envían al backend para crear una historia clínica. */
export interface HistoriaRq {
  /** Cliente dueño de la mascota. */
  clienteId: number;
  /** Mascota atendida (debe pertenecer al cliente). */
  mascotaId: number;
  /** Cita atendida de la mascota que origina la historia. */
  citaId: number;
  /** Veterinario que registra la historia. */
  medicoId: number;
  /** Motivo de la consulta. */
  motivo: string;
  /** Diagnóstico. */
  diagnostico: string;
  /** Observaciones (opcional). */
  observaciones: string;
}

/** Parámetros del listado de historias clínicas. */
export interface FiltroHistorias {
  /** Página solicitada (empieza en 0). */
  page: number;
  /** Registros por página. */
  size: number;
  /** Columna de orden: fecha, cliente, mascota, medico o estado. */
  orden: string;
  /** Dirección del orden. */
  direccion: DireccionOrden;
  /** Texto libre (mascota, cliente, veterinario, motivo, diagnóstico). */
  texto?: string;
  /** Estado de la historia (vacío = todos). */
  estado?: string;
  /** Cliente por el que se filtra. */
  clienteId?: number | null;
  /** Mascota por la que se filtra. */
  mascotaId?: number | null;
  /** Veterinario por el que se filtra. */
  medicoId?: number | null;
  /** Fecha inicial del rango (yyyy-MM-dd). */
  desde?: string;
  /** Fecha final del rango (yyyy-MM-dd). */
  hasta?: string;
}

/** Cita atendida de una mascota que todavía no tiene historia clínica. */
export interface CitaDisponible {
  /** Identificador de la cita. */
  citaId: number;
  /** Fecha de la cita (yyyy-MM-dd). */
  fecha: string;
  /** Hora de la cita (HH:mm:ss). */
  hora: string;
  /** Motivo con el que se agendó. */
  motivo: string;
  /** Veterinario que atendió la cita. */
  medicoId: number;
  /** Nombre completo del veterinario. */
  medicoNombre: string;
}

/** Anotación de seguimiento dentro de una historia clínica. */
export interface Anotacion {
  /** Identificador de la anotación. */
  anotacionId: number;
  /** Historia clínica a la que pertenece. */
  historiaId: number;
  /** Veterinario autor de la anotación. */
  medicoId: number;
  /** Nombre completo del veterinario. */
  medicoNombre: string;
  /** Descripción de lo observado en el control. */
  descripcion: string;
  /** Observación adicional. */
  observacion: string | null;
  /** Diagnóstico o evolución del paciente. */
  diagnostico: string;
  /** Fecha y hora en que se registró. */
  fechaCreacion: string;
}

/** Datos que se envían al backend para crear una anotación. */
export interface AnotacionRq {
  /** Historia clínica a la que se agrega. */
  historiaId: number;
  /** Veterinario autor. */
  medicoId: number;
  /** Descripción. */
  descripcion: string;
  /** Observación (opcional). */
  observacion: string;
  /** Diagnóstico o evolución. */
  diagnostico: string;
}

/** Parámetros del listado de anotaciones de una historia. */
export interface FiltroAnotaciones {
  /** Historia clínica consultada. */
  historiaId: number;
  /** Página solicitada (empieza en 0). */
  page: number;
  /** Registros por página. */
  size: number;
  /** Columna de orden: fecha o medico. */
  orden: string;
  /** Dirección del orden. */
  direccion: DireccionOrden;
  /** Texto libre de búsqueda. */
  texto: string;
}
