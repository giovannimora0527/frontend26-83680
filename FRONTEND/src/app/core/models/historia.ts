/** Resumen de una historia clínica para el listado. */
export interface HistoriaResumen {
  id: number;
  fechaHora: string;
  mascotaId: number;
  mascotaNombre: string;
  clienteId: number;
  clienteNombre: string;
  medicoId: number;
  medicoNombre: string;
  motivoConsulta: string;
  estado: 'ABIERTA' | 'CERRADA';
}

/** Detalle completo de una historia clínica. */
export interface HistoriaDetalle extends HistoriaResumen {
  citaId: number;
  diagnostico: string;
  observaciones?: string;
  fechaCreacion: string;
}

/** Datos para crear una historia clínica. */
export interface HistoriaRq {
  clienteId: number;
  mascotaId: number;
  citaId: number;
  medicoId: number;
  fechaHora: string;
  motivoConsulta: string;
  diagnostico: string;
  observaciones?: string;
}

/** Filtros del listado de historias. */
export interface FiltroHistoria {
  texto?: string;
  estado?: string;
  clienteId?: number | null;
  mascotaId?: number | null;
  medicoId?: number | null;
  fechaDesde?: string;
  fechaHasta?: string;
}

/** Anotación de una historia clínica. */
export interface Anotacion {
  id: number;
  historiaId: number;
  medicoId: number;
  medicoNombre: string;
  fecha: string;
  descripcion: string;
  observacion?: string;
  diagnosticoEvolucion?: string;
}

/** Datos para crear una anotación. */
export interface AnotacionRq {
  historiaId: number;
  medicoId: number;
  descripcion: string;
  observacion: string;
  diagnosticoEvolucion: string;
}

/** Filtros del histórico de anotaciones. */
export interface FiltroAnotacion {
  texto?: string;
  historiaId?: number | null;
  mascotaId?: number | null;
  medicoId?: number | null;
  fechaDesde?: string;
  fechaHasta?: string;
}
