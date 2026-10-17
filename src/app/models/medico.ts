import { Especializacion } from './especializacion';

/** Tipos de documento aceptados para un veterinario. */
export const TIPOS_DOCUMENTO_MEDICO: { codigo: string; nombre: string }[] = [
  { codigo: 'CC', nombre: 'Cédula de ciudadanía' },
  { codigo: 'CE', nombre: 'Cédula de extranjería' },
  { codigo: 'PA', nombre: 'Pasaporte' }
];

/** Veterinario tal como lo devuelve el backend. */
export interface Medico {
  /** Identificador del veterinario. */
  id: number;
  /** Tipo de documento (CC, CE o PA). */
  tipoDocumento: string;
  /** Número de documento. */
  numeroDocumento: string;
  /** Nombres. */
  nombres: string;
  /** Apellidos. */
  apellidos: string;
  /** Teléfono de contacto (opcional). */
  telefono: string | null;
  /** Número de registro profesional (único). */
  registroProfesional: string;
  /** Especialización del veterinario. */
  especializacion: Especializacion;
}

/** Datos que se envían al backend para crear o editar un veterinario. */
export interface MedicoRq {
  /** Tipo de documento. */
  tipoDocumento: string;
  /** Número de documento. */
  numeroDocumento: string;
  /** Nombres. */
  nombres: string;
  /** Apellidos. */
  apellidos: string;
  /** Teléfono (vacío si no se indica). */
  telefono: string;
  /** Registro profesional. */
  registroProfesional: string;
  /** Especialización elegida. */
  especializacionId: number;
}
