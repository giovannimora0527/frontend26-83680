/** Tipos de documento de identidad aceptados para un cliente. */
export const TIPOS_DOCUMENTO: { codigo: string; nombre: string }[] = [
  { codigo: 'CC', nombre: 'Cédula de ciudadanía' },
  { codigo: 'CE', nombre: 'Cédula de extranjería' },
  { codigo: 'TI', nombre: 'Tarjeta de identidad' },
  { codigo: 'PA', nombre: 'Pasaporte' },
  { codigo: 'NIT', nombre: 'NIT' }
];

/** Opciones de género (opcional) del cliente. */
export const GENEROS: { codigo: string; nombre: string }[] = [
  { codigo: 'M', nombre: 'Masculino' },
  { codigo: 'F', nombre: 'Femenino' },
  { codigo: 'O', nombre: 'Otro' }
];

/** Cliente (dueño de mascotas) tal como lo devuelve el backend. */
export interface Cliente {
  /** Identificador del cliente. */
  clienteId: number;
  /** Usuario del sistema asociado, si tiene. */
  usuarioId?: number | null;
  /** Tipo de documento (CC, CE, TI, PA, NIT). */
  tipoDocumento: string;
  /** Número de documento. */
  numeroDocumento: string;
  /** Nombres. */
  nombres: string;
  /** Apellidos. */
  apellidos: string;
  /** Fecha de nacimiento (yyyy-MM-dd). */
  fechaNacimiento: string;
  /** Género: M, F u O (opcional). */
  genero?: string | null;
  /** Teléfono de contacto. */
  telefono: string;
  /** Dirección de residencia. */
  direccion?: string | null;
  /** Indica si el cliente está activo. */
  activo: boolean;
}

/** Datos que se envían al backend para crear o editar un cliente. */
export interface ClienteRq {
  /** Tipo de documento. */
  tipoDocumento: string;
  /** Número de documento (único por tipo). */
  numeroDocumento: string;
  /** Nombres. */
  nombres: string;
  /** Apellidos. */
  apellidos: string;
  /** Fecha de nacimiento (yyyy-MM-dd). */
  fechaNacimiento: string;
  /** Género (vacío si no se indica). */
  genero: string | null;
  /** Teléfono. */
  telefono: string;
  /** Dirección. */
  direccion: string;
}
