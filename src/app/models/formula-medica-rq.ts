/**
 * Datos que se envían al backend para crear o actualizar una fórmula médica.
 */
export class FormulaMedicaRq {
  formulaId?: number;
  mascotaId?: number;
  citaId?: number;
  medicoId?: number;
  medicamentoId?: number;
  fechaEmision?: string;
  dosis?: string;
  frecuencia?: string;
  duracionDias?: number;
  indicaciones?: string;
}
