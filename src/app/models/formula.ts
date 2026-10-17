import { DireccionOrden } from 'src/app/utils/orden-tabla';

/**
 * Estados de una fórmula médica. Una fórmula está ligada a información
 * clínica, así que nunca se borra: se pasa a INACTIVA.
 */
export type EstadoFormula = 'ACTIVA' | 'INACTIVA';

/** Lista de estados, usada en el filtro del listado. */
export const ESTADOS_FORMULA: EstadoFormula[] = ['ACTIVA', 'INACTIVA'];

/** Unidades en las que se puede expresar la dosis. */
export const UNIDADES_DOSIS: string[] = ['mg', 'g', 'ml', 'gotas', 'tableta', 'cápsula', 'UI', 'aplicación'];

/** Límites de los valores numéricos; deben coincidir con los que valida el backend. */
export const LIMITES_FORMULA = {
  /** Dosis máxima permitida por toma. */
  dosisMaxima: 10000,
  /** Mínimo de horas entre tomas. */
  frecuenciaMinima: 1,
  /** Máximo de horas entre tomas. */
  frecuenciaMaxima: 168,
  /** Mínimo de días de tratamiento. */
  duracionMinima: 1,
  /** Máximo de días de tratamiento. */
  duracionMaxima: 365
} as const;

/** Fórmula médica tal como la devuelve el backend. */
export interface Formula {
  /** Identificador de la fórmula. */
  formulaId: number;
  /** Fecha de emisión (yyyy-MM-dd). */
  fechaEmision: string;
  /** Historia clínica (consulta) que originó la fórmula. */
  historiaId: number;
  /** Fecha de la consulta asociada (yyyy-MM-dd). */
  historiaFecha: string;
  /** Identificador del cliente dueño de la mascota. */
  clienteId: number;
  /** Nombre completo del cliente. */
  clienteNombre: string;
  /** Identificador de la mascota. */
  mascotaId: number;
  /** Nombre de la mascota. */
  mascotaNombre: string;
  /** Identificador del veterinario que formula. */
  medicoId: number;
  /** Nombre completo del veterinario. */
  medicoNombre: string;
  /** Identificador del medicamento. */
  medicamentoId: number;
  /** Nombre del medicamento. */
  medicamentoNombre: string;
  /** Cantidad por toma. */
  dosis: number;
  /** Unidad de la dosis (mg, ml, tableta...). */
  unidadDosis: string;
  /** Cada cuántas horas se administra. */
  frecuenciaHoras: number;
  /** Duración del tratamiento en días. */
  duracionDias: number;
  /** Indicaciones para el cliente. */
  indicaciones: string;
  /** Estado de la fórmula. */
  estado: EstadoFormula;
  /** Fecha y hora en que se registró. */
  fechaCreacion: string;
  /** Fecha y hora de la última modificación, si existe. */
  fechaModificacion?: string | null;
}

/**
 * Datos que se envían al backend para crear o editar una fórmula.
 * Mascota, historia y veterinario solo se envían al crear: una fórmula
 * emitida no cambia de paciente ni de consulta.
 */
export interface FormulaRq {
  /** Mascota (solo al crear). */
  mascotaId?: number;
  /** Historia clínica de la mascota (solo al crear). */
  historiaId?: number;
  /** Veterinario que formula (solo al crear). */
  medicoId?: number;
  /** Fecha de emisión (yyyy-MM-dd); no puede ser anterior a la consulta. */
  fechaEmision: string;
  /** Medicamento formulado. */
  medicamentoId: number;
  /** Cantidad por toma (mayor que cero). */
  dosis: number;
  /** Unidad de la dosis. */
  unidadDosis: string;
  /** Horas entre tomas. */
  frecuenciaHoras: number;
  /** Días de tratamiento. */
  duracionDias: number;
  /** Indicaciones. */
  indicaciones: string;
}

/** Parámetros del listado de fórmulas. */
export interface FiltroFormulas {
  /** Página solicitada (empieza en 0). */
  page: number;
  /** Registros por página. */
  size: number;
  /** Columna de orden: creacion, emision, mascota, cliente, medicamento, medico o estado. */
  orden: string;
  /** Dirección del orden. */
  direccion: DireccionOrden;
  /** Texto libre (mascota, cliente, veterinario, medicamento). */
  texto: string;
  /** Estado (vacío = todos). */
  estado: string;
  /** Veterinario por el que se filtra. */
  medicoId: number | null;
  /** Medicamento por el que se filtra. */
  medicamentoId: number | null;
  /** Fecha de emisión inicial (yyyy-MM-dd). */
  desde: string;
  /** Fecha de emisión final (yyyy-MM-dd). */
  hasta: string;
}
