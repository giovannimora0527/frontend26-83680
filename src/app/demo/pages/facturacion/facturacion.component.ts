import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { FacturacionService } from 'src/app/services/facturacion.service';
import { CatalogoService } from 'src/app/services/catalogo.service';
import { AuthService } from 'src/app/services/auth.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { ClienteOpcion, MascotaOpcion } from 'src/app/models/catalogo';
import { ESTADOS_FACTURA, Factura, MEDIOS_PAGO } from 'src/app/models/facturacion';
import { ModalBootstrap } from 'src/app/utils/modal';
import { descargarArchivo } from 'src/app/utils/archivos';
import { avisar, confirmar, mostrarError, notificarExito, pedirMotivo } from 'src/app/utils/mensajes';

/**
 * Facturación de las atenciones finalizadas y registro de pagos.
 *
 * Pestaña "Por facturar": atenciones finalizadas sin factura vigente, con su
 * vista previa (servicios a la tarifa congelada y medicamentos efectivamente
 * dispensados). Pestaña "Facturas": historial con filtros por propietario,
 * mascota, estado y fechas; detalle con pagos, registro de pagos parciales o
 * totales, PDF y anulación (solo el administrador, con motivo y sin pagos).
 */
@Component({
  selector: 'app-facturacion',
  imports: [CommonModule, FormsModule, PaginadorComponent],
  templateUrl: './facturacion.component.html'
})
export class FacturacionComponent implements OnInit, OnDestroy {
  /** Estados de factura. */
  readonly estados = ESTADOS_FACTURA;
  /** Medios de pago. */
  readonly medios = MEDIOS_PAGO;
  /** Solo el administrador autoriza descuentos y anula facturas. */
  readonly esAdmin = inject(AuthService).tieneRol('ADMIN');

  /** Pestaña visible. */
  pestana: 'pendientes' | 'facturas' = 'pendientes';

  // ----- Por facturar -----
  /** Atenciones por facturar. */
  pendientes: Factura[] = [];
  /** Indica que se están cargando. */
  cargandoPendientes = false;
  /** Vista previa en el modal de facturación. */
  vista: Factura | null = null;
  /** Descuento a aplicar. */
  descuento = 0;
  /** Motivo del descuento. */
  motivoDescuento = '';
  /** Indica que se está generando. */
  generando = false;

  // ----- Facturas -----
  /** Facturas de la página. */
  facturas: Factura[] = [];
  /** Indica que se están cargando. */
  cargandoFacturas = false;
  /** Página. */
  pagina = 0;
  /** Tamaño de página. */
  tamano = 10;
  /** Total de registros. */
  total = 0;
  /** Total de páginas. */
  paginas = 0;
  /** Texto de búsqueda. */
  texto = '';
  /** Estado. */
  filtroEstado = '';
  /** Propietario. */
  filtroCliente: number | null = null;
  /** Mascota. */
  filtroMascota: number | null = null;
  /** Desde. */
  desde = '';
  /** Hasta. */
  hasta = '';
  /** Propietarios. */
  clientes: ClienteOpcion[] = [];
  /** Mascotas del propietario elegido. */
  mascotas: MascotaOpcion[] = [];

  // ----- Detalle -----
  /** Factura del detalle. */
  detalle: Factura | null = null;
  /** Pago en registro. */
  pago = { valor: 0, medio: 'EFECTIVO', referencia: '' };
  /** Indica que se está registrando un pago. */
  pagando = false;

  /** Modales. */
  private readonly modalFacturar = new ModalBootstrap('modalFacturar');
  private readonly modalDetalle = new ModalBootstrap('modalDetalleFactura');

  /**
   * @param facturacion servicio de facturación.
   * @param catalogo catálogos de propietarios y mascotas.
   */
  constructor(
    private readonly facturacion: FacturacionService,
    private readonly catalogo: CatalogoService
  ) { }

  /** Carga la bandeja y los propietarios. */
  ngOnInit(): void {
    this.cargarPendientes();
    this.catalogo.listarClientes().subscribe({ next: (c) => (this.clientes = c) });
  }

  /** Cierra los modales. */
  ngOnDestroy(): void {
    this.modalFacturar.destruir();
    this.modalDetalle.destruir();
  }

  /** Cambia de pestaña. */
  cambiarPestana(p: 'pendientes' | 'facturas'): void {
    this.pestana = p;
    if (p === 'pendientes') {
      this.cargarPendientes();
    } else {
      this.listar();
    }
  }

  // ===================== Por facturar =====================

  /** Consulta las atenciones por facturar. */
  cargarPendientes(): void {
    this.cargandoPendientes = true;
    this.facturacion.porFacturar().subscribe({
      next: (data) => {
        this.pendientes = data;
        this.cargandoPendientes = false;
      },
      error: (e: HttpErrorResponse) => {
        this.cargandoPendientes = false;
        mostrarError(e, 'No se pudieron cargar las atenciones por facturar');
      }
    });
  }

  /** Abre la vista previa para facturar. */
  abrirFacturar(f: Factura): void {
    this.vista = f;
    this.descuento = 0;
    this.motivoDescuento = '';
    this.modalFacturar.abrir();
  }

  /** Total estimado con el descuento (el cálculo definitivo lo hace el backend por línea). */
  get totalEstimado(): number {
    if (!this.vista) {
      return 0;
    }
    const sub = this.vista.subtotal;
    const d = Math.min(Number(this.descuento) || 0, sub);
    const factor = sub > 0 ? (sub - d) / sub : 0;
    return Math.round((sub - d + this.vista.iva * factor) * 100) / 100;
  }

