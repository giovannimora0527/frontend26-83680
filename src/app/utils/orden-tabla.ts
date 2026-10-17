/** Dirección de ordenamiento de una columna. */
export type DireccionOrden = 'asc' | 'desc';

/**
 * Estado del ordenamiento de un DataTable. Recuerda la columna y la
 * dirección, y entrega el icono y el valor de accesibilidad de cada
 * encabezado, para no repetir esta lógica en cada pantalla.
 */
export class OrdenTabla {
  /** Columna por la que se ordena actualmente. */
  columna: string;
  /** Dirección actual del orden. */
  direccion: DireccionOrden;

  /**
   * @param columnaInicial columna del orden por defecto.
   * @param direccionInicial dirección del orden por defecto.
   */
  constructor(
    private readonly columnaInicial: string,
    private readonly direccionInicial: DireccionOrden = 'desc'
  ) {
    this.columna = columnaInicial;
    this.direccion = direccionInicial;
  }

  /**
   * Ordena por una columna; si ya estaba ordenada por ella, invierte la dirección.
   *
   * @param columna columna elegida por el usuario.
   */
  alternar(columna: string): void {
    if (this.columna === columna) {
      this.direccion = this.direccion === 'asc' ? 'desc' : 'asc';
    } else {
      this.columna = columna;
      this.direccion = 'asc';
    }
  }

  /** Vuelve al orden por defecto. */
  reiniciar(): void {
    this.columna = this.columnaInicial;
    this.direccion = this.direccionInicial;
  }

  /**
   * Icono de Font Awesome de la flecha de orden de una columna.
   *
   * @param columna columna de la tabla.
   * @returns clase del icono.
   */
  icono(columna: string): string {
    if (this.columna !== columna) {
      return 'fa-sort text-muted';
    }
    return this.direccion === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  /**
   * Valor de accesibilidad (aria-sort) de una columna.
   *
   * @param columna columna de la tabla.
   * @returns ascending, descending o none.
   */
  aria(columna: string): string {
    if (this.columna !== columna) {
      return 'none';
    }
    return this.direccion === 'asc' ? 'ascending' : 'descending';
  }
}
