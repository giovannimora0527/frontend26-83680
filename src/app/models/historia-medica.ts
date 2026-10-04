import { Mascota } from './mascota';

export class HistoriaMedica {
  id?: number;
  pacienteId?: number;
  fechaCreacion?: Date | string;
  paciente?: Mascota;
}
