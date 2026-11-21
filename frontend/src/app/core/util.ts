/** Utilidades de fechas, búsqueda y presentación. */
export function hoyISO(): string {
  return fechaISO(new Date());
}

export function fechaISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Fecha-hora local sin zona (formato que espera LocalDateTime en el backend). */
export function fechaHoraLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${fechaISO(d)}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(fecha + 'T00:00:00');
  d.setDate(d.getDate() + dias);
  return fechaISO(d);
}

export function primerDiaMes(): string {
  const d = new Date();
  return fechaISO(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** Minúsculas y sin tildes ni diéresis: "Andrés" y "andres" quedan iguales. */
export function normalizarTexto(v: unknown): string {
  return String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Búsqueda libre: cada palabra escrita debe aparecer en alguno de los valores.
 * Ignora mayúsculas y tildes, así "maria lopez" encuentra "María López".
 */
export function contiene(texto: string, valores: unknown[]): boolean {
  const t = normalizarTexto(texto);
  if (!t) { return true; }
  const fuente = valores.filter(v => v !== null && v !== undefined).map(normalizarTexto).join(' | ');
  return t.split(/\s+/).every(palabra => fuente.includes(palabra));
}

export const DIAS_SEMANA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const COLORES_CITA: Record<string, string> = {
  PENDIENTE: '#f0ad4e', PROGRAMADA: '#5bc0de', CONFIRMADA: '#0d6efd',
  EN_ATENCION: '#6f42c1', ATENDIDA: '#198754', CANCELADA: '#dc3545'
};

export const CLASE_ESTADO: Record<string, string> = {
  PENDIENTE: 'bg-warning text-dark', PROGRAMADA: 'bg-info text-dark', CONFIRMADA: 'bg-primary',
  EN_ATENCION: 'bg-purple', ATENDIDA: 'bg-success', CANCELADA: 'bg-danger',
  PAGADA: 'bg-success', PAGO_PARCIAL: 'bg-warning text-dark', ANULADA: 'bg-secondary',
  BORRADOR: 'bg-secondary', CONFIRMADA_F: 'bg-primary',
  NO_APLICA: 'bg-light text-dark', PENDIENTE_DESPACHO: 'bg-warning text-dark', EN_PREPARACION: 'bg-info text-dark',
  DESPACHO_PARCIAL: 'bg-primary', DESPACHADO: 'bg-success', PENDIENTE_DISPONIBILIDAD: 'bg-danger', CANCELADO: 'bg-secondary',
  AGOTADO: 'bg-danger', BAJO_STOCK: 'bg-warning text-dark', NORMAL: 'bg-success',
  ABIERTA: 'bg-info text-dark', CERRADA: 'bg-secondary',
  PREVISUALIZADA: 'bg-info text-dark', VALIDO: 'bg-success', ERROR: 'bg-danger', IMPORTADO: 'bg-success', FALLIDO: 'bg-danger',
  ENTRADA: 'bg-success', SALIDA: 'bg-danger'
};

export function claseEstado(e: string | null | undefined): string {
  return CLASE_ESTADO[e ?? ''] ?? 'bg-secondary';
}

export function etiqueta(e: string | null | undefined): string {
  return (e ?? '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
}
