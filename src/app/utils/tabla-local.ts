import { DireccionOrden, OrdenTabla } from './orden-tabla';
import { normalizarTexto } from './texto';

/** Valor por el que se puede ordenar una columna. */
type ValorOrden = string | number | boolean | null | undefined;

/**
 * DataTable resuelto en el navegador para catálogos pequeños (clientes,
 * razas, especializaciones, usuarios): el backend entrega la lista completa
 * y aquí se filtra, ordena y pagina. Para módulos que crecen sin límite
 * (citas, historias, fórmulas) la paginación se hace en el backend.
 *
 * @typeParam T tipo de cada fila.
 */
export class TablaLocal<T> {
  /** Filas de la página actual, listas para pintar. */
  visibles: T[] = [];
  /** Total de filas que cumplen la búsqueda y los filtros. */
  totalRegistros = 0;
  /** Total de páginas. */
  totalPaginas = 0;
  /** Página actual (empieza en 0). */
  pagina = 0;
  /** Filas por página. */
  tamano = 10;
  /** Texto de búsqueda libre. */
  texto = '';
  /** Estado del ordenamiento. */
  readonly orden: OrdenTabla;

  /** Lista completa recibida del backend. */
  private datos: T[] = [];
  /** Filtro adicional de la pantalla (estado, rol, especie...). */
  private filtroExtra: (fila: T) => boolean = () => true;

  /**
   * @param columnas valor de cada columna ordenable, por nombre de columna.
   * @param textoBuscable texto de la fila en el que se busca.
   * @param columnaInicial columna del orden por defecto.
   * @param direccionInicial dirección del orden por defecto.
   */
  constructor(
    private readonly columnas: Record<string, (fila: T) => ValorOrden>,
    private readonly textoBuscable: (fila: T) => string,
    columnaInicial: string,
    direccionInicial: DireccionOrden = 'asc'
  ) {
    this.orden = new OrdenTabla(columnaInicial, direccionInicial);
  }

  /** Indica si la búsqueda está activa. */
  get hayBusqueda(): boolean {
    return !!this.texto.trim();
  }

  /**
   * Reemplaza los datos (por ejemplo, después de consultar el backend).
   *
   * @param datos lista completa.
   */
  cargar(datos: T[]): void {
    this.datos = datos ?? [];
    this.refrescar();
  }

  /**
   * Aplica un texto de búsqueda y vuelve a la primera página.
   *
   * @param texto texto escrito por el usuario.
   */
  buscar(texto: string): void {
    this.texto = texto ?? '';
    this.pagina = 0;
    this.refrescar();
  }

  /**
   * Define el filtro adicional de la pantalla y vuelve a la primera página.
   *
   * @param filtro función que decide si una fila se muestra.
   */
  filtrar(filtro: (fila: T) => boolean): void {
    this.filtroExtra = filtro;
    this.pagina = 0;
    this.refrescar();
  }

  /**
   * Ordena por una columna (o invierte la dirección si ya estaba ordenada por ella).
   *
   * @param columna nombre de la columna.
   */
  ordenar(columna: string): void {
    this.orden.alternar(columna);
    this.pagina = 0;
    this.refrescar();
  }

  /**
   * Cambia de página.
   *
   * @param pagina número de página (empieza en 0).
   */
  irA(pagina: number): void {
    this.pagina = pagina;
    this.refrescar();
  }

  /**
   * Cambia la cantidad de filas por página y vuelve a la primera.
   *
   * @param tamano nueva cantidad.
   */
  cambiarTamano(tamano: number): void {
    this.tamano = tamano;
    this.pagina = 0;
    this.refrescar();
  }

  /** Quita búsqueda y orden personalizados (el filtro extra lo limpia la pantalla). */
  reiniciar(): void {
    this.texto = '';
    this.orden.reiniciar();
    this.pagina = 0;
    this.refrescar();
  }

  /** Recalcula las filas visibles a partir de los datos, la búsqueda, el filtro y el orden. */
  private refrescar(): void {
    const termino = normalizarTexto(this.texto);
    const filas = this.datos.filter((fila) =>
      this.filtroExtra(fila) && (!termino || normalizarTexto(this.textoBuscable(fila)).includes(termino))
    );

    const valor = this.columnas[this.orden.columna];
    if (valor) {
      const sentido = this.orden.direccion === 'asc' ? 1 : -1;
      filas.sort((a, b) => sentido * this.comparar(valor(a), valor(b)));
    }

    this.totalRegistros = filas.length;
    this.totalPaginas = Math.ceil(filas.length / this.tamano);
    if (this.pagina > 0 && this.pagina >= this.totalPaginas) {
      this.pagina = Math.max(0, this.totalPaginas - 1);
    }
    const inicio = this.pagina * this.tamano;
    this.visibles = filas.slice(inicio, inicio + this.tamano);
  }

  /**
   * Compara dos valores de columna; los vacíos quedan al final.
   *
   * @param a primer valor.
   * @param b segundo valor.
   * @returns negativo, cero o positivo.
   */
  private comparar(a: ValorOrden, b: ValorOrden): number {
    const vacioA = a === null || a === undefined || a === '';
    const vacioB = b === null || b === undefined || b === '';
    if (vacioA || vacioB) {
      return vacioA === vacioB ? 0 : vacioA ? 1 : -1;
    }
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    return normalizarTexto(String(a)).localeCompare(normalizarTexto(String(b)), 'es');
  }
}
