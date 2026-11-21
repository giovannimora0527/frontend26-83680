/**
 * Orden y paginación en el navegador para las tablas de listado.
 *
 * Uso en un componente:
 *   tabla = new Tabla<Cliente>({ nombre: c => c.nombres + ' ' + c.apellidos, documento: c => c.numeroDocumento });
 * y en la plantilla:
 *   @for (c of tabla.ver(filtrados()); track c.id) { ... }
 *   <app-paginador [tabla]="tabla" />
 *
 * El resultado se guarda mientras la lista de entrada y el estado (página, orden, tamaño) no cambien,
 * así la detección de cambios de Angular no vuelve a ordenar en cada ciclo.
 */
export type Accesor<T> = (fila: T) => unknown;

const COMPARADOR = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

export class Tabla<T> {
  readonly tamanos = [10, 25, 50, 100];
  pagina = 1;
  tamano: number;
  campo: string | null;
  ascendente: boolean;
  total = 0;

  private entrada: T[] = [];
  private salida: T[] = [];
  private firma = '';

  constructor(private accesores: Record<string, Accesor<T>> = {},
              opciones: { tamano?: number; campo?: string; ascendente?: boolean } = {}) {
    this.tamano = opciones.tamano ?? 10;
    this.campo = opciones.campo ?? null;
    this.ascendente = opciones.ascendente ?? true;
  }

  get paginas(): number {
    return Math.max(1, Math.ceil(this.total / this.tamano));
  }

  get desde(): number {
    return this.total === 0 ? 0 : (this.pagina - 1) * this.tamano + 1;
  }

  get hasta(): number {
    return Math.min(this.pagina * this.tamano, this.total);
  }

  /** Devuelve la página visible de la lista, ordenada según la columna elegida. */
  ver(lista: T[]): T[] {
    const firma = `${this.campo}|${this.ascendente}|${this.pagina}|${this.tamano}`;
    if (firma === this.firma && mismaLista(lista, this.entrada)) {
      return this.salida;
    }
    this.total = lista.length;
    if (this.pagina > this.paginas) {
      this.pagina = this.paginas;
    }
    // Sin accesor definido se usa la propiedad (o la posición, si la fila es un arreglo) con ese nombre.
    const campo = this.campo;
    const acc = campo ? (this.accesores[campo] ?? ((f: T) => (f as any)?.[campo])) : undefined;
    const ordenada = acc ? [...lista].sort((a, b) => this.comparar(acc(a), acc(b))) : lista;
    const inicio = (this.pagina - 1) * this.tamano;
    this.entrada = lista.slice();
    this.salida = ordenada.slice(inicio, inicio + this.tamano);
    this.firma = `${this.campo}|${this.ascendente}|${this.pagina}|${this.tamano}`;
    return this.salida;
  }

  /** Primer clic: ascendente; segundo: descendente; tercero: quita el orden. */
  ordenar(campo: string): void {
    if (this.campo !== campo) {
      this.campo = campo;
      this.ascendente = true;
    } else if (this.ascendente) {
      this.ascendente = false;
    } else {
      this.campo = null;
      this.ascendente = true;
    }
    this.pagina = 1;
  }

  icono(campo: string): string {
    if (this.campo !== campo) { return 'bi bi-arrow-down-up text-muted opacity-50'; }
    return this.ascendente ? 'bi bi-sort-up' : 'bi bi-sort-down';
  }

  aria(campo: string): 'ascending' | 'descending' | 'none' {
    if (this.campo !== campo) { return 'none'; }
    return this.ascendente ? 'ascending' : 'descending';
  }

  irA(pagina: number): void {
    this.pagina = Math.min(Math.max(1, pagina), this.paginas);
  }

  cambiarTamano(tamano: number): void {
    this.tamano = Number(tamano);
    this.pagina = 1;
  }

  /** Para llamar cuando cambia un filtro: vuelve a la primera página. */
  reiniciar(): void {
    this.pagina = 1;
  }

  /** Los vacíos siempre quedan al final, sin importar la dirección. */
  private comparar(a: unknown, b: unknown): number {
    const va = a === null || a === undefined || a === '';
    const vb = b === null || b === undefined || b === '';
    if (va || vb) { return va === vb ? 0 : va ? 1 : -1; }
    let r: number;
    if (typeof a === 'number' && typeof b === 'number') {
      r = a - b;
    } else if (typeof a === 'boolean' && typeof b === 'boolean') {
      r = Number(a) - Number(b);
    } else {
      r = COMPARADOR.compare(String(a), String(b));
    }
    return this.ascendente ? r : -r;
  }
}

function mismaLista<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) { return false; }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) { return false; }
  }
  return true;
}
