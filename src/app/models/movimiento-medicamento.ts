/**
 * Representa un movimiento de entrada o salida de inventario asociado a un medicamento o fórmula médica.
 */
export class MovimientoMedicamento {
  id?: number;
  medicamentoId?: number;
  tipo?: string;
  cantidad?: number;
  motivo?: string;
  referenciaTipo?: string;
  referenciaId?: number;
  usuarioRegistro?: string;
  codigoLote?: string;
  fechaRegistro?: Date | string;
  observacion?: string;
}
