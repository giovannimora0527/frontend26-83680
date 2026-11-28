import { Cita } from './cita';

export interface FacturaItem {
  id?: number;
  descripcion?: string;
  tipo?: string;
  cantidad?: number;
  precioUnitario?: number;
  iva?: number;
  subtotal?: number;
}

export interface Pago {
  id?: number;
  monto?: number;
  fechaPago?: string;
  metodoPago?: string;
  notas?: string;
}

export interface Factura {
  id?: number;
  cita?: Cita;
  numero?: string;
  subtotal?: number;
  totalIva?: number;
  descuento?: number;
  total?: number;
  estado?: string;
  fechaGeneracion?: string;
  notas?: string;
  items?: FacturaItem[];
  pagos?: Pago[];
}
