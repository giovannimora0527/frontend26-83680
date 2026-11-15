import { DireccionOrden } from 'src/app/utils/orden-tabla';

/** Estados de la fórmula según el veterinario. Una fórmula no se borra: se anula. */
export type EstadoFormula = 'BORRADOR' | 'CONFIRMADA' | 'ANULADA';

/** Estados del despacho de una fórmula confirmada. */
export type EstadoDespacho =
  | 'PENDIENTE_DESPACHO'
  | 'EN_PREPARACION'
  | 'DESPACHO_PARCIAL'
  | 'DESPACHADO'
  | 'PENDIENTE_DISPONIBILIDAD'
  | 'CANCELADO';

/** Lista de estados de la fórmula, usada en el filtro del listado. */
export const ESTADOS_FORMULA: EstadoFormula[] = ['BORRADOR', 'CONFIRMADA', 'ANULADA'];

/** Estados del despacho con su texto para la interfaz. */
export const ESTADOS_DESPACHO: { valor: EstadoDespacho; texto: string }[] = [
  { valor: 'PENDIENTE_DESPACHO', texto: 'Pendiente de despacho' },
  { valor: 'EN_PREPARACION', texto: 'En preparación' },
  { valor: 'DESPACHO_PARCIAL', texto: 'Despacho parcial' },
  { valor: 'DESPACHADO', texto: 'Despachado' },
  { valor: 'PENDIENTE_DISPONIBILIDAD', texto: 'Pendiente por disponibilidad' },
  { valor: 'CANCELADO', texto: 'Cancelado' }
];

/** Unidades en las que se puede expresar la dosis (deben coincidir con el backend). */
export const UNIDADES_DOSIS: string[] = ['mg', 'g', 'ml', 'gotas', 'tableta', 'cápsula', 'UI', 'aplicación'];

/** Unidades que se cuentan por pieza, en las que se puede sugerir la cantidad total. */
export const UNIDADES_CONTABLES: string[] = ['tableta', 'cápsula', 'aplicación'];

/** Vías de administración aceptadas. */
export const VIAS_ADMINISTRACION: { valor: string; texto: string }[] = [
  { valor: 'ORAL', texto: 'Oral' },
  { valor: 'TOPICA', texto: 'Tópica' },
  { valor: 'OFTALMICA', texto: 'Oftálmica' },
  { valor: 'OTICA', texto: 'Ótica' },
  { valor: 'SUBCUTANEA', texto: 'Subcutánea' },
  { valor: 'INTRAMUSCULAR', texto: 'Intramuscular' },
  { valor: 'INTRAVENOSA', texto: 'Intravenosa' },
  { valor: 'INHALADA', texto: 'Inhalada' },
  { valor: 'RECTAL', texto: 'Rectal' }
];

/** Límites de los valores numéricos; deben coincidir con los que valida el backend. */
export const LIMITES_FORMULA = {
  /** Dosis máxima por toma. */
  dosisMaxima: 10000,
  /** Mínimo de horas entre tomas. */
  frecuenciaMinima: 1,
  /** Máximo de horas entre tomas. */
  frecuenciaMaxima: 168,
  /** Mínimo de días de tratamiento. */
  duracionMinima: 1,
  /** Máximo de días de tratamiento. */
  duracionMaxima: 365,
  /** Cantidad máxima a dispensar por medicamento. */
  cantidadMaxima: 10000,
  /** Máximo de medicamentos por fórmula. */
  maximoLineas: 20
} as const;

/** Texto legible de un estado de despacho. */
export function textoEstadoDespacho(estado: string | null | undefined): string {
  return ESTADOS_DESPACHO.find((e) => e.valor === estado)?.texto ?? (estado || '—');
}

/** Clase de Bootstrap para la etiqueta de un estado de despacho. */
export function claseEstadoDespacho(estado: string | null | undefined): string {
  switch (estado) {
    case 'DESPACHADO':
      return 'bg-success';
    case 'DESPACHO_PARCIAL':
      return 'bg-info text-dark';
    case 'EN_PREPARACION':
      return 'bg-primary';
    case 'PENDIENTE_DISPONIBILIDAD':
      return 'bg-warning text-dark';
    case 'CANCELADO':
      return 'bg-secondary';
    default:
      return 'bg-light text-dark border';
  }
}

/** Línea (medicamento) de una fórmula. */
export interface FormulaDetalle {
  /** Identificador de la línea. */
  detalleId: number;
  /** Medicamento formulado. */
  medicamentoId: number;
  /** Código del medicamento. */
  medicamentoCodigo: string;
  /** Nombre del medicamento. */
  medicamentoNombre: string;
  /** Presentación del medicamento. */
  presentacion: string | null;
  /** Cantidad por toma. */
  dosis: number;
  /** Unidad de la dosis. */
  unidadDosis: string;
  /** Horas entre tomas. */
  frecuenciaHoras: number;
  /** Días de tratamiento. */
  duracionDias: number;
  /** Vía de administración. */
  viaAdministracion: string;
  /** Indicaciones especiales. */
  indicaciones: string;
  /** Unidades a dispensar. */
  cantidadPrescrita: number;
  /** Unidades ya entregadas por despacho. */
  cantidadEntregada: number;
  /** Unidades pendientes por entregar. */
  cantidadPendiente: number;
  /** Existencias vigentes del medicamento. */
  disponible: number;
}

