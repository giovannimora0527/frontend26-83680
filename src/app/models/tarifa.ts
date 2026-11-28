import { Especializacion } from './especializacion';

export interface Tarifa {
  id?: number;
  nombre?: string;
  descripcion?: string;
  tipoServicio?: string;
  valor?: number;
  iva?: number;
  activa?: boolean;
  especializacion?: Especializacion;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface LogTarifa {
  id?: number;
  tarifa?: Tarifa;
  valorAnterior?: number;
  valorNuevo?: number;
  ivaAnterior?: number;
  ivaNuevo?: number;
  motivoCambio?: string;
  fechaCambio?: string;
}
