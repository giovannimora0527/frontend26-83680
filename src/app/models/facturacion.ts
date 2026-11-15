import { Formula } from './formula';

/** Tipos de servicio facturable. */
export type TipoServicio = 'CONSULTA' | 'PROCEDIMIENTO' | 'LABORATORIO' | 'OTRO';

/** Tipos con su texto visible. */
export const TIPOS_SERVICIO: { valor: TipoServicio; texto: string }[] = [
  { valor: 'CONSULTA', texto: 'Consulta' },
  { valor: 'PROCEDIMIENTO', texto: 'Procedimiento' },
  { valor: 'LABORATORIO', texto: 'Laboratorio' },
  { valor: 'OTRO', texto: 'Otro' }
];

/** Servicio con su tarifa vigente. */
export interface Servicio {
  servicioId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoServicio;
  especializacionId: number | null;
  especializacionNombre: string | null;
  valor: number;
  ivaPorcentaje: number;
  valorIva: number;
  valorTotal: number;
  activo: boolean;
  fechaModificacion: string | null;
}

/** Datos para crear o editar un servicio. */
export interface ServicioRq {
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: TipoServicio;
  especializacionId: number | null;
  valor: number;
  ivaPorcentaje: number;
  /** Motivo del cambio de tarifa (obligatorio si cambia el valor o el IVA). */
  observacion: string;
}

/** Cambio registrado en el log de tarifas. */
export interface TarifaLog {
  fecha: string;
  usuario: string;
  accion: string;
  valorAnterior: number | null;
  valorNuevo: number | null;
  ivaAnterior: number | null;
  ivaNuevo: number | null;
  observacion: string | null;
}

/** Línea de un documento de cobro (servicio o medicamento). */
export interface LineaCobro {
  atencionServicioId: number | null;
  tipo: 'SERVICIO' | 'MEDICAMENTO';
  servicioId: number | null;
  medicamentoId: number | null;
  codigo: string | null;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  ivaPorcentaje: number;
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  observacion: string | null;
}

/** Cita de la agenda del veterinario con el estado de su atención. */
export interface AgendaAtencion {
  citaId: number;
  inicio: string;
  fin: string;
  mascotaNombre: string;
  clienteNombre: string;
  motivo: string;
  estadoCita: string;
  historiaId: number | null;
  estadoAtencion: 'SIN_INICIAR' | 'EN_CURSO' | 'FINALIZADA';
}

/** Atención anterior de la mascota. */
export interface Antecedente {
  historiaId: number;
  fechaHora: string;
  medicoNombre: string;
  motivo: string;
  sintomas: string | null;
  diagnostico: string | null;
  recomendaciones: string | null;
}

/** Atención médica completa. */
export interface Atencion {
  historiaId: number;
  citaId: number | null;
  citaInicio: string | null;
  estado: 'ABIERTA' | 'CERRADA';
  fechaHora: string;
  fechaFinalizacion: string | null;
  motivo: string;
  sintomas: string | null;
  diagnostico: string | null;
  observaciones: string | null;
  recomendaciones: string | null;
  mascotaId: number;
  mascotaNombre: string;
  mascotaRaza: string | null;
  mascotaEdad: number | null;
  clienteId: number;
  clienteNombre: string;
  clienteDocumento: string;
  clienteTelefono: string | null;
  medicoId: number;
  medicoNombre: string;
  especialidad: string | null;
  antecedentes: Antecedente[];
  servicios: LineaCobro[];
  formulas: Formula[];
  totalServicios: number;
  facturaId: number | null;
  facturaNumero: string | null;
}

/** Datos clínicos de la atención. */
export interface AtencionRq {
  motivo: string;
  sintomas: string;
  diagnostico: string;
  observaciones: string;
  recomendaciones: string;
}

/** Estados de una factura. */
export type EstadoFactura = 'PENDIENTE_PAGO' | 'PAGO_PARCIAL' | 'PAGADA' | 'ANULADA';

/** Estados con su texto y clase de Bootstrap. */
export const ESTADOS_FACTURA: { valor: EstadoFactura; texto: string; clase: string }[] = [
  { valor: 'PENDIENTE_PAGO', texto: 'Pendiente de pago', clase: 'bg-warning text-dark' },
  { valor: 'PAGO_PARCIAL', texto: 'Pago parcial', clase: 'bg-info text-dark' },
  { valor: 'PAGADA', texto: 'Pagada', clase: 'bg-success' },
  { valor: 'ANULADA', texto: 'Anulada', clase: 'bg-secondary' }
];

/** Medios de pago. */
export const MEDIOS_PAGO: { valor: string; texto: string }[] = [
  { valor: 'EFECTIVO', texto: 'Efectivo' },
  { valor: 'TARJETA_DEBITO', texto: 'Tarjeta débito' },
  { valor: 'TARJETA_CREDITO', texto: 'Tarjeta crédito' },
  { valor: 'TRANSFERENCIA', texto: 'Transferencia' }
];

/** Pago registrado. */
export interface Pago {
  pagoId: number;
  fecha: string;
  valor: number;
  medio: string;
  referencia: string | null;
  usuario: string;
}

/** Factura (o vista previa de la factura de una atención). */
export interface Factura {
  facturaId: number | null;
  numero: string | null;
  historiaId: number;
  citaId: number | null;
  fechaAtencion: string;
  fecha: string;
  clienteId: number;
  clienteNombre: string;
  clienteDocumento: string;
  clienteTelefono: string | null;
  clienteDireccion: string | null;
  mascotaId: number;
  mascotaNombre: string;
  mascotaRaza: string | null;
  medicoNombre: string;
  especialidad: string;
  subtotal: number;
  descuento: number;
  motivoDescuento: string | null;
  iva: number;
  total: number;
  pagado: number;
  saldo: number;
  estado: EstadoFactura | null;
  usuario: string | null;
  usuarioAnulacion: string | null;
  fechaAnulacion: string | null;
  motivoAnulacion: string | null;
  lineas: LineaCobro[] | null;
  pagos: Pago[] | null;
  advertencias: string[] | null;
}

/** Filtros del listado de facturas. */
export interface FiltroFacturas {
  page: number;
  size: number;
  texto: string;
  estado: string;
  clienteId: number | null;
  mascotaId: number | null;
  desde: string;
  hasta: string;
}
