import { Cliente } from './cliente';
import { Mascota } from './mascota';
import { Medico } from './medico';
import { Cita } from './cita';

export interface HistoriaClinica {
  id?: number;
  mascota?: Mascota;
  cliente?: Cliente;
  cita?: Cita;
  medico?: Medico;
  fechaHora?: any;
  motivo?: string;
  diagnostico?: string;
  observaciones?: string;
  estado?: string;
  fechaCreacion?: string;
}
