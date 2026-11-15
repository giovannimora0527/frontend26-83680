import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Modal } from 'bootstrap';

import { DespachoService } from './service/despacho.service';
import { AuthService } from 'src/app/services/auth.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { EntregaRq, EstadoLote, LineaDespacho, PreparacionDespacho } from 'src/app/models/despacho';
import {
  Despacho,
  ESTADOS_DESPACHO,
  Formula,
  VIAS_ADMINISTRACION,
  claseEstadoDespacho,
  textoEstadoDespacho
} from 'src/app/models/formula';
import { descargarArchivo } from 'src/app/utils/archivos';
import { avisar, confirmar, mostrarError, notificarExito, pedirMotivo } from 'src/app/utils/mensajes';

/** Estados del despacho que aparecen en la bandeja de pendientes. */
const ESTADOS_POR_ENTREGAR = ['PENDIENTE_DESPACHO', 'EN_PREPARACION', 'DESPACHO_PARCIAL', 'PENDIENTE_DISPONIBILIDAD'];

/**
 * Pantalla de despacho de medicamentos (perfil DESPACHO_MEDICO).
 *
 * Bandeja de fórmulas confirmadas por entregar; al preparar una fórmula se
 * muestran sus medicamentos con lo pendiente y los lotes con existencias,
 * sugeridos empezando por el de vencimiento más próximo. El usuario ajusta las
 * cantidades por lote y confirma la entrega (total o parcial): el inventario
 * se descuenta en ese momento. También puede marcar la fórmula como pendiente
 * por disponibilidad, cancelar el despacho si no hay entregas, descargar el
 * comprobante y revertir una entrega con motivo. El administrador solo
 * consulta el historial.
 */
@Component({
  selector: 'app-despacho',
  imports: [CommonModule, FormsModule, PaginadorComponent],
  templateUrl: './despacho.component.html'
})
export class DespachoComponent implements OnInit, OnDestroy {
  /** Solo el perfil de despacho entrega, cancela y revierte. */
  readonly puedeOperar = inject(AuthService).tieneRol('DESPACHO_MEDICO');
  /** Estados de despacho para el filtro de pendientes. */
  readonly estadosPendientes = ESTADOS_DESPACHO.filter((e) => ESTADOS_POR_ENTREGAR.includes(e.valor));
  /** Texto y clase de los estados de despacho. */
  readonly textoDespacho = textoEstadoDespacho;
  readonly claseDespacho = claseEstadoDespacho;

  /** Pestaña visible. */
  pestana: 'pendientes' | 'historial' = 'pendientes';

  // ----- Pendientes -----

  /** Fórmulas por entregar. */
  pendientes: Formula[] = [];
  /** Indica que se está consultando la bandeja. */
  cargandoPendientes = false;
  /** Página actual. */
  paginaPendientes = 0;
  /** Registros por página. */
  tamanoPendientes = 10;
  /** Total de registros. */
  totalPendientes = 0;
  /** Total de páginas. */
  paginasPendientes = 0;
  /** Texto de búsqueda. */
  textoPendientes = '';
  /** Estado del despacho. */
  filtroEstadoPendientes = '';

  // ----- Historial -----

  /** Entregas registradas. */
  entregas: Despacho[] = [];
  /** Indica que se está consultando el historial. */
  cargandoHistorial = false;
  /** Página actual. */
  paginaHistorial = 0;
  /** Registros por página. */
  tamanoHistorial = 10;
  /** Total de registros. */
  totalHistorial = 0;
  /** Total de páginas. */
  paginasHistorial = 0;
  /** Texto de búsqueda. */
  textoHistorial = '';
  /** CONFIRMADO o REVERTIDO. */
  filtroEstadoHistorial = '';
  /** Fecha inicial. */
  desdeHistorial = '';
  /** Fecha final. */
  hastaHistorial = '';

  // ----- Preparación -----

  /** Información de la fórmula que se está preparando. */
  preparacion: PreparacionDespacho | null = null;
  /** Indica que se está consultando la preparación. */
  cargandoPreparacion = false;
  /** Unidades a entregar por línea y lote (clave "detalleId-loteId"). */
  cantidades: Record<string, number | null> = {};
  /** Observación de la entrega. */
  observacion = '';
  /** Indica que se está enviando una operación. */
  procesando = false;
  /** Entrega cuyo comprobante se está descargando. */
  descargando: number | null = null;

  /** Modal de preparación. */
  private modalPreparacion: Modal | null = null;
  /** Búsqueda con espera de la bandeja. */
  private readonly busquedaPendientes$ = new Subject<string>();
  /** Búsqueda con espera del historial. */
  private readonly busquedaHistorial$ = new Subject<string>();
  /** Suscripciones permanentes. */
  private readonly suscripciones = new Subscription();

