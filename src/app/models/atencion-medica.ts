import { Cita } from './cita';

export interface AtencionMedica {
  id?: number;
  cita?: Cita;
  motivoConsulta?: string;
  sintomas?: string;
  diagnostico?: string;
  observaciones?: string;
  recomendaciones?: string;
  estado?: string;
  fechaAtencion?: string;
}
