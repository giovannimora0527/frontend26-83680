/** Resumen de una fórmula para el listado (pocos campos a propósito). */
export interface FormulaResumen {
  id: number;
  mascotaNombre: string;
  medicoNombre: string;
  medicamentoNombre: string;
  dosis: string;
  fechaEmision: string;
  fechaCreacion: string;
  activa: boolean;
}

/** Detalle completo de una fórmula. */
export interface FormulaDetalle {
  id: number;
  mascotaId: number;
  mascotaNombre: string;
  clienteNombre: string;
  historiaId: number;
  citaId: number;
  fechaConsulta: string;
  medicoId: number;
  medicoNombre: string;
  medicamentoId: number;
  medicamentoNombre: string;
  fechaEmision: string;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  indicaciones: string;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

/** Datos para crear o actualizar una fórmula. */
export interface FormulaRq {
  mascotaId: number;
  historiaId: number;
  medicoId: number;
  medicamentoId: number;
  fechaEmision: string;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  indicaciones: string;
}

/** Filtros del listado de fórmulas. */
export interface FiltroFormula {
  texto?: string;
  mascotaId?: number | null;
  medicoId?: number | null;
  medicamentoId?: number | null;
  activa?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}
