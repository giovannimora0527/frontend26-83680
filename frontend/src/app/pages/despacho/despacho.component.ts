import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Mensajes } from '../../core/mensajes';
import { Medicamento, Respuesta } from '../../core/models';
import { hoyISO, sumarDias } from '../../core/util';
import { EstadoComponent } from '../../shared/estado.component';
import { ModalComponent } from '../../shared/modal.component';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

/** Despacho y dispensación (perfil DESPACHO_MEDICO). Las dosis y cantidades prescritas son de sólo lectura. */
@Component({
  selector: 'app-despacho',
  standalone: true,
  imports: [OrdenComponent, PaginadorComponent, FormsModule, DatePipe, EstadoComponent, ModalComponent],
  templateUrl: './despacho.component.html'
})
export class DespachoComponent implements OnInit {
  tablaM = new Tabla<any>({ fecha: x => x.fecha, despacho: x => x.numeroDespacho, formula: x => x.formula, mascota: x => x.mascota, prop: x => x.propietario, lote: x => x.lote, cantidad: x => x.cantidad, usuario: x => x.usuarioDespacho }, { campo: 'fecha', ascendente: false });
  tablaH = new Tabla<any>({ numero: x => x.numero, fecha: x => x.fechaDespacho, formula: x => x.formula.numero, medico: x => (x.formula.medico.nombres + ' ' + x.formula.medico.apellidos), usuario: x => x.usuario.nombreCompleto }, { campo: 'fecha', ascendente: false });
  private api = inject(ApiService);
  tab: 'p' | 'h' | 'm' = 'p';
  estadosBandeja = ['PENDIENTE_DESPACHO', 'EN_PREPARACION', 'DESPACHO_PARCIAL', 'PENDIENTE_DISPONIBILIDAD'];
  b: any = { numero: '', propietario: '', mascota: '', fecha: '', estado: '' };
  pendientes: any[] = [];
  prep: any = null;
  cantidades: Record<number, number> = {};
  observaciones = '';
  enviando = false;
  // historial
  hDesde = sumarDias(hoyISO(), -30); hHasta = hoyISO(); hTexto = '';
  despachos: any[] = [];
  detalle: any = null;
  estadosFormula: any[] = [];
  // por medicamento
  medicamentos: Medicamento[] = [];
  medSel: number | null = null;
  dispensaciones: any[] = [];

  ngOnInit(): void {
    this.buscar();
    this.api.get<Medicamento[]>('/medicamento/listar').subscribe(m => this.medicamentos = m);
  }

  buscar(): void {
    this.api.get<any[]>('/despacho/pendientes', this.b).subscribe({ next: p => this.pendientes = p, error: e => Mensajes.error(e) });
  }

  preparar(f: any): void {
    this.api.post<any>('/despacho/preparar', {}, { formulaId: f.id }).subscribe({
      next: p => {
        this.prep = p; this.observaciones = ''; this.cantidades = {};
        p.items.forEach((it: any) => it.lotes.forEach((l: any) => this.cantidades[l.loteId] = l.cantidadSugerida));
        this.buscar();
      }, error: e => Mensajes.error(e) });
  }

  totalItem(it: any): number { return it.lotes.reduce((s: number, l: any) => s + (Number(this.cantidades[l.loteId]) || 0), 0); }

  itemValido(it: any): boolean {
    return this.totalItem(it) <= it.pendiente && it.lotes.every((l: any) => {
      const c = Number(this.cantidades[l.loteId]) || 0;
      return c >= 0 && c <= l.disponible && (!l.vencido || c === 0);
    });
  }

  totalGeneral(): number { return (this.prep?.items ?? []).reduce((s: number, it: any) => s + this.totalItem(it), 0); }

