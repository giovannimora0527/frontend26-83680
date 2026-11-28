import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { getJwtPayload } from 'src/app/utils/jwt.util';
import {
  DespachoService,
  FormulaPendienteRs,
  LoteDisponibleRs,
  ConfirmarDespachoRq,
  Despacho,
  DetalleDespacho,
} from './service/despacho.service';
import Swal from 'sweetalert2';

type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (el: Element) => ModalBootstrap } };
type Tab = 'bandeja' | 'historial' | 'movimientos';

@Component({
  selector: 'app-despacho',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './despacho.component.html',
  styleUrl: './despacho.component.scss'
})
export class DespachoComponent implements OnInit {

  tabActual: Tab = 'bandeja';

  // ── Bandeja ──────────────────────────────────────────────────
  formulas: FormulaPendienteRs[] = [];
  cargandoFormulas = false;
  errorFormulas = '';
  filtroNumero = '';
  filtroPropietario = '';
  filtroMascota = '';
  filtroFecha = '';
  paginaFormulas = 1;
  readonly ITEMS_POR_PAG = 8;

  // ── Modal preparar/confirmar ─────────────────────────────────
  modalDespachoInstance: ModalBootstrap | null = null;
  formulaActual: FormulaPendienteRs | null = null;
  cargandoDetalle = false;
  loteSeleccionado: LoteDisponibleRs | null = null;
  cantidadAEntregar = 0;
  accionDespacho: 'EN_PREPARACION' | 'PENDIENTE_DISPONIBILIDAD' | 'CANCELADO' | 'CONFIRMAR' = 'CONFIRMAR';
  motivoCancelacion = '';
  enviandoDespacho = false;
  errorDespacho = '';
  despachoConfirmadoId: number | null = null;

  // ── Historial ────────────────────────────────────────────────
  despachos: Despacho[] = [];
  cargandoDespachos = false;
  despachoSeleccionado: Despacho | null = null;
  detallesDespacho: DetalleDespacho[] = [];
  historialDespacho: any[] = [];
  busquedaHistorial = '';
  paginaHistorial = 1;

  // ── Modal reversión ──────────────────────────────────────────
  modalReversionInstance: ModalBootstrap | null = null;
  formReversion!: FormGroup;
  enviandoReversion = false;
  errorReversion = '';

  // ── Movimientos ──────────────────────────────────────────────
  movimientos: any[] = [];
  cargandoMovimientos = false;
  medicamentoIdMovimientos: number | null = null;
  medicamentoBusqueda = '';

  constructor(
    private readonly svc: DespachoService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.formReversion = this.fb.group({ motivo: ['', [Validators.required, Validators.minLength(5)]] });
    this.cargarFormulas();
  }

  // ── Tabs ─────────────────────────────────────────────────────

  cambiarTab(t: Tab): void {
    this.tabActual = t;
    if (t === 'historial' && !this.despachos.length) this.cargarDespachos();
  }

  // ── Bandeja ──────────────────────────────────────────────────

  cargarFormulas(): void {
    this.cargandoFormulas = true;
    this.errorFormulas = '';
    this.paginaFormulas = 1;
    this.svc.listarFormulasPendientes({
      numeroFormula: this.filtroNumero || undefined,
      propietario: this.filtroPropietario || undefined,
      mascota: this.filtroMascota || undefined,
      fecha: this.filtroFecha || undefined,
    }).subscribe({
      next: (d) => { this.formulas = d; this.cargandoFormulas = false; },
      error: () => { this.errorFormulas = 'Error al cargar las fórmulas. Intente nuevamente.'; this.cargandoFormulas = false; },
    });
  }

  limpiarFiltros(): void {
    this.filtroNumero = '';
    this.filtroPropietario = '';
    this.filtroMascota = '';
    this.filtroFecha = '';
    this.cargarFormulas();
  }

  get formulasPaginadas(): FormulaPendienteRs[] {
    const ini = (this.paginaFormulas - 1) * this.ITEMS_POR_PAG;
    return this.formulas.slice(ini, ini + this.ITEMS_POR_PAG);
  }
  get totalPaginasFormulas(): number { return Math.ceil(this.formulas.length / this.ITEMS_POR_PAG); }
  get paginasFormulas(): number[] { return Array.from({ length: this.totalPaginasFormulas }, (_, i) => i + 1); }

  puedeDespachar(f: FormulaPendienteRs): boolean {
    return f.estadoDespacho !== 'DESPACHADO' && f.estadoDespacho !== 'CANCELADO';
  }

  abrirPreparar(formula: FormulaPendienteRs): void {
    this.formulaActual = null;
    this.loteSeleccionado = null;
    this.cantidadAEntregar = 0;
    this.accionDespacho = 'CONFIRMAR';
    this.motivoCancelacion = '';
    this.errorDespacho = '';
    this.despachoConfirmadoId = null;
    this.cargandoDetalle = true;
    const el = document.getElementById('modalDespacho');
    if (el) {
      this.modalDespachoInstance = new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
      this.modalDespachoInstance.show();
    }
    this.svc.obtenerDetalleFormula(formula.formulaId).subscribe({
      next: (d) => {
        this.formulaActual = d[0] ?? formula;
        this.autoseleccionarLote();
        this.cargandoDetalle = false;
      },
      error: () => {
        this.formulaActual = formula;
        this.cargandoDetalle = false;
      },
    });
  }

