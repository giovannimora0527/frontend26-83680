import { Medico } from './medico';

export class AnotacionHistoria {
  id?: number;
  historiaId?: number;
  medicoId?: number;
  fecha?: Date | string;
  descripcion?: string;
  medico?: Medico;
}
