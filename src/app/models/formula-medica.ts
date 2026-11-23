/**
 * Medicamento de una formula.
 */
export interface FormulaDetalle {
    id: number;
    medicamentoId: number;
    medicamentoCodigo: string;
    medicamentoNombre: string;
    presentacion?: string;
    dosis: string;
    frecuencia: string;
    duracionDias: number;
    cantidad: number;
    viaAdministracion: string;
    indicaciones?: string;
    cantidadEntregada: number;
    stockDisponible?: number;
}

/**
 * Formula medica (cabecera y medicamentos). La crea el medico en la atencion.
 */
export class FormulaMedica {
    id?: number;
    citaId?: number;
    citaFechaHora?: string;
    historiaId?: number;
    mascotaId?: number;
    mascotaNombre?: string;
    mascotaEspecie?: string;
    clienteId?: number;
    clienteNombre?: string;
    clienteDocumento?: string;
    medicoId?: number;
    medicoNombre?: string;
    fechaEmision?: string;
    fechaCreacionRegistro?: string;
    indicaciones?: string;
    activo?: boolean;
    /** PENDIENTE_DESPACHO, EN_PREPARACION, DESPACHO_PARCIAL, DESPACHADO, PENDIENTE_DISPONIBILIDAD o CANCELADO. */
    estadoDespacho?: string;
    medicamentosResumen?: string;
    detalles?: FormulaDetalle[];
}
