/** Respuesta estándar del backend en las operaciones de escritura. */
export interface RespuestaApi {
  /** Código HTTP informado en el cuerpo. */
  status: number;
  /** Mensaje para el usuario. */
  message: string;
}
