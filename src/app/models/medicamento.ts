export class Medicamento {
    id?: number;
    codigo?: string;
    nombre!: string;
    tipo!: string; // MEDICAMENTO | UTENSILIO
    descripcion?: string | null;
    presentacion?: string | null;
    registroInvima?: string | null;
    precioCompra?: number | null;
    precioVenta?: number | null;
    cantidadActual?: number;
    stockMinimo?: number;
    fechaCompra?: string;
    fechaVence?: string;
    fechaProximoPedido?: string | null;
    creadoPor?: string | null;
    fechaCreacionRegistro?: string;
    fechaModificacionRegistro?: string | null;
}
