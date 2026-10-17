/** Modelos de los contratos JSON de la API de la clínica. */
export interface ClienteApi { id: number; nombres: string; apellidos: string; nombreCompleto: string; tipoDocumento: string; numeroDocumento: string; telefono: string | null; activo: boolean; }
export interface MascotaApi { id: number; nombre: string; edad: number; clienteId: number; clienteNombre: string; especie: string | null; }
export interface MedicoApi { id: number; nombres: string; apellidos: string; nombreCompleto: string; registroProfesional: string; }
export interface MedicamentoApi { id: number; nombre: string; descripcion: string | null; presentacion: string | null; fechaVence: string | null; }
export interface CitaApi { id: number; clienteId: number; clienteNombre: string; mascotaId: number; mascotaNombre: string; medicoId: number; medicoNombre: string; fechaHora: string; estado: string; motivo: string | null; }
export interface CitaRequestApi { clienteId: number; mascotaId: number; medicoId: number; fechaHora: string; estado: string; motivo: string | null; }
export interface FormulaApi { id: number; citaId: number; mascotaId: number | null; clienteId: number | null; clienteNombre: string | null; mascotaNombre: string | null; medicoId: number | null; medicoNombre: string | null; medicamentoId: number; medicamentoNombre: string | null; dosis: string; frecuencia: string; duracionTratamiento: string; indicaciones: string | null; fechaEmision: string; fechaCreacionRegistro: string; fechaActualizacionRegistro: string | null; activo: boolean; fechaCita: string | null; }
export interface FormulaRequestApi { citaId: number; medicamentoId: number; fechaEmision: string; dosis: string; frecuencia: string; duracionTratamiento: string; indicaciones: string | null; }
export interface HistoriaApi { id: number; clienteId: number; clienteNombre: string; mascotaId: number; mascotaNombre: string; citaId: number | null; medicoId: number | null; medicoNombre: string | null; fechaHora: string | null; fechaCreacion: string | null; motivoConsulta: string | null; diagnostico: string | null; observaciones: string | null; }
export interface HistoriaRequestApi { clienteId: number; mascotaId: number; citaId: number; medicoId: number; motivoConsulta: string; diagnostico: string; observaciones: string | null; }
export interface AnotacionApi { id: number; historiaId: number; medicoId: number; medicoNombre: string | null; fecha: string; descripcion: string; observacion: string | null; diagnostico: string | null; }
export interface AnotacionRequestApi { historiaId: number; medicoId: number; fecha: string; descripcion: string; observacion: string | null; diagnostico: string | null; }
export interface ErrorApi { status?: number; message?: string; error?: string; }
