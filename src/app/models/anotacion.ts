/**
 * Anotación de una historia clínica.
 */
export class Anotacion {
    id?: number;
    anotacionId?: number;
    historiaId?: number;
    medicoId?: number;
    medicoNombre?: string;
    fecha?: string;
    descripcion?: string;
    observacion?: string;
    diagnostico?: string;
}
