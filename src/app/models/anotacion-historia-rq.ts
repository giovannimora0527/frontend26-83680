/**
 * Datos que se envían al backend para crear una anotación de historia médica.
 */
export class AnotacionHistoriaRq {
  anotacionHistoriaId?: number;
  historiaMedicaId?: number;
  medicoId?: number;
  descripcion?: string;
  observacion?: string;
  diagnostico?: string;
}
