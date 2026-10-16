import { Medico } from './medico';

export class AnotacionHistoria {
  id?: number;
  fecha?: Date | string;
  descripcion?: string;
  observacion?: string;
  diagnostico?: string;
  medico?: Medico;
}
