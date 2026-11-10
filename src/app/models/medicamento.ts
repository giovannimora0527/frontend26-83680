export class Medicamento {
  id?: number;
  nombre?: string;
  descripcion?: string;
  presentacion?: string;
  codigo?: string;
  lote?: string;
  registroInvima?: string;
  requiereRegistroInvima?: boolean;
  precioCompra?: number;
  precioVenta?: number;
  cantidadDisponible?: number;
  stockMinimo?: number;
  fechaCompra?: Date | string;
  fechaIngresoInventario?: Date | string;
  fechaVence?: Date | string;
  fechaProximoPedido?: Date | string;
  activo?: boolean;
  fechaCreacionRegistro?: Date | string;
  fechaModificacionRegistro?: Date | string;
}
