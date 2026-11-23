import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { DespachoService } from './service/despacho.service';
import { Despacho, DespachoFormula, DespachoItem } from 'src/app/models/clinica';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { AuthService } from 'src/app/services/auth.service';
import { abrirPdf, fechaHoy, obtenerMensajeError } from 'src/app/utils/utilidades';

/**
 * Despacho y dispensacion de medicamentos. Lo opera el perfil DESPACHO_MEDICO;
 * el administrador consulta y puede revertir despachos.
 */
@Component({
  selector: 'app-despacho',
  imports: [CommonModule, FormsModule, NgbTooltipModule],
  templateUrl: './despacho.component.html',
  styleUrl: './despacho.component.scss'
})
export class DespachoComponent {
  readonly nombresEstado: Record<string, string> = {
    PENDIENTE_DESPACHO: 'Pendiente de despacho', EN_PREPARACION: 'En preparación', DESPACHO_PARCIAL: 'Despacho parcial',
    DESPACHADO: 'Despachado', PENDIENTE_DISPONIBILIDAD: 'Pendiente por disponibilidad', CANCELADO: 'Cancelado'
  };
  readonly claseEstado: Record<string, string> = {
    PENDIENTE_DESPACHO: 'estado-pendiente', EN_PREPARACION: 'estado-confirmada', DESPACHO_PARCIAL: 'estado-programada',
    DESPACHADO: 'estado-activa', PENDIENTE_DISPONIBILIDAD: 'estado-cancelada', CANCELADO: 'estado-inactiva',
    CONFIRMADO: 'estado-activa', REVERTIDO: 'estado-cancelada'
  };

  pestana: 'pendientes' | 'historial' = 'pendientes';
  esDespacho: boolean;
  esAdmin: boolean;

  // Pendientes
  pendientes: FormulaMedica[] = [];
  buscar = '';
  fecha = '';
  cargando = false;

  // Detalle de la formula
  detalle: DespachoFormula | null = null;
  /** Cantidad a tomar de cada lote: [formulaDetalleId][loteId] = cantidad. */
  asignacion: Record<number, Record<number, number>> = {};
  observacion = '';
  enviando = false;

  // Historial
  historial: Despacho[] = [];
  desde = fechaHoy().substring(0, 8) + '01';
  hasta = fechaHoy();

  private modal: Modal | null = null;

  constructor(private readonly despachoService: DespachoService, auth: AuthService) {
    this.esDespacho = auth.esDespacho();
    this.esAdmin = auth.esAdministrador();
    if (this.esAdmin) {
      this.pestana = 'historial';
      this.cargarHistorial();
    }
    this.cargarPendientes();
  }

  cargarPendientes() {
    this.cargando = true;
    this.despachoService.pendientes(this.buscar.trim(), this.fecha).subscribe({
      next: (data) => { this.pendientes = data; this.cargando = false; },
      error: (e: HttpErrorResponse) => { this.cargando = false; Swal.fire('Error', obtenerMensajeError(e), 'error'); }
    });
  }

  cargarHistorial() {
    this.despachoService.historial(this.desde, this.hasta).subscribe({
      next: (data) => this.historial = data,
      error: (e: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(e), 'error')
    });
  }

  // ------------------------------------------------------------------ preparar y entregar

  abrirFormula(formulaId: number) {
    this.despachoService.formula(formulaId).subscribe({
      next: (d) => {
        this.detalle = d;
        this.observacion = '';
        this.asignacion = {};
        // Por defecto se usan los lotes que vencen primero (FEFO)
        d.items.forEach((item) => {
          this.asignacion[item.formulaDetalleId] = {};
          item.sugerencia.forEach((s) => this.asignacion[item.formulaDetalleId][s.loteId] = s.cantidad);
        });
        const el = document.getElementById('modalDespacho');
        if (el) {
          this.modal ??= new Modal(el, { focus: false });
          this.modal.show();
        }
      },
      error: (e: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(e), 'error')
    });
  }

