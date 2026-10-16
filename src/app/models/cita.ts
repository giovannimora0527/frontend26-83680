import { Cliente } from './cliente';
import { Mascota } from './mascota';
import { Medico } from './medico';

export class Cita {
  id?: number;
  fechaHora?: Date | string;
  estado?: string;
  motivo?: string;
  cliente?: Cliente;
  mascota?: Mascota;
  medico?: Medico;
}