  async confirmar(): Promise<void> {
    if (!this.prep.items.every((it: any) => this.itemValido(it))) {
      Mensajes.aviso('Cantidades inválidas', 'Revise que no supere lo pendiente ni las existencias por lote, y que no use lotes vencidos.'); return;
    }
    const items: any[] = [];
    this.prep.items.forEach((it: any) => it.lotes.forEach((l: any) => {
      const c = Number(this.cantidades[l.loteId]) || 0;
      if (c > 0) { items.push({ formulaDetalleId: it.formulaDetalleId, loteId: l.loteId, cantidad: c }); }
    }));
    if (!items.length) { Mensajes.aviso('Sin entregas', 'Indique al menos una cantidad o marque la fórmula como pendiente por disponibilidad.'); return; }
    const parcial = this.prep.items.some((it: any) => this.totalItem(it) < it.pendiente);
    if (!await Mensajes.confirmar(`${parcial ? 'Entrega PARCIAL. ' : ''}Se descontarán ${this.totalGeneral()} unidades del inventario.`, 'Confirmar despacho', 'Confirmar entrega')) { return; }
    this.enviando = true;
    this.api.post<Respuesta>('/despacho/confirmar', { formulaId: this.prep.formula.id, claveIdempotencia: this.prep.claveIdempotencia,
      observaciones: this.observaciones, items }).subscribe({
      next: async r => {
        this.enviando = false; this.prep = null; this.buscar();
        if (await Mensajes.confirmar(r.message + ' ¿Descargar el comprobante de despacho?', 'Despacho registrado', 'Descargar PDF')) { this.comprobante(r.id!); }
      },
      error: e => { this.enviando = false; Mensajes.error(e, 'Despacho no registrado (el inventario no se modificó)'); }
    });
  }

  pendienteDisponibilidad(): void {
    this.api.patch<Respuesta>('/despacho/pendiente-disponibilidad', {}, { formulaId: this.prep.formula.id, observacion: this.observaciones })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.prep = null; this.buscar(); }, error: e => Mensajes.error(e) });
  }

  async cancelarDespacho(f: any): Promise<void> {
    const motivo = await Mensajes.pedirTexto('Cancelar despacho', 'Motivo de la cancelación (procedimiento autorizado)', 10);
    if (!motivo) { return; }
    this.api.patch<Respuesta>('/despacho/cancelar', {}, { formulaId: f.id, motivo })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.prep = null; this.buscar(); }, error: e => Mensajes.error(e) });
  }

  formulaPdf(id: number): void { this.api.descargar('/despacho/formula-pdf', { formulaId: id }, 'formula.pdf').subscribe({ error: e => Mensajes.error(e) }); }
  comprobante(id: number): void { this.api.descargar('/despacho/comprobante', { despachoId: id }, 'comprobante.pdf').subscribe({ error: e => Mensajes.error(e) }); }

  // ------------------------------------------------ historial
  cargarHistorial(): void {
    this.tab = 'h';
    this.api.get<any[]>('/despacho/historial', { fechaInicial: this.hDesde, fechaFinal: this.hHasta, texto: this.hTexto })
      .subscribe({ next: d => this.despachos = d, error: e => Mensajes.error(e) });
  }

  verDetalle(d: any): void {
    this.detalle = d; this.estadosFormula = [];
    this.api.get<any[]>('/despacho/estados', { formulaId: d.formula.id }).subscribe(e => this.estadosFormula = e);
  }

  async revertir(d: any): Promise<void> {
    const motivo = await Mensajes.pedirTexto('Revertir dispensación ' + d.numero,
      'Motivo de la reversión. Las unidades regresan a sus lotes y queda trazabilidad.', 10);
    if (!motivo) { return; }
    this.api.patch<Respuesta>('/despacho/revertir', {}, { despachoId: d.id, motivo })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.detalle = null; this.cargarHistorial(); }, error: e => Mensajes.error(e) });
  }

  // ------------------------------------------------ por medicamento
  cargarDispensaciones(): void {
    if (!this.medSel) { return; }
    this.api.get<any[]>('/despacho/por-medicamento', { medicamentoId: this.medSel }).subscribe(d => this.dispensaciones = d);
  }
}
