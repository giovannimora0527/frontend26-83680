import { Cita } from './cita';
import { HistoriaClinica } from './historia-clinica';
import { Mascota } from './mascota';
import { Medico } from './medico';
import { Medicamento } from './medicamento';

export interface FormulaMedica {
  id?: number;
  cita?: Cita;
  historia?: HistoriaClinica;
  mascota?: Mascota;
  medico?: Medico;
  medicamento?: Medicamento;
  dosis?: string;
  frecuencia?: string;
  duracionDias?: number;
  indicaciones?: string;
  fechaEmision?: string;
  activo?: boolean;
  fechaCreacionRegistro?: string;
  fechaActualizacionRegistro?: string;
}
