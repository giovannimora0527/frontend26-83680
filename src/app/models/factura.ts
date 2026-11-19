import { Cita } from './cita';
import { Cliente } from './cliente';
import { FormulaMedica } from './formula-medica';
import { Mascota } from './mascota';
import { Medico } from './medico';

export class DetalleFactura {
  id?: number;
  tipoItem?: 'SERVICIO' | 'MEDICAMENTO' | string;
  codigoServicio?: string;
  formulaMedicaId?: number;
  medicamentoId?: number;
  concepto?: string;
  cantidad?: number;
  precioUnitarioHistorico?: number;
  descuentoItem?: number;
  subtotalItem?: number;
}

export class PagoFactura {
  id?: number;
  fechaPago?: Date | string;
  monto?: number;
  metodoPago?: string;
  referenciaPago?: string;
  usuarioRegistro?: string;
  observacion?: string;
}

export class Factura {
  id?: number;
  numeroFactura?: string;
  cita?: Cita;
  cliente?: Cliente;
  mascota?: Mascota;
  medico?: Medico;
  fechaGeneracion?: Date | string;
  subtotalServicios?: number;
  subtotalMedicamentos?: number;
  subtotal?: number;
  porcentajeDescuento?: number;
  valorDescuento?: number;
  porcentajeImpuesto?: number;
  valorImpuesto?: number;
  total?: number;
  totalPagado?: number;
  saldoPendiente?: number;
  estado?: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'ANULADA' | string;
  observaciones?: string;
  motivoAnulacion?: string;
  fechaAnulacion?: Date | string;
  historialOperaciones?: string;
  detalles?: DetalleFactura[];
  pagos?: PagoFactura[];
}

export class PreliquidacionFactura {
  cita?: Cita;
  cliente?: Cliente;
  mascota?: Mascota;
  medico?: Medico;
  serviciosSugeridos?: DetalleFactura[];
  medicamentosDispensados?: DetalleFactura[];
  formulasPendientesDispensar?: FormulaMedica[];
  subtotalServicios?: number;
  subtotalMedicamentos?: number;
  porcentajeImpuestoSugerido?: number;
}
