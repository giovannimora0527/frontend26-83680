import { Cita } from './cita';
import { Cliente } from './cliente';
import { Mascota } from './mascota';
import { Medico } from './medico';

export class HistoriaMedica {
  id?: number;
  mascota?: Mascota;
  cliente?: Cliente;
  cita?: Cita;
  medico?: Medico;
  fechaHora?: Date | string;
  motivo?: string;
  diagnostico?: string;
  observaciones?: string;
  estado?: string;
  fechaCreacion?: Date | string;
}
