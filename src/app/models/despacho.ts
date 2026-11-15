import { Formula, FormulaDetalle } from './formula';

/** Estado de un lote frente a su vencimiento. */
export type EstadoLote = 'VIGENTE' | 'PROXIMO_A_VENCER' | 'VENCIDO';

/** Lote disponible para una línea, con la cantidad sugerida (vencimiento más próximo primero). */
export interface LoteDespacho {
  /** Identificador del lote. */
  loteId: number;
  /** Número del lote. */
  numeroLote: string;
  /** Fecha de vencimiento. */
  fechaVencimiento: string | null;
  /** Unidades disponibles. */
  disponible: number;
  /** Estado frente al vencimiento. */
  estado: EstadoLote;
  /** Unidades que se sugiere entregar de este lote. */
  sugerido: number;
}

/** Línea de la fórmula con sus lotes. */
export interface LineaDespacho {
  /** Medicamento formulado con lo entregado y lo pendiente. */
  linea: FormulaDetalle;
  /** Lotes con existencias. */
  lotes: LoteDespacho[];
  /** Indica si las existencias vigentes cubren lo pendiente. */
  alcanza: boolean;
}

/** Información para preparar el despacho de una fórmula. */
export interface PreparacionDespacho {
  /** Fórmula con su historial y entregas. */
  formula: Formula;
  /** Líneas con lotes sugeridos. */
  lineas: LineaDespacho[];
}

/** Unidades entregadas de una línea desde un lote. */
export interface EntregaRq {
  /** Línea de la fórmula. */
  formulaDetalleId: number;
  /** Lote del que salen. */
  loteId: number;
  /** Unidades. */
  cantidad: number;
}

/** Datos para confirmar una entrega. */
export interface DespachoRq {
  /** Observación opcional. */
  observacion: string;
  /** Unidades por línea y lote. */
  entregas: EntregaRq[];
}

/** Parámetros del listado de fórmulas pendientes. */
export interface FiltroPendientes {
  /** Página. */
  page: number;
  /** Registros por página. */
  size: number;
  /** Texto libre. */
  texto: string;
  /** Estado del despacho. */
  estadoDespacho: string;
  /** Fecha inicial. */
  desde: string;
  /** Fecha final. */
  hasta: string;
}

/** Parámetros del historial de entregas. */
export interface FiltroHistorialDespacho {
  /** Página. */
  page: number;
  /** Registros por página. */
  size: number;
  /** Texto libre. */
  texto: string;
  /** CONFIRMADO o REVERTIDO. */
  estado: string;
  /** Fecha inicial. */
  desde: string;
  /** Fecha final. */
  hasta: string;
}
