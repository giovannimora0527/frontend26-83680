export interface LoteMedicamento {
  id?: number;
  medicamentoId?: number;
  codigoLote: string;
  cantidadDisponible: number;
  precioCompra: number;
  fechaCompra: string;
  fechaIngreso: string;
  fechaVencimiento: string;
  activo?: boolean;
}
