import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Mensajes } from '../../core/mensajes';
import { Cita, Respuesta } from '../../core/models';
import { contiene, hoyISO, sumarDias } from '../../core/util';
import { EstadoComponent } from '../../shared/estado.component';
import { ModalComponent } from '../../shared/modal.component';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [OrdenComponent, PaginadorComponent, FormsModule, CurrencyPipe, DatePipe, EstadoComponent, ModalComponent],
  templateUrl: './facturacion.component.html'
})
export class FacturacionComponent implements OnInit {
  private api = inject(ApiService);
  esAdmin = inject(AuthService).tienePerfil('ADMIN');
  tab: 'p' | 'f' = 'p';
  pendientes: Cita[] = [];
  facturas: any[] = [];
  desde = sumarDias(hoyISO(), -60);
  hasta = hoyISO();
  estado = '';
  filtro = '';
  tabla = new Tabla<any>({ numero: x => x.numero, fecha: x => x.fechaGeneracion, prop: x => (x.cliente.nombres + ' ' + x.cliente.apellidos), mascota: x => x.mascota.nombreMascota, medico: x => (x.medico.nombres + ' ' + x.medico.apellidos), estado: x => x.estado, total: x => Number(x.total), pagado: x => Number(x.totalPagado), saldo: x => Number(x.saldo) }, { campo: 'fecha', ascendente: false });
  // generación
  citaFacturar: Cita | null = null;
  vista: any = null;
  descuento = 0;
  observaciones = '';
  // detalle
  factura: any = null;
  historial: any[] = [];
  pago: any = { metodoPago: 'EFECTIVO' };
  metodos = ['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA'];

  ngOnInit(): void { this.cargarPendientes(); this.cargarFacturas(); }

  cargarPendientes(): void { this.api.get<Cita[]>('/factura/citas-por-facturar').subscribe({ next: c => this.pendientes = c, error: e => Mensajes.error(e) }); }

  cargarFacturas(): void {
    this.api.get<any[]>('/factura/listar', { fechaInicial: this.desde, fechaFinal: this.hasta, estado: this.estado })
      .subscribe({ next: f => this.facturas = f, error: e => Mensajes.error(e) });
  }

  facturasFiltradas(): any[] {
    return this.facturas.filter(f => contiene(this.filtro, [f.numero, f.cliente.nombres + ' ' + f.cliente.apellidos, f.mascota.nombreMascota, f.cliente.numeroDocumento]));
  }

  abrirGenerar(c: Cita): void {
    this.citaFacturar = c; this.descuento = 0; this.observaciones = ''; this.calcular();
  }

  calcular(): void {
    if (!this.citaFacturar) { return; }
    if (this.descuento < 0 || this.descuento > 100) { Mensajes.aviso('Descuento', 'El descuento debe estar entre 0 y 100%.'); return; }
    this.api.get<any>('/factura/calcular', { citaId: this.citaFacturar.id, porcentajeDescuento: this.descuento || 0 })
      .subscribe({ next: v => this.vista = v, error: e => { Mensajes.error(e); this.citaFacturar = null; } });
  }

  async generar(): Promise<void> {
    if (!await Mensajes.confirmar(`Total a facturar: ${this.vista.total}`, 'Generar factura', 'Generar')) { return; }
    this.api.post<Respuesta>('/factura/generar', { citaId: this.citaFacturar!.id, porcentajeDescuento: this.descuento || 0, observaciones: this.observaciones })
      .subscribe({ next: r => {
        Mensajes.exito(r.message); this.citaFacturar = null; this.cargarPendientes(); this.cargarFacturas();
        if (r.id) { this.ver(r.id); }
      }, error: e => Mensajes.error(e) });
  }

  ver(id: number): void {
    this.api.get<any>('/factura/consultar', { facturaId: id }).subscribe({ next: f => {
      this.factura = f; this.pago = { metodoPago: 'EFECTIVO', valor: f.saldo };
      this.api.get<any[]>('/factura/historial', { facturaId: id }).subscribe(h => this.historial = h);
    }, error: e => Mensajes.error(e) });
  }

  registrarPago(): void {
    const v = Number(this.pago.valor);
    if (!(v > 0) || v > this.factura.saldo) { Mensajes.aviso('Valor inválido', 'El pago debe ser mayor a 0 y no superar el saldo.'); return; }
    if (this.pago.metodoPago !== 'EFECTIVO' && !this.pago.referencia?.trim()) { Mensajes.aviso('Referencia', 'Ingrese la referencia del pago.'); return; }
    this.api.post<Respuesta>('/factura/pago', { ...this.pago, facturaId: this.factura.id })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.ver(this.factura.id); this.cargarFacturas(); }, error: e => Mensajes.error(e) });
  }

  async anularPago(p: any): Promise<void> {
    const motivo = await Mensajes.pedirTexto('Anular pago', 'Motivo (queda en la trazabilidad)');
    if (!motivo) { return; }
    this.api.patch<Respuesta>('/factura/pago/anular', {}, { pagoId: p.id, motivo })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.ver(this.factura.id); this.cargarFacturas(); }, error: e => Mensajes.error(e) });
  }

  async anular(): Promise<void> {
    const motivo = await Mensajes.pedirTexto('Anular factura', 'Motivo de la anulación. Los registros no se eliminan.', 10);
    if (!motivo) { return; }
    this.api.patch<Respuesta>('/factura/anular', {}, { facturaId: this.factura.id, motivo })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.ver(this.factura.id); this.cargarFacturas(); this.cargarPendientes(); }, error: e => Mensajes.error(e) });
  }

  agregarDispensados(): void {
    this.api.post<Respuesta>('/factura/agregar-dispensados', {}, { facturaId: this.factura.id })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.ver(this.factura.id); this.cargarFacturas(); }, error: e => Mensajes.error(e) });
  }

  pdf(id: number): void {
    this.api.descargar('/factura/pdf', { facturaId: id }, 'factura.pdf').subscribe({ error: e => Mensajes.error(e) });
  }

  prefactura(citaId: number): void {
    this.api.descargar('/atencion/prefactura', { citaId }, 'prefactura.pdf').subscribe({ error: e => Mensajes.error(e) });
  }
}
