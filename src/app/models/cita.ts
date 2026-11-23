/**
 * Cita médica tal como la devuelve el backend (CitaRs) y como se envía (CitaRq).
 */
export class Cita {
    id?: number;
    citaId?: number;
    clienteId?: number;
    clienteNombre?: string;
    mascotaId?: number;
    mascotaNombre?: string;
    medicoId?: number;
    medicoNombre?: string;
    /** Fecha y hora en formato ISO: 2026-10-20T08:30:00 */
    fechaHora?: string;
    /** Fecha y hora de fin. */
    fechaHoraFin?: string;
    estado?: string;
    motivo?: string;
    mascotaEspecie?: string;
    mascotaRaza?: string;
    mascotaEdad?: number;
    clienteTelefono?: string;
    clienteDocumento?: string;
    atendidaConHistoria?: boolean;
}
