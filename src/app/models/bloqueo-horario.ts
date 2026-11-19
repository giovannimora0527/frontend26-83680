import { Medico } from './medico';

/**
 * Representa un bloqueo de horario en la agenda de un veterinario.
 */
export class BloqueoHorario {
  id?: number;
  medico?: Medico;
  medicoId?: number;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  motivo?: string;
  activo?: boolean;
  fechaCreacion?: string;
}
