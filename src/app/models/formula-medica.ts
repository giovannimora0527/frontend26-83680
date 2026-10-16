/**
 * Fórmula médica (FormulaMedicaRs del backend y FormulaMedicaRq para enviar).
 */
export class FormulaMedica {
    id?: number;
    formulaId?: number;
    citaId?: number;
    citaFechaHora?: string;
    mascotaId?: number;
    mascotaNombre?: string;
    clienteId?: number;
    clienteNombre?: string;
    medicoId?: number;
    medicoNombre?: string;
    medicamentoId?: number;
    medicamentoNombre?: string;
    dosis?: string;
    frecuencia?: string;
    duracionDias?: number;
    indicaciones?: string;
    /** Fecha de emisión yyyy-MM-dd */
    fechaEmision?: string;
    activo?: boolean;
    fechaCreacionRegistro?: string;
    fechaActualizacionRegistro?: string;
}