  /** Genera la factura. */
  async generar(): Promise<void> {
    if (!this.vista || this.generando) {
      return;
    }
    const d = Number(this.descuento) || 0;
    if (d < 0 || d > this.vista.subtotal) {
      avisar('Descuento inválido', 'El descuento debe estar entre 0 y el subtotal.', 'warning');
      return;
    }
    if (d > 0 && !this.motivoDescuento.trim()) {
      avisar('Motivo requerido', 'Indique el motivo del descuento.', 'warning');
      return;
    }
    const ok = await confirmar('¿Generar la factura?',
      `${this.vista.clienteNombre} · ${this.vista.mascotaNombre}. Una atención solo se factura una vez.`, 'Sí, generar');
    if (!ok) {
      return;
    }
    this.generando = true;
    this.facturacion.generarFactura(this.vista.historiaId, d, this.motivoDescuento.trim()).subscribe({
      next: (f) => {
        this.generando = false;
        this.modalFacturar.cerrar();
        notificarExito(`Factura ${f.numero} generada`);
        this.cargarPendientes();
        this.verDetalle(f.facturaId!);
      },
      error: (e: HttpErrorResponse) => {
        this.generando = false;
        mostrarError(e, 'No se pudo generar la factura');
      }
    });
  }

  // ===================== Facturas =====================

  /** Consulta el historial de facturas. */
  listar(): void {
    if (this.desde && this.hasta && this.desde > this.hasta) {
      avisar('Rango de fechas inválido', 'La fecha inicial no puede ser posterior a la final.', 'warning');
      return;
    }
    this.cargandoFacturas = true;
    this.facturacion.facturas({
      page: this.pagina, size: this.tamano, texto: this.texto, estado: this.filtroEstado,
      clienteId: this.filtroCliente, mascotaId: this.filtroMascota, desde: this.desde, hasta: this.hasta
    }).subscribe({
      next: (p) => {
        this.facturas = p.content;
        this.total = p.totalElements;
        this.paginas = p.totalPages;
        this.pagina = p.page;
        this.cargandoFacturas = false;
      },
      error: (e: HttpErrorResponse) => {
        this.cargandoFacturas = false;
        mostrarError(e, 'No se pudieron cargar las facturas');
      }
    });
  }

  /** Aplica los filtros. */
  filtrar(): void {
    this.pagina = 0;
    this.listar();
  }

  /** Al cambiar el propietario carga sus mascotas. */
  alCambiarCliente(): void {
    this.filtroMascota = null;
    this.mascotas = [];
    if (this.filtroCliente) {
      this.catalogo.listarMascotasPorCliente(this.filtroCliente).subscribe({ next: (m) => (this.mascotas = m) });
    }
    this.filtrar();
  }

  /** Cambia de página. */
  irA(p: number): void {
    this.pagina = p;
    this.listar();
  }

  /** Cambia el tamaño de página. */
  cambiarTamano(t: number): void {
    this.tamano = t;
    this.filtrar();
  }

  /** Abre el detalle de una factura. */
  verDetalle(id: number): void {
    this.detalle = null;
    this.modalDetalle.abrir();
    this.facturacion.factura(id).subscribe({
      next: (f) => {
        this.detalle = f;
        this.pago = { valor: f.saldo, medio: 'EFECTIVO', referencia: '' };
      },
      error: (e: HttpErrorResponse) => {
        this.modalDetalle.cerrar();
        mostrarError(e, 'No se pudo consultar la factura');
      }
    });
  }

  /** Registra un pago sobre la factura del detalle. */
  registrarPago(): void {
    const f = this.detalle;
    if (!f || this.pagando) {
      return;
    }
    const valor = Number(this.pago.valor);
    if (!(valor > 0) || valor > f.saldo) {
      avisar('Valor inválido', 'El pago debe ser mayor que 0 y no superar el saldo.', 'warning');
      return;
    }
    if (this.pago.medio !== 'EFECTIVO' && !this.pago.referencia.trim()) {
      avisar('Referencia requerida', 'Indique la referencia o el número de aprobación.', 'warning');
      return;
    }
    this.pagando = true;
    this.facturacion.registrarPago(f.facturaId!, valor, this.pago.medio, this.pago.referencia.trim()).subscribe({
      next: (r) => {
        this.pagando = false;
        notificarExito(r.message);
        this.verDetalle(f.facturaId!);
        this.listar();
      },
      error: (e: HttpErrorResponse) => {
        this.pagando = false;
        mostrarError(e, 'No se pudo registrar el pago');
      }
    });
  }

  /** Anula la factura del detalle. */
  async anular(): Promise<void> {
    const f = this.detalle;
    if (!f) {
      return;
    }
    const motivo = await pedirMotivo(`¿Anular la factura ${f.numero}?`,
      'Se conserva como registro y la atención se podrá facturar de nuevo.', 'Sí, anular');
    if (motivo === null) {
      return;
    }
    this.facturacion.anularFactura(f.facturaId!, motivo).subscribe({
      next: (r) => {
        notificarExito(r.message);
        this.verDetalle(f.facturaId!);
        this.listar();
      },
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo anular la factura')
    });
  }

  /** Descarga el PDF de una factura. */
  descargarPdf(f: Factura): void {
    this.facturacion.facturaPdf(f.facturaId!).subscribe({
      next: (archivo) => descargarArchivo(archivo, `factura-${f.numero}.pdf`),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo generar el PDF')
    });
  }

  /** Texto y clase de un estado. */
  estado(e: string | null): { texto: string; clase: string } {
    const x = ESTADOS_FACTURA.find((s) => s.valor === e);
    return { texto: x?.texto ?? (e ?? '—'), clase: x?.clase ?? 'bg-light text-dark' };
  }

  /** Texto de un medio de pago. */
  medio(m: string): string {
    return MEDIOS_PAGO.find((x) => x.valor === m)?.texto ?? m;
  }
}
