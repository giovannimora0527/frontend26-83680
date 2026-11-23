import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { FacturaService } from './service/factura.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Factura } from 'src/app/models/clinica';
import { Mascota } from 'src/app/models/mascota';
import { AuthService } from 'src/app/services/auth.service';
import { abrirPdf, obtenerMensajeError, pesos } from 'src/app/utils/utilidades';

/**
 * Facturacion de servicios veterinarios: generar, pagar, anular y consultar el historial.
 */
@Component({
  selector: 'app-factura',
  imports: [CommonModule, FormsModule, NgbTooltipModule],
  templateUrl: './factura.component.html',
  styleUrl: './factura.component.scss'
})
export class FacturaComponent {
  readonly pesos = pesos;
  readonly nombresEstado: Record<string, string> = {
    PENDIENTE: 'Pendiente de pago', PAGO_PARCIAL: 'Pago parcial', PAGADA: 'Pagada', ANULADA: 'Anulada'
  };
  readonly claseEstado: Record<string, string> = {
    PENDIENTE: 'estado-programada', PAGO_PARCIAL: 'estado-confirmada', PAGADA: 'estado-activa', ANULADA: 'estado-cancelada'
  };

  pestana: 'por-facturar' | 'facturas' = 'por-facturar';
  esAdmin: boolean;

  citas: Cita[] = [];
  facturas: Factura[] = [];
  clientes: Cliente[] = [];
  mascotas: Mascota[] = [];
  filtroCliente: number | null = null;
  filtroMascota: number | null = null;
  filtroEstado = '';
  cargando = false;

  previa: Factura | null = null;
  descuento = 0;
  detalle: Factura | null = null;
  pago = { valor: 0, metodo: 'EFECTIVO', referencia: '' };
  enviando = false;

  private modales: Record<string, Modal> = {};

  constructor(private readonly facturaService: FacturaService,
    clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    auth: AuthService) {
    this.esAdmin = auth.esAdministrador();
    clienteService.listarClientes().subscribe({ next: (c) => this.clientes = c });
    this.cargarPorFacturar();
  }

  get totalesFacturas() {
    const validas = this.facturas.filter((f) => f.estado !== 'ANULADA');
    return {
      total: validas.reduce((a, f) => a + f.total, 0),
      pagado: validas.reduce((a, f) => a + f.totalPagado, 0),
      saldo: validas.reduce((a, f) => a + f.saldo, 0)
    };
  }

  cargarPorFacturar() {
    this.cargando = true;
    this.facturaService.porFacturar().subscribe({
      next: (c) => { this.citas = c; this.cargando = false; },
      error: (e: HttpErrorResponse) => { this.cargando = false; Swal.fire('Error', obtenerMensajeError(e), 'error'); }
    });
  }

  cargarFacturas() {
    this.cargando = true;
    this.facturaService.listar({ clienteId: this.filtroCliente, mascotaId: this.filtroMascota, estado: this.filtroEstado }).subscribe({
      next: (f) => { this.facturas = f; this.cargando = false; },
      error: (e: HttpErrorResponse) => { this.cargando = false; Swal.fire('Error', obtenerMensajeError(e), 'error'); }
    });
  }

  cambioCliente() {
    this.filtroMascota = null;
    this.mascotas = [];
    if (this.filtroCliente) {
      this.mascotaService.listarPorCliente(this.filtroCliente).subscribe({ next: (m) => this.mascotas = m });
    }
    this.cargarFacturas();
  }

  // ------------------------------------------------------------------ generar

  verPrevia(cita: Cita) {
    this.facturaService.previsualizar(cita.id!).subscribe({
      next: (f) => { this.previa = f; this.descuento = 0; this.abrir('modalPrevia'); },
      error: (e: HttpErrorResponse) => Swal.fire('No se puede facturar', obtenerMensajeError(e), 'error')
    });
  }

  generar() {
    if (!this.previa) { return; }
    if (this.descuento < 0 || this.descuento > this.previa.subtotal + this.previa.iva) {
      Swal.fire('Descuento no válido', 'Debe estar entre 0 y el valor de la factura', 'warning');
      return;
    }
    this.enviando = true;
    this.facturaService.generar(this.previa.citaId, Number(this.descuento) || 0).subscribe({
      next: (f) => {
        this.enviando = false;
        this.modales['modalPrevia']?.hide();
        this.cargarPorFacturar();
        Swal.fire({ title: `Factura ${f.numero} generada`, text: `Total ${pesos(f.total)}`, icon: 'success',
          showCancelButton: true, confirmButtonText: 'Ver PDF', cancelButtonText: 'Cerrar' })
          .then((r) => { if (r.isConfirmed) { this.verPdf(f.id!); } });
      },
      error: (e: HttpErrorResponse) => { this.enviando = false; Swal.fire('No se pudo generar', obtenerMensajeError(e), 'error'); }
    });
  }

  // ------------------------------------------------------------------ detalle, pagos y anulacion

  verDetalle(f: Factura) {
    this.facturaService.consultar(f.id!).subscribe({
      next: (d) => {
        this.detalle = d;
        this.pago = { valor: d.saldo, metodo: 'EFECTIVO', referencia: '' };
        this.abrir('modalFactura');
      },
      error: (e: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(e), 'error')
    });
  }

  registrarPago() {
    if (!this.detalle) { return; }
    if (!this.pago.valor || this.pago.valor <= 0 || this.pago.valor > this.detalle.saldo) {
      Swal.fire('Valor no válido', `Debe estar entre 1 y el saldo (${pesos(this.detalle.saldo)})`, 'warning');
      return;
    }
    if (this.pago.metodo !== 'EFECTIVO' && !this.pago.referencia.trim()) {
      Swal.fire('Falta la referencia', 'Es obligatoria para tarjeta o transferencia', 'warning');
      return;
    }
    this.enviando = true;
    this.facturaService.pagar({ facturaId: this.detalle.id!, valor: Number(this.pago.valor), metodo: this.pago.metodo,
      referencia: this.pago.referencia }).subscribe({
      next: (r) => { this.enviando = false; Swal.fire('Pago registrado', r.message, 'success'); this.verDetalle(this.detalle!); this.cargarFacturas(); },
      error: (e: HttpErrorResponse) => { this.enviando = false; Swal.fire('No se pudo registrar', obtenerMensajeError(e), 'error'); }
    });
  }

  anular(f: Factura) {
    Swal.fire({ title: `Anular factura ${f.numero}`, text: 'La factura no se borra: queda anulada con su historial.',
      input: 'textarea', inputLabel: 'Motivo (mínimo 10 caracteres)', showCancelButton: true,
      confirmButtonText: 'Anular', cancelButtonText: 'Cancelar',
      inputValidator: (v) => (!v || v.trim().length < 10) ? 'Escriba el motivo' : null
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.facturaService.anular(f.id!, r.value).subscribe({
        next: (rta) => { this.modales['modalFactura']?.hide(); this.cargarFacturas(); this.cargarPorFacturar(); Swal.fire('Listo', rta.message, 'success'); },
        error: (e: HttpErrorResponse) => Swal.fire('No se pudo anular', obtenerMensajeError(e), 'error')
      });
    });
  }

  verPdf(facturaId: number) {
    this.facturaService.pdf(facturaId).subscribe({
      next: (pdf) => abrirPdf(pdf, `factura_${facturaId}.pdf`),
      error: () => Swal.fire('Error', 'No se pudo generar el PDF', 'error')
    });
  }

  private abrir(id: string) {
    const el = document.getElementById(id);
    if (el) {
      this.modales[id] ??= new Modal(el, { focus: false });
      this.modales[id].show();
    }
  }
}