  /**
   * @param despachoService servicio del despacho.
   */
  constructor(private readonly despachoService: DespachoService) { }

  /** Carga la pestaña inicial según el perfil. */
  ngOnInit(): void {
    this.suscripciones.add(this.busquedaPendientes$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((t) => {
      this.textoPendientes = t;
      this.paginaPendientes = 0;
      this.listarPendientes();
    }));
    this.suscripciones.add(this.busquedaHistorial$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((t) => {
      this.textoHistorial = t;
      this.paginaHistorial = 0;
      this.listarHistorial();
    }));
    if (this.puedeOperar) {
      this.listarPendientes();
    } else {
      this.cambiarPestana('historial');
    }
  }

  /** Cierra suscripciones y el modal. */
  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
    this.modalPreparacion?.dispose();
  }

  /** Cambia de pestaña y la recarga. */
  cambiarPestana(pestana: 'pendientes' | 'historial'): void {
    this.pestana = pestana;
    if (pestana === 'pendientes') {
      this.listarPendientes();
    } else {
      this.listarHistorial();
    }
  }

  // ===================== Pendientes =====================

  /** Consulta la bandeja de fórmulas por entregar (las más antiguas primero). */
  listarPendientes(): void {
    this.cargandoPendientes = true;
    this.despachoService.listarPendientes({
      page: this.paginaPendientes,
      size: this.tamanoPendientes,
      texto: this.textoPendientes,
      estadoDespacho: this.filtroEstadoPendientes,
      desde: '',
      hasta: ''
    }).subscribe({
      next: (pagina) => {
        this.pendientes = pagina.content;
        this.totalPendientes = pagina.totalElements;
        this.paginasPendientes = pagina.totalPages;
        this.paginaPendientes = pagina.page;
        this.cargandoPendientes = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoPendientes = false;
        this.pendientes = [];
        mostrarError(error, 'No se pudieron cargar las fórmulas pendientes');
      }
    });
  }

  /** Recibe el texto del buscador de pendientes. */
  buscarPendientes(texto: string): void {
    this.busquedaPendientes$.next(texto ?? '');
  }

  /** Aplica el filtro de estado de la bandeja. */
  filtrarPendientes(): void {
    this.paginaPendientes = 0;
    this.listarPendientes();
  }

  /** Cambia de página en la bandeja. */
  irAPaginaPendientes(pagina: number): void {
    this.paginaPendientes = pagina;
    this.listarPendientes();
  }

  /** Cambia el tamaño de página de la bandeja. */
  cambiarTamanoPendientes(tamano: number): void {
    this.tamanoPendientes = tamano;
    this.paginaPendientes = 0;
    this.listarPendientes();
  }

  // ===================== Preparación =====================

  /** Marca la fórmula como en preparación y abre la selección de lotes. */
  preparar(formula: Formula): void {
    this.preparacion = null;
    this.cargandoPreparacion = true;
    this.observacion = '';
    this.abrirModal();
    const cargar = (): void => {
      this.despachoService.consultarPreparacion(formula.formulaId).subscribe({
        next: (data) => {
          this.cargarPreparacion(data);
          this.cargandoPreparacion = false;
        },
        error: (error: HttpErrorResponse) => {
          this.cargandoPreparacion = false;
          this.modalPreparacion?.hide();
          mostrarError(error, 'No se pudo consultar la fórmula');
        }
      });
    };
    if (formula.estadoDespacho === 'PENDIENTE_DESPACHO') {
      this.despachoService.iniciarPreparacion(formula.formulaId).subscribe({
        next: () => {
          cargar();
          this.listarPendientes();
        },
        error: (error: HttpErrorResponse) => {
          this.cargandoPreparacion = false;
          this.modalPreparacion?.hide();
          mostrarError(error, 'No se pudo iniciar la preparación');
        }
      });
    } else {
      cargar();
    }
  }

  /** Guarda la preparación y propone las cantidades sugeridas por lote. */
  private cargarPreparacion(data: PreparacionDespacho): void {
    this.preparacion = data;
    this.cantidades = {};
    data.lineas.forEach((l) => l.lotes.forEach((lote) => {
      this.cantidades[this.clave(l, lote.loteId)] = lote.sugerido > 0 ? lote.sugerido : null;
    }));
  }

  /** Clave de la cantidad de una línea en un lote. */
  clave(linea: LineaDespacho, loteId: number): string {
    return `${linea.linea.detalleId}-${loteId}`;
  }

  /** Unidades elegidas para una línea. */
  totalLinea(linea: LineaDespacho): number {
    return linea.lotes.reduce((suma, lote) => suma + (Number(this.cantidades[this.clave(linea, lote.loteId)]) || 0), 0);
  }

  /** Indica si alguna cantidad de la línea es inválida o supera lo pendiente. */
  lineaInvalida(linea: LineaDespacho): boolean {
    if (this.totalLinea(linea) > linea.linea.cantidadPendiente) {
      return true;
    }
    return linea.lotes.some((lote) => this.cantidadInvalida(linea, lote.loteId, lote.disponible));
  }

  /** Indica si la cantidad de un lote es inválida (decimal, negativa o mayor que lo disponible). */
  cantidadInvalida(linea: LineaDespacho, loteId: number, disponible: number): boolean {
    const valor = this.cantidades[this.clave(linea, loteId)];
    if (valor === null || valor === undefined || (valor as unknown) === '') {
      return false;
    }
    return !Number.isInteger(Number(valor)) || Number(valor) < 0 || Number(valor) > disponible;
  }

  /** Total de unidades de la entrega. */
  get totalEntrega(): number {
    return this.preparacion?.lineas.reduce((s, l) => s + this.totalLinea(l), 0) ?? 0;
  }

  /** Indica si la entrega se puede confirmar. */
  get entregaValida(): boolean {
    return !!this.preparacion && this.totalEntrega > 0 && !this.preparacion.lineas.some((l) => this.lineaInvalida(l));
  }

  /** Indica si la entrega cubre todo lo pendiente. */
  get entregaCompleta(): boolean {
    return !!this.preparacion && this.preparacion.lineas.every((l) => this.totalLinea(l) === l.linea.cantidadPendiente);
  }

  /** Indica si alguna línea no alcanza con las existencias. */
  get faltanExistencias(): boolean {
    return !!this.preparacion?.lineas.some((l) => !l.alcanza);
  }

  /** Indica si la fórmula ya tiene entregas confirmadas. */
  get tieneEntregas(): boolean {
    return !!this.preparacion?.formula.despachos?.some((d) => d.estado === 'CONFIRMADO');
  }

  /** Confirma la entrega y descuenta el inventario. */
  async entregar(): Promise<void> {
    if (!this.preparacion || !this.entregaValida || this.procesando) {
      return;
    }
    const formula = this.preparacion.formula;
    const parcial = this.entregaCompleta ? '' : ' Es una entrega parcial: lo que falte quedará pendiente.';
    const ok = await confirmar(`¿Confirmar la entrega de ${this.totalEntrega} unidades?`,
      'Se descontarán del inventario en los lotes seleccionados.' + parcial, 'Sí, entregar');
    if (!ok) {
      return;
    }
    const entregas: EntregaRq[] = [];
    this.preparacion.lineas.forEach((l) => l.lotes.forEach((lote) => {
      const cantidad = Number(this.cantidades[this.clave(l, lote.loteId)]) || 0;
      if (cantidad > 0) {
        entregas.push({ formulaDetalleId: l.linea.detalleId, loteId: lote.loteId, cantidad });
      }
    }));
    this.procesando = true;
    this.despachoService.entregar(formula.formulaId, { observacion: this.observacion.trim(), entregas }).subscribe({
      next: async (despacho) => {
        this.procesando = false;
        this.modalPreparacion?.hide();
        this.listarPendientes();
        const descargar = await confirmar(`Entrega N.° ${despacho.despachoId} registrada`,
          `Estado de la fórmula: ${textoEstadoDespacho(despacho.estadoDespachoFormula)}. ¿Desea descargar el comprobante?`,
          'Descargar comprobante');
        if (descargar) {
          this.descargarComprobante(despacho.despachoId);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.procesando = false;
        mostrarError(error, 'No se pudo registrar la entrega');
        this.recargarPreparacion();
      }
    });
  }

  /** Marca la fórmula como pendiente por disponibilidad. */
  async sinDisponibilidad(): Promise<void> {
    if (!this.preparacion) {
      return;
    }
    const formulaId = this.preparacion.formula.formulaId;
    const motivo = await pedirMotivo('¿Marcar como pendiente por disponibilidad?',
      'La fórmula quedará en espera hasta que lleguen existencias.', 'Sí, marcar', false, 200);
    if (motivo === null) {
      return;
    }
    this.despachoService.sinDisponibilidad(formulaId, motivo).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.modalPreparacion?.hide();
        this.listarPendientes();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cambiar el estado')
    });
  }

  /** Cancela el despacho de una fórmula sin entregas. */
  async cancelar(): Promise<void> {
    if (!this.preparacion) {
      return;
    }
    if (this.tieneEntregas) {
      avisar('No se puede cancelar', 'La fórmula tiene entregas confirmadas; reviértalas primero desde el historial.', 'warning');
      return;
    }
    const formulaId = this.preparacion.formula.formulaId;
    const motivo = await pedirMotivo(`¿Cancelar el despacho de la fórmula N.° ${formulaId}?`,
      'La fórmula saldrá de la bandeja de pendientes.', 'Sí, cancelar');
    if (motivo === null) {
      return;
    }
    this.despachoService.cancelar(formulaId, motivo).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.modalPreparacion?.hide();
        this.listarPendientes();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cancelar el despacho')
    });
  }

  /** Vuelve a consultar la preparación (tras un error de existencias, por ejemplo). */
  private recargarPreparacion(): void {
    const formulaId = this.preparacion?.formula.formulaId;
    if (!formulaId) {
      return;
    }
    this.despachoService.consultarPreparacion(formulaId).subscribe({
      next: (data) => this.cargarPreparacion(data)
    });
  }

  /** Cierra el modal de preparación. */
  cerrarPreparacion(): void {
    this.modalPreparacion?.hide();
  }

  // ===================== Historial =====================

  /** Consulta el historial de entregas. */
  listarHistorial(): void {
    if (this.desdeHistorial && this.hastaHistorial && this.desdeHistorial > this.hastaHistorial) {
      avisar('Rango de fechas inválido', 'La fecha inicial no puede ser posterior a la fecha final.', 'warning');
      return;
    }
    this.cargandoHistorial = true;
    this.despachoService.historial({
      page: this.paginaHistorial,
      size: this.tamanoHistorial,
      texto: this.textoHistorial,
      estado: this.filtroEstadoHistorial,
      desde: this.desdeHistorial,
      hasta: this.hastaHistorial
    }).subscribe({
      next: (pagina) => {
        this.entregas = pagina.content;
        this.totalHistorial = pagina.totalElements;
        this.paginasHistorial = pagina.totalPages;
        this.paginaHistorial = pagina.page;
        this.cargandoHistorial = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoHistorial = false;
        this.entregas = [];
        mostrarError(error, 'No se pudo cargar el historial de entregas');
      }
    });
  }

  /** Recibe el texto del buscador del historial. */
  buscarHistorial(texto: string): void {
    this.busquedaHistorial$.next(texto ?? '');
  }

  /** Aplica los filtros del historial. */
  filtrarHistorial(): void {
    this.paginaHistorial = 0;
    this.listarHistorial();
  }

  /** Cambia de página en el historial. */
  irAPaginaHistorial(pagina: number): void {
    this.paginaHistorial = pagina;
    this.listarHistorial();
  }

  /** Cambia el tamaño de página del historial. */
  cambiarTamanoHistorial(tamano: number): void {
    this.tamanoHistorial = tamano;
    this.paginaHistorial = 0;
    this.listarHistorial();
  }

  /** Revierte una entrega pidiendo el motivo. */
  async revertir(entrega: Despacho): Promise<void> {
    const motivo = await pedirMotivo(`¿Revertir la entrega N.° ${entrega.despachoId}?`,
      'Las unidades volverán a sus lotes y la fórmula recuperará lo pendiente.', 'Sí, revertir');
    if (motivo === null) {
      return;
    }
    this.despachoService.revertir(entrega.despachoId, motivo).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.listarHistorial();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo revertir la entrega')
    });
  }

  /** Descarga el comprobante de una entrega. */
  descargarComprobante(despachoId: number): void {
    this.descargando = despachoId;
    this.despachoService.descargarComprobante(despachoId).subscribe({
      next: (archivo) => {
        this.descargando = null;
        descargarArchivo(archivo, `despacho-${despachoId}.pdf`);
      },
      error: (error: HttpErrorResponse) => {
        this.descargando = null;
        mostrarError(error, 'No se pudo generar el comprobante');
      }
    });
  }

  // ===================== Utilidades =====================

  /** Clase de la etiqueta del estado de un lote. */
  claseLote(estado: EstadoLote): string {
    return estado === 'VENCIDO' ? 'bg-danger' : estado === 'PROXIMO_A_VENCER' ? 'bg-warning text-dark' : 'bg-success';
  }

  /** Texto del estado de un lote. */
  textoLote(estado: EstadoLote): string {
    return estado === 'VENCIDO' ? 'Vencido' : estado === 'PROXIMO_A_VENCER' ? 'Próximo a vencer' : 'Vigente';
  }

  /** Texto legible de una vía de administración. */
  textoVia(via: string): string {
    return VIAS_ADMINISTRACION.find((v) => v.valor === via)?.texto ?? via;
  }

  /** Abre el modal de preparación. */
  private abrirModal(): void {
    const elemento = document.getElementById('modalPreparacion');
    if (elemento) {
      this.modalPreparacion ??= new Modal(elemento);
      this.modalPreparacion.show();
    }
  }
}