  /** Total que se entregara de un medicamento (suma de los lotes). */
  totalItem(item: DespachoItem): number {
    return Object.values(this.asignacion[item.formulaDetalleId] ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
  }

  /** Total de unidades a entregar en este despacho. */
  get totalEntrega(): number {
    return this.detalle?.items.reduce((a, i) => a + this.totalItem(i), 0) ?? 0;
  }

  get puedeOperar(): boolean {
    return this.esDespacho && !!this.detalle && ['PENDIENTE_DESPACHO', 'EN_PREPARACION', 'DESPACHO_PARCIAL', 'PENDIENTE_DISPONIBILIDAD']
      .includes(this.detalle.formula.estadoDespacho ?? '');
  }

  /** Revisa que ningun lote supere lo disponible ni ningun medicamento lo pendiente. */
  private validarAsignacion(): string | null {
    for (const item of this.detalle?.items ?? []) {
      for (const lote of item.lotesVigentes) {
        const cant = Number(this.asignacion[item.formulaDetalleId]?.[lote.id!] ?? 0);
        if (cant < 0) { return `${item.medicamentoNombre}: cantidades negativas no permitidas`; }
        if (cant > (lote.cantidadDisponible ?? 0)) { return `${item.medicamentoNombre}: el lote ${lote.numeroLote} solo tiene ${lote.cantidadDisponible}`; }
      }
      if (this.totalItem(item) > item.cantidadPendiente) {
        return `${item.medicamentoNombre}: no puede entregar más de lo pendiente (${item.cantidadPendiente})`;
      }
    }
    return null;
  }

  preparar() {
    this.despachoService.preparar(this.detalle!.formula.id!).subscribe({
      next: (r) => { Swal.fire('Listo', r.message, 'success'); this.abrirFormula(this.detalle!.formula.id!); this.cargarPendientes(); },
      error: (e: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(e), 'error')
    });
  }

  confirmar() {
    const error = this.validarAsignacion();
    if (error) { Swal.fire('Revise las cantidades', error, 'warning'); return; }
    if (this.totalEntrega === 0) { Swal.fire('Nada que entregar', 'Indique al menos una cantidad', 'info'); return; }
    const parcial = this.detalle!.items.some((i) => this.totalItem(i) < i.cantidadPendiente);
    Swal.fire({
      title: `¿Confirmar la entrega de ${this.totalEntrega} unidades?`,
      text: (parcial ? 'Es una entrega PARCIAL. ' : '') + 'El inventario se descuenta en este momento.',
      icon: 'question', showCancelButton: true, confirmButtonText: 'Confirmar entrega', cancelButtonText: 'Revisar'
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.enviando = true;
      const items = this.detalle!.items.map((i) => ({
        formulaDetalleId: i.formulaDetalleId,
        cantidad: this.totalItem(i),
        lotes: Object.entries(this.asignacion[i.formulaDetalleId] ?? {})
          .filter(([, c]) => Number(c) > 0).map(([loteId, c]) => ({ loteId: Number(loteId), cantidad: Number(c) }))
      })).filter((i) => i.cantidad > 0);
      this.despachoService.confirmar({ formulaId: this.detalle!.formula.id!, observacion: this.observacion, items }).subscribe({
        next: (rta) => {
          this.enviando = false;
          this.cargarPendientes();
          this.cargarHistorial();
          this.abrirFormula(this.detalle!.formula.id!);
          Swal.fire({ title: 'Despacho confirmado', text: rta.message + ' Puede imprimir el comprobante en el historial de la fórmula.', icon: 'success' });
        },
        error: (e: HttpErrorResponse) => { this.enviando = false; Swal.fire('No se pudo despachar', obtenerMensajeError(e), 'error'); }
      });
    });
  }

  sinDisponibilidad() {
    this.despachoService.sinDisponibilidad(this.detalle!.formula.id!, 'Sin existencias suficientes al momento de despachar').subscribe({
      next: (r) => { Swal.fire('Listo', r.message, 'success'); this.abrirFormula(this.detalle!.formula.id!); this.cargarPendientes(); },
      error: (e: HttpErrorResponse) => Swal.fire('No se pudo', obtenerMensajeError(e), 'warning')
    });
  }

  cancelar() {
    Swal.fire({ title: 'Cancelar el despacho', input: 'textarea', inputLabel: 'Motivo (mínimo 10 caracteres)',
      showCancelButton: true, confirmButtonText: 'Cancelar despacho', cancelButtonText: 'Volver',
      inputValidator: (v) => (!v || v.trim().length < 10) ? 'Escriba el motivo' : null
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.despachoService.cancelar(this.detalle!.formula.id!, r.value).subscribe({
        next: (rta) => { this.modal?.hide(); this.cargarPendientes(); Swal.fire('Listo', rta.message, 'success'); },
        error: (e: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(e), 'error')
      });
    });
  }

  // ------------------------------------------------------------------ historial

  comprobante(despachoId: number) {
    this.despachoService.comprobante(despachoId).subscribe({
      next: (pdf) => abrirPdf(pdf, `comprobante_despacho_${despachoId}.pdf`),
      error: () => Swal.fire('Error', 'No se pudo generar el comprobante', 'error')
    });
  }

  revertir(d: Despacho) {
    Swal.fire({ title: `Revertir despacho #${d.id}`, input: 'textarea',
      inputLabel: 'Motivo de la reversión (queda registrado)', showCancelButton: true, confirmButtonText: 'Revertir',
      cancelButtonText: 'Cancelar', inputValidator: (v) => (!v || v.trim().length < 10) ? 'Mínimo 10 caracteres' : null
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.despachoService.revertir(d.id, r.value).subscribe({
        next: (rta) => { this.cargarHistorial(); Swal.fire('Listo', rta.message, 'success'); },
        error: (e: HttpErrorResponse) => Swal.fire('No se pudo revertir', obtenerMensajeError(e), 'error')
      });
    });
  }

  resumenLineas(d: Despacho): string {
    return d.lineas.map((l) => `${l.medicamento} x${l.cantidad} (lote ${l.numeroLote})`).join(', ');
  }
}
