/** Lote de un medicamento. */
export interface Lote {
  id?: number;
  numeroLote: string;
  fechaCompra: string;
  fechaIngreso?: string;
  fechaVence?: string | null;
  precioCompra: number;
  cantidadInicial?: number;
  cantidadDisponible?: number;
  /** VIGENTE, POR_VENCER, VENCIDO o AGOTADO. */
  estado?: string;
}

/** Medicamento o producto del inventario con existencias y alertas. */
export interface ProductoInventario {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  presentacion?: string;
  /** MEDICAMENTO o UTENSILIO. */
  tipo: string;
  registroInvima?: string | null;
  precioVenta: number;
  ivaPorcentaje: number;
  stockMinimo: number;
  fechaProximoPedido?: string | null;
  activo?: boolean;
  stockTotal?: number;
  stockDisponible?: number;
  precioCompra?: number;
  proximoVencimiento?: string | null;
  alertas?: string[];
  lotes?: Lote[];
}

/** Datos para crear un lote. */
export interface LoteRq {
  medicamentoId?: number;
  numeroLote: string;
  fechaCompra: string;
  fechaVence?: string | null;
  precioCompra: number;
  cantidad: number;
}

/** Movimiento de inventario. */
export interface Movimiento {
  id: number;
  fecha: string;
  tipo: string;
  medicamentoCodigo: string;
  medicamentoNombre: string;
  numeroLote?: string;
  cantidad: number;
  saldoLote: number;
  usuario?: string;
  formulaId?: number;
  despachoId?: number;
  observacion?: string;
}

/** Fila de la carga masiva. */
export interface CargaFila {
  fila: number;
  codigo: string;
  nombre: string;
  tipo: string;
  registroInvima: string;
  precioCompra: string;
  precioVenta: string;
  numeroLote: string;
  cantidad: string;
  fechaCompra: string;
  fechaVence: string;
  valida: boolean;
  productoNuevo: boolean;
  errores: string[];
}

/** Resultado de la carga masiva. */
export interface CargaResultado {
  nombreArchivo: string;
  totalFilas: number;
  filasValidas: number;
  filasError: number;
  filasImportadas?: number;
  logId?: number;
  filas: CargaFila[];
}

/** Log de una carga masiva. */
export interface CargaLog {
  id: number;
  usuarioId: number;
  fecha: string;
  nombreArchivo: string;
  totalFilas: number;
  filasOk: number;
  filasError: number;
  detalle?: string;
}
