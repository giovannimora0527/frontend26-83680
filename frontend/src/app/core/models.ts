/** Modelos compartidos con el backend (/clinica/v1). */
export interface Menu { menuId: number; code: string; title: string; url: string; icon: string; orden: number; activo?: boolean; }
export interface Usuario {
  usuarioId: number; username: string; nombreCompleto: string; email?: string;
  perfilId: number; perfilCodigo: string; perfilNombre: string; medicoId?: number; medicoNombre?: string;
  activo: boolean; ultimoAcceso?: string;
}
export interface Sesion { token: string; expiracion: string; usuario: Usuario; menus: Menu[]; }
export interface Respuesta { status: number; message: string; id?: number; }
export interface ApiError { status: number; error: string; message: string; }

export interface Cliente {
  id: number; tipoDocumento: string; numeroDocumento: string; nombres: string; apellidos: string;
  fechaNacimiento: string; genero?: string; telefono?: string; email?: string; direccion?: string; activo: boolean;
}
export interface Raza { razaId: number; nombre: string; especie: string; }
export interface Mascota {
  mascotaId: number; nombreMascota: string; edad?: number; sexo?: string; pesoKg?: number;
  cliente: Cliente; raza: Raza; activo: boolean; fechaRegistro?: string;
}
export interface Especializacion { id: number; codigoEspecializacion: string; nombre: string; descripcion: string; activo: boolean; }
export interface Medico {
  id: number; tipoDocumento: string; numeroDocumento: string; nombres: string; apellidos: string; telefono?: string;
  email?: string; registroProfesional: string; especializacion: Especializacion; estado: boolean;
}
export interface Horario { id?: number; medicoId?: number; diaSemana: number; horaInicio: string; horaFin: string; activo?: boolean; }
export interface Impuesto { id: number; codigo: string; nombre: string; tipo: string; porcentaje: number; activo: boolean; }
export interface Tarifa {
  id: number; codigo: string; nombre: string; descripcion?: string; tipoServicio: string;
  especializacion?: Especializacion; valor: number; impuesto: Impuesto; duracionMinutos: number; activo: boolean;
}
export interface EstadoCita { codigo: string; nombre: string; color: string; esFinal: boolean; orden: number; }
export interface Cita {
  id: number; cliente: Cliente; mascota: Mascota; medico: Medico; tarifa?: Tarifa;
  fechaHora: string; fechaHoraFin: string; estado: string; motivo: string; motivoCancelacion?: string;
}
export interface Medicamento {
  id: number; codigo: string; nombre: string; descripcion?: string; presentacion?: string; tipoProducto: string;
  requiereInvima: boolean; registroInvima?: string; unidadMedida: string; precioCompra: number; precioVenta: number;
  impuestoId: number; impuestoCodigo: string; impuestoPorcentaje: number; stockActual: number; stockMinimo: number;
  fechaCompra?: string; fechaIngreso?: string; fechaProximoPedido?: string; activo: boolean;
  stockVigente: number; stockVencido: number; estadoStock: string; vencimientoProximo?: string;
  diasParaVencer?: number; proximoAVencer: boolean; conLotesVencidos: boolean;
}
export interface Lote {
  id: number; numeroLote: string; fechaCompra: string; fechaIngreso: string; fechaVencimiento?: string;
  precioCompra: number; cantidadInicial: number; cantidadDisponible: number; activo: boolean;
  medicamento?: { id: number; nombre: string; codigo: string };
}
export interface ReporteData {
  codigo: string; titulo: string; subtitulo?: string; columnas: string[]; tipos: string[];
  filas: any[][]; totales?: any[]; generado: string; generadoPor?: string;
}