  autoseleccionarLote(): void {
    if (!this.formulaActual?.lotesDisponibles?.length) return;
    const primerVigente = this.formulaActual.lotesDisponibles.find(l => !l.vencido && l.cantidadDisponible > 0);
    if (primerVigente) {
      this.loteSeleccionado = primerVigente;
      this.cantidadAEntregar = Math.min(
        primerVigente.cantidadDisponible,
        this.cantidadPrescritaNum
      );
    }
  }

  get cantidadPrescritaNum(): number {
    if (!this.formulaActual?.cantidad) return 1;
    const n = parseInt(this.formulaActual.cantidad, 10);
    return isNaN(n) ? 1 : n;
  }

  get cantidadMaxEntrega(): number {
    return Math.min(
      this.loteSeleccionado?.cantidadDisponible ?? 0,
      this.cantidadPrescritaNum
    );
  }

  seleccionarLote(lote: LoteDisponibleRs): void {
    if (lote.vencido) return;
    this.loteSeleccionado = lote;
    this.cantidadAEntregar = Math.min(lote.cantidadDisponible, this.cantidadPrescritaNum);
  }

  confirmarAccion(): void {
    if (!this.formulaActual) return;
    if (this.accionDespacho === 'CANCELADO' && !this.motivoCancelacion.trim()) {
      this.errorDespacho = 'El motivo de cancelación es obligatorio.';
      return;
    }
    if (this.accionDespacho === 'CONFIRMAR') {
      if (!this.loteSeleccionado) { this.errorDespacho = 'Debes seleccionar un lote.'; return; }
      if (this.cantidadAEntregar <= 0) { this.errorDespacho = 'La cantidad a entregar debe ser mayor a cero.'; return; }
      if (this.cantidadAEntregar > (this.loteSeleccionado.cantidadDisponible)) {
        this.errorDespacho = 'La cantidad supera el stock disponible en el lote.'; return;
      }
    }

    const payload = getJwtPayload();
    const usuarioId = payload ? Number(payload.sub) : 0;
    this.enviandoDespacho = true;
    this.errorDespacho = '';

    if (this.accionDespacho === 'CONFIRMAR') {
      const rq: ConfirmarDespachoRq = {
        formulaMedicaId: this.formulaActual.formulaId,
        usuarioDespachoId: usuarioId,
        observaciones: this.motivoCancelacion || undefined,
        lineas: [{
          formulaMedicaId: this.formulaActual.formulaId,
          medicamentoId: this.formulaActual.medicamentoId,
          loteId: this.loteSeleccionado!.loteId,
          cantidadEntregada: this.cantidadAEntregar,
        }],
      };
      this.svc.confirmarDispensa(rq).subscribe({
        next: (res) => {
          this.enviandoDespacho = false;
          this.despachoConfirmadoId = res?.id ?? this.formulaActual?.despachoId ?? null;
          Swal.fire({ icon: 'success', title: 'Dispensa confirmada', text: res?.message ?? 'El despacho fue procesado.', timer: 2500, showConfirmButton: false });
          this.cargarFormulas();
          if (this.tabActual === 'historial') this.cargarDespachos();
        },
        error: (err) => { this.enviandoDespacho = false; this.errorDespacho = err?.error?.message ?? 'Error al confirmar la dispensa.'; },
      });
    } else {
      const obs = this.accionDespacho === 'CANCELADO' ? this.motivoCancelacion : undefined;
      const rq = { formulasMedicaId: this.formulaActual.formulaId, usuarioDespachoId: usuarioId, estado: this.accionDespacho, observaciones: obs };
      const obs$ = this.formulaActual.despachoId
        ? this.svc.actualizarEstadoDirecto(this.formulaActual.despachoId, this.accionDespacho, usuarioId, obs)
        : this.svc.crearDespachoConEstado(this.formulaActual.formulaId, usuarioId, this.accionDespacho, obs);
      obs$.subscribe({
        next: () => {
          this.enviandoDespacho = false;
          this.modalDespachoInstance?.hide();
          Swal.fire({ icon: 'success', title: 'Estado actualizado', timer: 2000, showConfirmButton: false });
          this.cargarFormulas();
        },
        error: (err: any) => { this.enviandoDespacho = false; this.errorDespacho = err?.error?.message ?? 'Error al actualizar el estado.'; },
      });
    }
  }

