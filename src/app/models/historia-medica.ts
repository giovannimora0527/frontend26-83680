/**
 * Historia clínica (una consulta de una mascota).
 */
export class HistoriaMedica {
    id?: number;
    historiaId?: number;
    clienteId?: number;
    clienteNombre?: string;
    mascotaId?: number;
    mascotaNombre?: string;
    citaId?: number;
    medicoId?: number;
    medicoNombre?: string;
    fechaHora?: string;
    motivo?: string;
    diagnostico?: string;
    observaciones?: string;
    /** Estado de la cita asociada. */
    estado?: string;
}
