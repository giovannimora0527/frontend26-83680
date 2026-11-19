import { Cliente } from './cliente';
import { Mascota } from './mascota';
import { Medico } from './medico';

export class Cita {
  id?: number;
  fechaHora?: Date | string;
  fechaHoraFin?: Date | string;
  estado?: string;
  motivo?: string;
  fechaActualizacion?: Date | string;
  historialCambios?: string;
  cliente?: Cliente;
  mascota?: Mascota;
  medico?: Medico;
}
