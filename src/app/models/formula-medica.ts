import { Cita } from './cita';
import { Mascota } from './mascota';
import { Medicamento } from './medicamento';
import { Medico } from './medico';

export class FormulaMedica {
  id?: number;
  cita?: Cita;
  mascota?: Mascota;
  medico?: Medico;
  medicamento?: Medicamento;
  fechaEmision?: Date | string;
  cantidadSolicitada?: number;
  cantidadEntregada?: number;
  estado?: string;
  dosis?: string;
  frecuencia?: string;
  duracionDias?: number;
  indicaciones?: string;
  activo?: boolean;
  fechaDispenacion?: Date | string;
  fechaCreacionRegistro?: Date | string;
  fechaActualizacionRegistro?: Date | string;
}
