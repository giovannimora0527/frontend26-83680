import { Cliente } from "./cliente";
import { Raza } from "./raza";

export class Mascota {
    nombreMascota?: string;
    edad?: number;
    fechaRegistro?: Date;
    raza?: Raza;
    cliente?: Cliente;
}