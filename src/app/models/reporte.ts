import { Medicamento } from './medicamento';

export interface ItemFinancieroAgrupado {
  id?: number;
  categoria: string;
  subcategoria?: string;
  cantidadFacturas: number;
  ingresosServicios: number;
  ingresosMedicamentos: number;
  descuentos: number;
  impuestos: number;
  totalFacturado: number;
  totalRecaudado: number;
}

export interface ResumenPeriodoFinanciero {
  periodo: string;
  cantidadFacturas: number;
  ingresosServicios: number;
  ingresosMedicamentos: number;
  descuentos: number;
  impuestos: number;
  totalFacturado: number;
  totalRecaudado: number;
}

export interface ReporteFinancieroRS {
  fechaGeneracion?: string;
  rangoFechas?: string;
  ingresosTotalesFacturados: number;
  ingresosRecaudados: number;
  saldoPendienteTotal: number;
  ingresosConsultasServicios: number;
  ingresosVentaMedicamentos: number;
  impuestosGenerados: number;
  impuestosRecaudados: number;
  descuentosAplicados: number;
  totalFacturasGeneradas: number;
  facturasPagadas: number;
  montoFacturasPagadas: number;
  facturasPendientes: number;
  montoFacturasPendientes: number;
  pagosParciales: number;
  montoPagosParciales: number;
  facturasAnuladas: number;
  montoFacturasAnuladas: number;
  ingresosPorEspecialidad: ItemFinancieroAgrupado[];
  ingresosPorVeterinario: ItemFinancieroAgrupado[];
  resumenPorDia: ResumenPeriodoFinanciero[];
  resumenPorMes: ResumenPeriodoFinanciero[];
  resumenPorAnio: ResumenPeriodoFinanciero[];
}

export interface ItemExistenciaValorizada {
  medicamentoId: number;
  codigo: string;
  nombre: string;
  presentacion?: string;
  lote?: string;
  registroInvima?: string;
  requiereRegistroInvima?: boolean;
  fechaCompra?: string;
  fechaIngresoInventario?: string;
  fechaVence?: string;
  diasParaVencer: number;
  cantidadDisponible: number;
  stockMinimo: number;
  precioCompra: number;
  precioVenta: number;
  valorCostoTotal: number;
  valorVentaTotal: number;
  margenPotencial: number;
  estadoAlerta: 'VENCIDO' | 'AGOTADO' | 'STOCK_MINIMO' | 'PROXIMO_VENCER' | 'NORMAL' | string;
  activo?: boolean;
}

export interface ItemMovimientoKardex {
  id: number;
  fechaRegistro: string;
  medicamentoId: number;
  codigoMedicamento: string;
  nombreMedicamento: string;
  presentacion?: string;
  lote?: string;
  tipo: 'ENTRADA' | 'SALIDA' | string;
  cantidad: number;
  motivo?: string;
  referenciaTipo?: string;
  referenciaId?: number;
  usuarioRegistro?: string;
}

export interface ReporteInventarioRS {
  fechaGeneracion?: string;
  rangoFechas?: string;
  diasUmbralProximoVencer: number;
  totalProductos: number;
  totalUnidadesExistencia: number;
  valorInventarioCostoAdquisicion: number;
  valorPotencialVenta: number;
  margenPotencialEstimado: number;
  cantidadAgotados: number;
  cantidadStockMinimo: number;
  cantidadProximosVencer: number;
  cantidadVencidos: number;
  medicamentosAgotados: Medicamento[];
  medicamentosStockMinimo: Medicamento[];
  medicamentosProximosVencer: Medicamento[];
  medicamentosVencidos: Medicamento[];
  existenciasActuales: ItemExistenciaValorizada[];
  totalMovimientosPeriodo: number;
  totalUnidadesEntradaPeriodo: number;
  totalUnidadesSalidaPeriodo: number;
  movimientosInventario: ItemMovimientoKardex[];
}

export interface ItemGestionMedicaAgrupado {
  id?: number;
  nombre: string;
  subcategoria?: string;
  totalCitas: number;
  citasAtendidas: number;
  citasPendientes: number;
  citasCanceladas: number;
  porcentajeCumplimiento: number;
}

export interface ItemMascotaAtendida {
  mascotaId: number;
  nombreMascota: string;
  raza: string;
  edad: number;
  propietario: string;
  documentoPropietario: string;
  telefonoPropietario: string;
  consultasAtendidas: number;
  ultimaFechaAtencion: string;
  ultimoVeterinario: string;
  ultimoMotivo: string;
}

export interface ReporteGestionMedicaRS {
  fechaGeneracion?: string;
  rangoFechas?: string;
  totalCitasPeriodo: number;
  citasAtendidas: number;
  citasCanceladas: number;
  citasPendientesTotal: number;
  citasEstadoPendiente: number;
  citasEstadoProgramada: number;
  citasEstadoConfirmada: number;
  totalMascotasAtendidas: number;
  consultasPorVeterinario: ItemGestionMedicaAgrupado[];
  consultasPorEspecialidad: ItemGestionMedicaAgrupado[];
  mascotasAtendidasPeriodo: ItemMascotaAtendida[];
}
