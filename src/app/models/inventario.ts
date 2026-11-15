/** Tipo de producto del inventario. */
export type TipoProducto = 'MEDICAMENTO' | 'INSUMO';

/** Opciones de tipo de producto. */
export const TIPOS_PRODUCTO: { codigo: TipoProducto; nombre: string }[] = [
  { codigo: 'MEDICAMENTO', nombre: 'Medicamento' },
  { codigo: 'INSUMO', nombre: 'Insumo / utensilio' }
];

/** Lote de un producto. */
export interface Lote {
  /** Identificador del lote. */
  loteId: number;
  /** Número de lote. */
  numeroLote: string;
  /** Fecha de compra (yyyy-MM-dd). */
  fechaCompra: string;
  /** Fecha de ingreso al inventario (yyyy-MM-dd). */
  fechaIngreso: string;
  /** Fecha de vencimiento, si aplica. */
  fechaVencimiento: string | null;
  /** Cantidad con la que ingresó. */
  cantidadInicial: number;
  /** Cantidad disponible. */
  cantidadDisponible: number;
  /** Precio de compra por unidad. */
  precioCompra: number;
  /** Estado calculado por el backend. */
  estado: 'VIGENTE' | 'PROXIMO_A_VENCER' | 'VENCIDO' | 'AGOTADO';
}

/** Producto del inventario con sus existencias y alertas. */
export interface Producto {
  /** Identificador del producto. */
  id: number;
  /** Código interno de 8 caracteres. */
  codigo: string;
  /** Nombre. */
  nombre: string;
  /** Descripción. */
  descripcion: string | null;
  /** Presentación. */
  presentacion: string | null;
  /** Tipo de producto. */
  tipo: TipoProducto;
  /** Registro Invima. */
  registroInvima: string | null;
  /** Precio de venta al público. */
  precioVenta: number;
  /** Porcentaje de IVA. */
  ivaPorcentaje?: number;
  /** Precio de compra del lote más reciente. */
  ultimoPrecioCompra: number | null;
  /** Existencia mínima permitida. */
  stockMinimo: number;
  /** Fecha prevista del próximo pedido. */
  fechaProximoPedido: string | null;
  /** Indica si está activo. */
  activo: boolean;
  /** Unidades en lotes vigentes. */
  cantidadDisponible: number;
  /** Unidades en lotes vencidos. */
  cantidadVencida: number;
  /** Vencimiento más cercano entre los lotes vigentes. */
  proximoVencimiento: string | null;
  /** Estado de existencias. */
  estadoStock: 'NORMAL' | 'STOCK_BAJO' | 'AGOTADO';
  /** Indica si algún lote vence pronto. */
  proximoAVencer: boolean;
  /** Indica si hay existencias vencidas. */
  tieneVencidos: boolean;
  /** Fecha y hora de creación. */
  fechaCreacion: string | null;
  /** Fecha y hora de la última modificación. */
  fechaModificacion: string | null;
  /** Lotes (solo en el detalle). */
  lotes?: Lote[];
}

/** Datos para crear o editar un producto. */
export interface ProductoRq {
  /** Código de 8 caracteres. */
  codigo: string;
  /** Nombre. */
  nombre: string;
  /** Descripción. */
  descripcion: string;
  /** Presentación. */
  presentacion: string;
  /** Tipo de producto. */
  tipo: TipoProducto;
  /** Registro Invima. */
  registroInvima: string;
  /** Precio de venta. */
  precioVenta: number;
  /** Porcentaje de IVA. */
  ivaPorcentaje?: number;
  /** Stock mínimo. */
  stockMinimo: number;
  /** Fecha del próximo pedido. */
  fechaProximoPedido: string | null;
}

/** Datos para registrar la entrada de un lote. */
export interface LoteRq {
  /** Número de lote. */
  numeroLote: string;
  /** Fecha de compra. */
  fechaCompra: string;
  /** Fecha de ingreso. */
  fechaIngreso: string;
  /** Fecha de vencimiento. */
  fechaVencimiento: string | null;
  /** Unidades que ingresan. */
  cantidad: number;
  /** Precio de compra por unidad. */
  precioCompra: number;
}

/** Datos para corregir la existencia de un lote. */
export interface AjusteRq {
  /** Sentido del ajuste. */
  sentido: 'ENTRADA' | 'SALIDA';
  /** Unidades a ajustar. */
  cantidad: number;
  /** Motivo de la corrección. */
  motivo: string;
}

/** Movimiento del historial de un producto. */
export interface Movimiento {
  /** Identificador del movimiento. */
  movimientoId: number;
  /** Fecha y hora. */
  fecha: string;
  /** Tipo de movimiento. */
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA';
  /** Número del lote afectado. */
  numeroLote: string;
  /** Unidades movidas. */
  cantidad: number;
  /** Existencia del lote después del movimiento. */
  saldoLote: number;
  /** Usuario responsable. */
  usuario: string;
  /** Referencia del origen. */
  referencia: string;
  /** Observación o motivo. */
  observacion: string | null;
  /** Fórmula relacionada. */
  formulaId: number | null;
}
