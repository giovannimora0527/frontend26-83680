/** Reporte disponible para el perfil de la sesión. */
export interface ReporteDef {
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  /** Filtros que admite: fechas, agrupacion, medico, especialidad, medicamento, estadoFactura, estadoCita, dias. */
  filtros: string[];
}

/** Columna de un reporte. */
export interface ReporteColumna {
  clave: string;
  titulo: string;
  tipo: 'TEXTO' | 'ENTERO' | 'MONEDA' | 'PORCENTAJE' | 'FECHA' | 'FECHA_HORA';
}

/** Resultado de un reporte. */
export interface Reporte {
  codigo: string;
  titulo: string;
  categoria: string;
  filtrosAplicados: string;
  generado: string;
  usuario: string;
  columnas: ReporteColumna[];
  filas: Record<string, unknown>[];
  totales: Record<string, number>;
  resumen: Record<string, number | string>;
}

/** Filtros de un reporte. */
export interface FiltroReporte {
  desde: string;
  hasta: string;
  agrupacion: string;
  medicoId: number | null;
  especializacionId: number | null;
  medicamentoId: number | null;
  estado: string;
  dias: number | null;
}
