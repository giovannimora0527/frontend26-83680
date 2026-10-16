import { Especializacion } from "./especializacion";

/**
 * Medico veterinario.
 */
export class Medico {
    id!: number;
    tipoDocumento!: string;
    numeroDocumento!: string;
    nombres!: string;
    apellidos!: string;
    telefono!: string;
    registroProfesional!: string;
    especializacion!: Especializacion;
}

/**
 * Datos que se envian al backend para crear o editar un medico (MedicoRq).
 */
export class MedicoRq {
    medicoId?: number;
    tipoDocumento?: string;
    numeroDocumento?: string;
    nombres?: string;
    apellidos?: string;
    telefono?: string;
    registroProfesional?: string;
    especializacionId?: number;
}
