export class Usuario {
  id?: number;
  username?: string;
  password?: string;
  rol?: string;
  perfilId?: number;
  email?: string;
  fechaCreacion?: Date;
  activo?: boolean;
  medicoId?: number | null;
}
