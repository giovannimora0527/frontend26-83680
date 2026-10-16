/**
 * Cliente (dueño de las mascotas).
 */
export class Cliente {
   clienteId?: number;
   tipoDocumento?: string;
   numeroDocumento?: string;
   nombres?: string;
   apellidos?: string;
   /** Fecha de nacimiento yyyy-MM-dd */
   fechaNacimiento?: string;
   /** M, F u O */
   genero?: string;
   telefono?: string;
   direccion?: string;
   activo?: boolean;
}
