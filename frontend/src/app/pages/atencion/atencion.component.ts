import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Mensajes } from '../../core/mensajes';
import { Medicamento, Respuesta, Tarifa } from '../../core/models';
import { EstadoComponent } from '../../shared/estado.component';
import { ModalComponent } from '../../shared/modal.component';

/** Atención de la cita: historia clínica, servicios prestados, fórmulas y prefactura. */
@Component({
  selector: 'app-atencion',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyPipe, RouterLink, EstadoComponent, ModalComponent],
  templateUrl: './atencion.component.html'
})
export class AtencionComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  vias = ['ORAL', 'TOPICA', 'OFTALMICA', 'OTICA', 'SUBCUTANEA', 'INTRAMUSCULAR', 'INTRAVENOSA', 'INHALADA', 'RECTAL'];
  citaId = 0;
  datos: any = null;
  historia: any = {};
  tarifas: Tarifa[] = [];
  medicamentos: Medicamento[] = [];
  servicio: any = { cantidad: 1 };
  // fórmula
  modalFormula = false;
  formula: any = { detalles: [] };

  ngOnInit(): void {
    this.citaId = Number(this.route.snapshot.paramMap.get('citaId'));
    this.cargar();
    this.api.get<Tarifa[]>('/tarifa/listar', { soloActivas: true }).subscribe(t => this.tarifas = t);
    this.api.get<Medicamento[]>('/medicamento/listar', { filtro: 'TODOS' }).subscribe(m => this.medicamentos = m.filter(x => x.activo));
  }

  get enAtencion(): boolean { return this.datos?.cita?.estado === 'EN_ATENCION'; }
  get sePuedeIniciar(): boolean { return ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA'].includes(this.datos?.cita?.estado); }

  cargar(): void {
    this.api.get<any>('/atencion/cita', { citaId: this.citaId }).subscribe({
      next: d => {
        this.datos = d;
        const h = d.historia;
        this.historia = h ? { motivo: h.motivo, sintomas: h.sintomas, diagnostico: h.diagnostico, observaciones: h.observaciones,
          recomendaciones: h.recomendaciones, pesoKg: h.pesoKg, temperaturaC: h.temperaturaC } : { motivo: d.cita.motivo };
      },
      error: e => Mensajes.error(e)
    });
  }

  iniciar(): void {
    this.api.post<Respuesta>('/atencion/iniciar', {}, { citaId: this.citaId })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.cargar(); }, error: e => Mensajes.error(e) });
  }

  guardarHistoria(silencioso = false): void {
    if (!this.historia.motivo?.trim()) { Mensajes.aviso('Dato obligatorio', 'Registre el motivo de consulta.'); return; }
    this.api.put<Respuesta>('/atencion/historia', { ...this.historia, citaId: this.citaId })
      .subscribe({ next: r => { if (!silencioso) { Mensajes.exito(r.message); } this.cargar(); }, error: e => Mensajes.error(e) });
  }

  agregarServicio(): void {
    if (!this.servicio.tarifaId) { Mensajes.aviso('Servicio', 'Seleccione el servicio prestado.'); return; }
    this.api.post<Respuesta>('/atencion/servicio', { ...this.servicio, citaId: this.citaId }).subscribe({
      next: () => { this.servicio = { cantidad: 1 }; this.cargar(); }, error: e => Mensajes.error(e) });
  }

  quitarServicio(id: number): void {
    this.api.delete<Respuesta>('/atencion/servicio', { servicioId: id }).subscribe({ next: () => this.cargar(), error: e => Mensajes.error(e) });
  }

  async finalizar(): Promise<void> {
    if (!this.historia.diagnostico?.trim()) { Mensajes.aviso('Diagnóstico', 'Registre y guarde el diagnóstico antes de finalizar.'); return; }
    if (!await Mensajes.confirmar('Se cerrará la historia clínica y la cita quedará ATENDIDA.', 'Finalizar atención', 'Finalizar')) { return; }
    this.api.put<Respuesta>('/atencion/historia', { ...this.historia, citaId: this.citaId }).subscribe({
      next: () => this.api.post<Respuesta>('/atencion/finalizar', {}, { citaId: this.citaId }).subscribe({
        next: r => { Mensajes.exito(r.message + ' Puede descargar la prefactura.'); this.cargar(); }, error: e => Mensajes.error(e) }),
      error: e => Mensajes.error(e)
    });
  }

  prefactura(): void {
    this.api.descargar('/atencion/prefactura', { citaId: this.citaId }, 'prefactura.pdf').subscribe({ error: e => Mensajes.error(e) });
  }

  // ------------------------------------------------ fórmulas
  nuevaFormula(): void {
    this.formula = { citaId: this.citaId, indicaciones: '', detalles: [this.filaVacia()] };
    this.modalFormula = true;
  }

  editarFormula(f: any): void {
    this.formula = { id: f.id, citaId: this.citaId, indicaciones: f.indicaciones, detalles: f.detalles.map((d: any) => ({
      medicamentoId: d.medicamento.id, dosis: d.dosis, dosisCantidad: d.dosisCantidad, frecuenciaHoras: d.frecuenciaHoras,
      duracionDias: d.duracionDias, cantidadPrescrita: d.cantidadPrescrita, viaAdministracion: d.viaAdministracion, indicaciones: d.indicaciones })) };
    this.modalFormula = true;
  }

  filaVacia(): any { return { dosisCantidad: 1, frecuenciaHoras: 12, duracionDias: 5, viaAdministracion: 'ORAL', cantidadPrescrita: 10 }; }

  med(id: number): Medicamento | undefined { return this.medicamentos.find(m => m.id === id); }

  /** Cantidad total = dosis por toma x número de tomas (mismo cálculo del backend). */
  calcular(d: any): void {
    if (d.dosisCantidad > 0 && d.frecuenciaHoras > 0 && d.duracionDias > 0) {
      const tomas = Math.ceil((d.duracionDias * 24) / d.frecuenciaHoras);
      d.cantidadPrescrita = Math.ceil(d.dosisCantidad * tomas);
    }
  }

  guardarFormula(): void {
    const dets = this.formula.detalles;
    if (!dets.length) { Mensajes.aviso('Fórmula', 'Agregue al menos un medicamento.'); return; }
    const ids = dets.map((d: any) => d.medicamentoId);
    if (ids.some((x: any) => !x) || new Set(ids).size !== ids.length) { Mensajes.aviso('Fórmula', 'Seleccione cada medicamento una sola vez.'); return; }
    if (dets.some((d: any) => !d.dosis?.trim() || !(d.dosisCantidad > 0) || !(d.frecuenciaHoras >= 1) || !(d.duracionDias >= 1) || !(d.cantidadPrescrita >= 1))) {
      Mensajes.aviso('Fórmula', 'Complete dosis, frecuencia, duración y cantidad de cada medicamento.'); return;
    }
    const op = this.formula.id ? this.api.put<Respuesta>('/formula-medica/actualizar', this.formula)
      : this.api.post<Respuesta>('/formula-medica/guardar', this.formula);
    op.subscribe({ next: r => { this.modalFormula = false; this.cargar(); (r.message.includes('Advertencia') ? Mensajes.aviso('Fórmula guardada', r.message) : Mensajes.exito(r.message)); },
      error: e => Mensajes.error(e) });
  }

  async confirmarFormula(f: any): Promise<void> {
    if (!await Mensajes.confirmar('La fórmula se enviará a despacho y no podrá editarse.', 'Confirmar fórmula', 'Confirmar')) { return; }
    this.api.post<Respuesta>('/formula-medica/confirmar', {}, { formulaId: f.id }).subscribe({
      next: r => { this.cargar(); (r.message.includes('Advertencia') ? Mensajes.aviso('Fórmula confirmada', r.message) : Mensajes.exito(r.message)); },
      error: e => Mensajes.error(e) });
  }

  async anularFormula(f: any): Promise<void> {
    const motivo = await Mensajes.pedirTexto('Anular fórmula', 'Motivo de la anulación');
    if (!motivo) { return; }
    this.api.patch<Respuesta>('/formula-medica/anular', {}, { formulaId: f.id, motivo })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.cargar(); }, error: e => Mensajes.error(e) });
  }

  pdfFormula(f: any): void {
    this.api.descargar('/formula-medica/pdf', { formulaId: f.id }, 'formula.pdf').subscribe({ error: e => Mensajes.error(e) });
  }

  totalServicios(): number {
    return (this.datos?.servicios ?? []).reduce((s: number, x: any) => s + x.tarifa.valor * x.cantidad, 0);
  }
}
