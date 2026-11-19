export class DetalleServicioRq {
  codigoServicio?: string;
  concepto?: string;
  cantidad?: number;
  precioUnitario?: number;
  descuentoItem?: number;
}

export class FacturaRq {
  citaId?: number;
  servicios?: DetalleServicioRq[];
  porcentajeDescuento?: number;
  valorDescuento?: number;
  porcentajeImpuesto?: number;
  observaciones?: string;
  montoPagoInicial?: number;
  metodoPagoInicial?: string;
  referenciaPagoInicial?: string;
  usuarioRegistro?: string;
}

export class PagoFacturaRq {
  monto?: number;
  metodoPago?: string;
  referenciaPago?: string;
  usuarioRegistro?: string;
  observacion?: string;
}