/** Cambio de estado registrado en el historial de la fórmula. */
export interface EstadoHistorial {
  /** Fecha y hora del cambio. */
  fecha: string;
  /** Estado anterior (vacío al crear). */
  estadoAnterior: string | null;
  /** Estado nuevo. */
  estadoNuevo: string;
  /** Usuario que hizo el cambio. */
  usuario: string;
  /** Observación o motivo. */
  observacion: string | null;
}

/** Línea de una entrega: medicamento, lote y cantidad. */
export interface DespachoDetalle {
  /** Nombre del medicamento. */
  medicamentoNombre: string;
  /** Código del medicamento. */
  medicamentoCodigo: string;
  /** Lote del que salió. */
  numeroLote: string;
  /** Vencimiento del lote. */
  fechaVencimiento: string | null;
  /** Unidades entregadas. */
  cantidad: number;
}

/** Entrega de medicamentos registrada por despacho. */
export interface Despacho {
  /** Número de la entrega. */
  despachoId: number;
  /** Fórmula a la que pertenece. */
  formulaId: number;
  /** Fecha y hora de la entrega. */
  fecha: string;
  /** Usuario que entregó. */
  usuario: string;
  /** CONFIRMADO o REVERTIDO. */
  estado: 'CONFIRMADO' | 'REVERTIDO';
  /** Estado de despacho de la fórmula. */
  estadoDespachoFormula: string;
  /** Observación de la entrega. */
  observacion: string | null;
  /** Mascota. */
  mascotaNombre: string;
  /** Propietario. */
  clienteNombre: string;
  /** Veterinario. */
  medicoNombre: string;
  /** Usuario que revirtió. */
  usuarioReversion: string | null;
  /** Fecha de la reversión. */
  fechaReversion: string | null;
  /** Motivo de la reversión. */
  motivoReversion: string | null;
  /** Medicamentos entregados. */
  detalles: DespachoDetalle[];
}

/** Fórmula médica tal como la devuelve el backend. */
export interface Formula {
  /** Número de la fórmula. */
  formulaId: number;
  /** Fecha de emisión (yyyy-MM-dd). */
  fechaEmision: string;
  /** Historia clínica (consulta) que originó la fórmula. */
  historiaId: number;
  /** Fecha de la consulta (yyyy-MM-dd). */
  historiaFecha: string;
  /** Cliente dueño de la mascota. */
  clienteId: number;
  /** Nombre del cliente. */
  clienteNombre: string;
  /** Mascota. */
  mascotaId: number;
  /** Nombre de la mascota. */
  mascotaNombre: string;
  /** Veterinario que formula. */
  medicoId: number;
  /** Nombre del veterinario. */
  medicoNombre: string;
  /** Observaciones generales. */
  observaciones: string | null;
  /** Estado de la fórmula. */
  estado: EstadoFormula;
  /** Estado del despacho (vacío mientras es borrador). */
  estadoDespacho: EstadoDespacho | null;
  /** Cantidad de medicamentos. */
  totalMedicamentos: number;
  /** Nombres de los medicamentos, separados por coma. */
  medicamentosResumen: string;
  /** Fecha y hora de confirmación. */
  fechaConfirmacion: string | null;
  /** Fecha y hora de registro. */
  fechaCreacion: string;
  /** Fecha y hora de la última modificación. */
  fechaModificacion?: string | null;
  /** Medicamentos (solo en el detalle). */
  detalles?: FormulaDetalle[];
  /** Historial de estados (solo en el detalle). */
  historial?: EstadoHistorial[];
  /** Entregas (solo en el detalle). */
  despachos?: Despacho[];
}

/** Medicamento que se envía al crear o editar una fórmula. */
export interface FormulaDetalleRq {
  /** Medicamento. */
  medicamentoId: number;
  /** Cantidad por toma. */
  dosis: number;
  /** Unidad de la dosis. */
  unidadDosis: string;
  /** Horas entre tomas. */
  frecuenciaHoras: number;
  /** Días de tratamiento. */
  duracionDias: number;
  /** Unidades a dispensar. */
  cantidadPrescrita: number;
  /** Vía de administración. */
  viaAdministracion: string;
  /** Indicaciones especiales. */
  indicaciones: string;
}

/**
 * Datos que se envían para crear o editar una fórmula. El veterinario se toma
 * de la sesión; mascota e historia solo se envían al crear.
 */
export interface FormulaRq {
  /** Mascota (solo al crear). */
  mascotaId?: number;
  /** Historia clínica de la mascota (solo al crear). */
  historiaId?: number;
  /** Fecha de emisión (yyyy-MM-dd). */
  fechaEmision: string;
  /** Observaciones generales. */
  observaciones: string;
  /** Medicamentos formulados. */
  detalles: FormulaDetalleRq[];
  /** true para confirmar y enviar a despacho; false para dejarla en borrador. */
  confirmar: boolean;
}

/** Parámetros del listado de fórmulas. */
export interface FiltroFormulas {
  /** Página (empieza en 0). */
  page: number;
  /** Registros por página. */
  size: number;
  /** Columna de orden. */
  orden: string;
  /** Dirección del orden. */
  direccion: DireccionOrden;
  /** Texto libre. */
  texto: string;
  /** Estado de la fórmula. */
  estado: string;
  /** Estado del despacho. */
  estadoDespacho: string;
  /** Veterinario. */
  medicoId: number | null;
  /** Medicamento. */
  medicamentoId: number | null;
  /** Fecha de emisión inicial. */
  desde: string;
  /** Fecha de emisión final. */
  hasta: string;
}
