import { Cita } from './cita';
import { HistoriaMedica } from './historia-medica';
import { FormulaMedica } from './formula-medica';
import { Lote } from './inventario';

/** Especialidad veterinaria. */
export interface Especialidad {
  id?: number;
  nombre: string;
  descripcion?: string;
  codigoEspecializacion: string;
  activo?: boolean;
}

/** Tarifa de un servicio. */
export interface Tarifa {
  id?: number;
  codigo: string;
  nombre: string;
  tipo: string;
  especializacion?: Especialidad | null;
  especializacionId?: number | null;
  valor: number;
  ivaPorcentaje: number;
  activo?: boolean;
  fechaModificacion?: string;
}

/** Cambio registrado en una tarifa. */
export interface TarifaLog {
  id: number;
  accion: string;
  valorAnterior?: number;
  valorNuevo?: number;
  ivaAnterior?: number;
  ivaNuevo?: number;
  usuario?: string;
  fecha: string;
}

/** Horario de disponibilidad de un medico. */
export interface Horario {
  id?: number;
  medicoId?: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo?: boolean;
}

/** Medicamento formulado en la atencion. */
export interface MedicamentoFormulado {
  medicamentoId: number | null;
  dosis: string;
  frecuencia: string;
  duracionDias: number | null;
  cantidad: number | null;
  viaAdministracion: string;
  indicaciones?: string;
}

/** Datos de la atencion. */
export interface AtencionRq {
  citaId: number;
  tarifaId: number;
  motivo: string;
  sintomas: string;
  diagnostico: string;
  observaciones?: string;
  recomendaciones?: string;
  indicacionesFormula?: string;
  medicamentos: MedicamentoFormulado[];
}

/** Informacion para atender una cita. */
export interface AtencionInfo {
  cita: Cita;
  especialidad?: string;
  antecedentes: HistoriaMedica[];
  servicios: Tarifa[];
  historia?: HistoriaMedica;
  formula?: FormulaMedica;
}

/** Resultado de la atencion. */
export interface AtencionRs {
  message: string;
  historiaId: number;
  formulaId?: number;
  advertencias: string[];
}

/** Lote elegido en el despacho. */
export interface LoteCantidad {
  loteId: number;
  cantidad: number;
}

/** Medicamento de la formula en el despacho. */
export interface DespachoItem {
  formulaDetalleId: number;
  medicamentoId: number;
  medicamentoCodigo: string;
  medicamentoNombre: string;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  viaAdministracion: string;
  indicaciones?: string;
  cantidadPrescrita: number;
  cantidadEntregada: number;
  cantidadPendiente: number;
  stockDisponible: number;
  puedeEntregar: number;
  lotesVigentes: Lote[];
  lotesVencidos: Lote[];
  sugerencia: LoteCantidad[];
  alerta?: string;
}

/** Despacho realizado. */
export interface Despacho {
  id: number;
  formulaId: number;
  fecha: string;
  usuario: string;
  estado: string;
  observacion?: string;
  mascota: string;
  propietario: string;
  medico: string;
  estadoFormula: string;
  usuarioReversion?: string;
  fechaReversion?: string;
  motivoReversion?: string;
  lineas: { medicamento: string; numeroLote: string; fechaVence?: string; cantidad: number }[];
}

/** Formula vista desde el despacho. */
export interface DespachoFormula {
  formula: FormulaMedica;
  items: DespachoItem[];
  despachos: Despacho[];
  log: { estadoAnterior?: string; estadoNuevo: string; usuario: string; fecha: string; observacion?: string }[];
}

/** Factura. */
export interface Factura {
  id?: number;
  numero?: string;
  citaId: number;
  fechaCita: string;
  clienteId: number;
  clienteNombre: string;
  clienteDocumento: string;
  mascotaId: number;
  mascotaNombre: string;
  mascotaEspecie?: string;
  medicoNombre: string;
  especialidad?: string;
  fecha: string;
  subtotal: number;
  iva: number;
  descuento: number;
  total: number;
  totalPagado: number;
  saldo: number;
  estado: string;
  usuario?: string;
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  lineas: { tipo: string; descripcion: string; cantidad: number; precioUnitario: number; ivaPorcentaje: number;
    subtotal: number; ivaValor: number; total: number }[];
  pagos: { id: number; valor: number; metodo: string; referencia?: string; fecha: string; usuario: string }[];
  log: { accion: string; detalle: string; usuario: string; fecha: string }[];
}

/** Reporte generado. */
export interface Reporte {
  tipo: string;
  titulo: string;
  subtitulo: string;
  columnas: string[];
  filas: (string | number)[][];
  totales: (string | number)[];
}

/** Tipo de reporte. */
export interface TipoReporte {
  codigo: string;
  nombre: string;
  categoria: string;
}

/** Usuario del sistema. */
export interface UsuarioSistema {
  id?: number;
  username: string;
  email: string;
  perfilId: number;
  perfilNombre?: string;
  activo?: boolean;
  fechaCreacion?: string;
  medicoId?: number | null;
  medicoNombre?: string;
  password?: string;
}

/** Perfil. */
export interface Perfil {
  perfilId: number;
  nombre: string;
}
