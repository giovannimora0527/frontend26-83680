/**
 * Datos que se envían al backend para crear o actualizar una historia médica.
 */
export class HistoriaMedicaRq {
  historiaMedicaId?: number;
  clienteId?: number;
  mascotaId?: number;
  citaId?: number;
  medicoId?: number;
  fechaHora?: string;
  motivo?: string;
  diagnostico?: string;
  observaciones?: string;
  estado?: string;
}
