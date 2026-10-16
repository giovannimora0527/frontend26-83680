/**
 * Datos que se envían al backend para crear o actualizar una cita.
 */
export class CitaRq {
  citaId?: number;
  clienteId?: number;
  mascotaId?: number;
  medicoId?: number;
  fechaHora?: string;
  estado?: string;
  motivo?: string;
}