  descargarPdf(despachoId: number): void {
    const token = sessionStorage.getItem('token') ?? '';
    const url = this.svc.comprobantePdfUrl(despachoId);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `comprobante-despacho-${despachoId}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => Swal.fire('Error', 'No se pudo descargar el PDF.', 'error'));
  }

  // ── Historial ────────────────────────────────────────────────

  cargarDespachos(): void {
    this.cargandoDespachos = true;
    this.svc.listar().subscribe({
      next: (d) => { this.despachos = d; this.cargandoDespachos = false; },
      error: () => { this.cargandoDespachos = false; },
    });
  }

  get despachosFiltrados(): Despacho[] {
    if (!this.busquedaHistorial.trim()) return this.despachos;
    const t = this.busquedaHistorial.toLowerCase();
    return this.despachos.filter(d =>
      String(d.id).includes(t) ||
      (d.usuarioDespacho?.username ?? '').toLowerCase().includes(t) ||
      (d.estado ?? '').toLowerCase().includes(t) ||
      String(d.formulaMedica?.id ?? '').includes(t)
    );
  }

  get despachosPaginados(): Despacho[] {
    const ini = (this.paginaHistorial - 1) * this.ITEMS_POR_PAG;
    return this.despachosFiltrados.slice(ini, ini + this.ITEMS_POR_PAG);
  }
  get totalPaginasHistorial(): number { return Math.ceil(this.despachosFiltrados.length / this.ITEMS_POR_PAG); }
  get paginasHistorial(): number[] { return Array.from({ length: this.totalPaginasHistorial }, (_, i) => i + 1); }

  verDetalle(d: Despacho): void {
    this.despachoSeleccionado = d;
    this.detallesDespacho = [];
    this.historialDespacho = [];
    if (!d.id) return;
    this.svc.listarDetalles(d.id).subscribe({ next: (det) => this.detallesDespacho = det });
    this.svc.listarHistorial(d.id).subscribe({ next: (h) => this.historialDespacho = h });
  }

  abrirReversion(d: Despacho): void {
    this.despachoSeleccionado = d;
    this.formReversion.reset();
    this.errorReversion = '';
    const el = document.getElementById('modalReversion');
    if (el) {
      this.modalReversionInstance = new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
      this.modalReversionInstance.show();
    }
  }

  confirmarReversion(): void {
    if (this.formReversion.invalid || !this.despachoSeleccionado?.id) return;
    const payload = getJwtPayload();
    this.enviandoReversion = true;
    this.errorReversion = '';
    this.svc.revertir(this.despachoSeleccionado.id, {
      usuarioId: payload ? Number(payload.sub) : 0,
      motivo: this.formReversion.value.motivo,
    }).subscribe({
      next: () => {
        this.enviandoReversion = false;
        this.modalReversionInstance?.hide();
        this.despachoSeleccionado = null;
        this.detallesDespacho = [];
        this.historialDespacho = [];
        Swal.fire({ icon: 'success', title: 'Despacho revertido', timer: 2000, showConfirmButton: false });
        this.cargarDespachos();
      },
      error: (err) => { this.enviandoReversion = false; this.errorReversion = err?.error?.message ?? 'Error al revertir.'; },
    });
  }

  puedeRevertir(d: Despacho): boolean {
    return d.estado === 'DESPACHADO' || d.estado === 'DESPACHO_PARCIAL';
  }

  // ── Movimientos ──────────────────────────────────────────────

  buscarMovimientos(): void {
    if (!this.medicamentoBusqueda.trim()) return;
    const id = parseInt(this.medicamentoBusqueda.trim(), 10);
    if (isNaN(id)) return;
    this.medicamentoIdMovimientos = id;
    this.cargandoMovimientos = true;
    this.svc.listarMovimientos(id).subscribe({
      next: (m) => { this.movimientos = m; this.cargandoMovimientos = false; },
      error: () => { this.cargandoMovimientos = false; },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────

  etiquetaEstado(estado: string | undefined): string {
    const m: Record<string, string> = {
      PENDIENTE_DESPACHO: 'Pendiente', EN_PREPARACION: 'En preparación',
      DESPACHO_PARCIAL: 'Parcial', DESPACHADO: 'Despachado',
      PENDIENTE_DISPONIBILIDAD: 'Sin stock', CANCELADO: 'Cancelado',
    };
    return m[estado ?? ''] ?? (estado ?? '—');
  }

  badgeEstado(estado: string | undefined): string {
    const m: Record<string, string> = {
      PENDIENTE_DESPACHO: 'bg-warning text-dark', EN_PREPARACION: 'bg-info text-dark',
      DESPACHO_PARCIAL: 'bg-primary', DESPACHADO: 'bg-success',
      PENDIENTE_DISPONIBILIDAD: 'bg-secondary', CANCELADO: 'bg-danger',
    };
    return m[estado ?? ''] ?? 'bg-secondary';
  }

  badgeLote(lote: LoteDisponibleRs): string {
    if (lote.vencido) return 'bg-danger';
    if (lote.proximoAVencer) return 'bg-warning text-dark';
    return 'bg-success';
  }

  labelLote(lote: LoteDisponibleRs): string {
    if (lote.vencido) return 'Vencido';
    if (lote.proximoAVencer) return 'Próximo a vencer';
    return 'Vigente';
  }
}
