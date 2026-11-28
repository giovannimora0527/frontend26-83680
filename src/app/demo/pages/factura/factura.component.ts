import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin } from 'rxjs';
import { Factura, FacturaItem } from 'src/app/models/factura';
import { Cita } from 'src/app/models/cita';
import { FacturaService } from './service/factura.service';
import { CitaService } from '../cita/service/cita.service';
import { TarifaService } from '../tarifa/service/tarifa.service';
import { FormulaService } from '../formula-medica/service/formula.service';
import { AnotacionHistoriaService } from '../historia/service/anotacion-historia.service';
import { Tarifa } from 'src/app/models/tarifa';

type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (el: Element) => ModalBootstrap } };

@Component({
  selector: 'app-factura',
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './factura.component.html',
  styleUrl: './factura.component.scss'
})
export class FacturaComponent implements OnInit {
  listFacturas: Factura[] = [];
  listCitasSinFactura: Cita[] = [];
  listTarifas: Tarifa[] = [];
  facturaSeleccionada: Factura | null = null;
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 8;

  // IDs de citas ya facturadas, para excluirlas del selector
  private citasYaFacturadas = new Set<number>();

  // Formularios
  formFactura!: FormGroup;
  formPago!: FormGroup;
  items: FacturaItem[] = [];

  enviando = false;
  respuestaError = '';
  modalFacturaInstance: ModalBootstrap | null = null;
  modalPagoInstance: ModalBootstrap | null = null;
  modalDetalleInstance: ModalBootstrap | null = null;

  readonly METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

  cargandoItemsCita = false;

  constructor(
    private facturaService: FacturaService,
    private citaService: CitaService,
    private tarifaService: TarifaService,
    private formulaService: FormulaService,
    private anotacionService: AnotacionHistoriaService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.inicializarForms();
    this.tarifaService.listarActivas().subscribe({ next: d => this.listTarifas = d });
    this.cargarDatos();
  }

  cargarDatos() {
    forkJoin({
      facturas: this.facturaService.listar(),
      citas: this.citaService.listarCitas()
    }).subscribe({
      next: ({ facturas, citas }) => {
        this.listFacturas = facturas;
        this.citasYaFacturadas = new Set(
          facturas.map(f => f.cita?.id).filter((id): id is number => id != null)
        );
        this.listCitasSinFactura = citas.filter(c =>
          c.estado === 'FINALIZADA' && !this.citasYaFacturadas.has(c.id!)
        );
      },
      error: (err: any) => {
        console.error('Error al cargar facturas:', err?.error?.message ?? err);
      }
    });
  }

  inicializarForms() {
    this.formFactura = this.fb.group({
      citaId: [null, Validators.required],
      porcentajeDescuento: [0, [Validators.min(0), Validators.max(100)]],
      notas: ['']
    });

    this.formFactura.get('citaId')!.valueChanges.subscribe(citaId => {
      if (citaId) this.cargarItemsDeCita(Number(citaId));
    });
    this.formPago = this.fb.group({
      monto: [null, [Validators.required, Validators.min(0.01)]],
      metodoPago: ['EFECTIVO', Validators.required],
      notas: ['']
    });
  }

  listar() {
    this.cargarDatos();
  }

  get facturasFiltradas(): Factura[] {
    const t = this.terminoBusqueda.trim().toLowerCase();
    return this.listFacturas.filter(f => {
      if (!t) return true;
      const cliente = f.cita?.cliente;
      const mascota = f.cita?.mascota;
      return (
        (f.numero ?? '').toLowerCase().includes(t) ||
        (mascota?.nombreMascota ?? mascota?.nombre ?? '').toLowerCase().includes(t) ||
        (cliente?.nombres ?? '').toLowerCase().includes(t) ||
        (cliente?.apellidos ?? '').toLowerCase().includes(t) ||
        (cliente?.numeroDocumento ?? '').toLowerCase().includes(t) ||
        (f.estado ?? '').toLowerCase().includes(t)
      );
    });
  }

  get facturasPaginadas(): Factura[] {
    const i = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.facturasFiltradas.slice(i, i + this.registrosPorPagina);
  }

  get totalPaginas() { return Math.ceil(this.facturasFiltradas.length / this.registrosPorPagina); }
  get paginas() { return Array.from({ length: this.totalPaginas }, (_, i) => i + 1); }
  cambiarPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.paginaActual = p; }
  actualizarBusqueda(e: Event) { this.terminoBusqueda = (e.target as HTMLInputElement).value; this.paginaActual = 1; }

  // Calcula totales del formulario de nueva factura
  get subtotalItems(): number {
    return this.items.reduce((s, it) => s + (it.cantidad ?? 0) * (it.precioUnitario ?? 0), 0);
  }
  get ivaItems(): number {
    return this.items.reduce((s, it) => s + ((it.cantidad ?? 0) * (it.precioUnitario ?? 0)) * ((it.iva ?? 0) / 100), 0);
  }
  get descuentoMonetario(): number {
    const pct = Number(this.formFactura.value.porcentajeDescuento ?? 0);
    return (this.subtotalItems + this.ivaItems) * pct / 100;
  }
  get totalItems(): number {
    return this.subtotalItems + this.ivaItems - this.descuentoMonetario;
  }

  cargarItemsDeCita(citaId: number): void {
    const cita = this.listCitasSinFactura.find(c => c.id === citaId);
    if (!cita) return;

    this.cargandoItemsCita = true;
    this.items = [];

    // Obtener tipoServicio de la anotación de la cita, luego cargar fórmulas
    this.anotacionService.porCita(citaId).subscribe({
      next: anotacion => {
        const tipoServicio = anotacion?.tipoServicio ?? 'CONSULTA';
        this.agregarItemTarifa(cita, tipoServicio);
        this.cargarItemsMedicamentos(citaId);
      },
      error: () => {
        // Si no hay anotación, usa CONSULTA por defecto
        this.agregarItemTarifa(cita, 'CONSULTA');
        this.cargarItemsMedicamentos(citaId);
      }
    });
  }

  private agregarItemTarifa(cita: any, tipoServicio: string): void {
    const espId = cita.medico?.especializacion?.id;
    const tarifa = espId
      ? this.listTarifas.find(t =>
          t.especializacion?.id === espId &&
          t.tipoServicio === tipoServicio &&
          t.activa)
        // fallback: misma especialización, cualquier tipo activo
        ?? this.listTarifas.find(t => t.especializacion?.id === espId && t.activa)
      : null;

    if (tarifa) {
      const base = tarifa.valor ?? 0;
      const ivaAmt = base * ((tarifa.iva ?? 0) / 100);
      this.items.push({
        descripcion: `${tipoServicio} — ${tarifa.nombre}`,
        tipo: tipoServicio,
        cantidad: 1,
        precioUnitario: base,
        iva: tarifa.iva ?? 0,
        subtotal: base + ivaAmt
      });
    }
  }

  private cargarItemsMedicamentos(citaId: number): void {
    this.formulaService.listar().subscribe({
      next: formulas => {
        const deEstaCita = formulas.filter(f => f.cita?.id === citaId || f.citaId === citaId);
        for (const f of deEstaCita) {
          const med = f.medicamento;
          if (!med) continue;
          const cant = Number(f.cantidad) || 1;
          const precio = med.precioVenta ?? 0;
          this.items.push({
            descripcion: `Medicamento — ${med.nombre}`,
            tipo: 'MEDICAMENTO',
            cantidad: cant,
            precioUnitario: precio,
            iva: 0,
            subtotal: cant * precio
          });
        }
        this.cargandoItemsCita = false;
      },
      error: () => { this.cargandoItemsCita = false; }
    });
  }

  quitarItem(i: number) { this.items.splice(i, 1); }

  nuevaFactura() {
    this.items = [];
    this.formFactura.reset({ porcentajeDescuento: 0 });
    this.respuestaError = '';
    const el = document.getElementById('modalFactura');
    if (el) {
      this.modalFacturaInstance = new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
      this.modalFacturaInstance.show();
    }
  }

  guardarFactura() {
    if (this.formFactura.invalid) { this.formFactura.markAllAsTouched(); return; }
    if (this.items.length === 0) {
      this.respuestaError = 'Agregue al menos un ítem a la factura.';
      return;
    }
    this.enviando = true;
    const rq = {
      citaId: this.formFactura.value.citaId,
      descuento: this.descuentoMonetario,
      notas: this.formFactura.value.notas,
      items: this.items.map(it => ({
        descripcion: it.descripcion,
        tipo: it.tipo,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        iva: it.iva
      }))
    };
    this.facturaService.generar(rq).subscribe({
      next: (res: any) => {
        this.enviando = false;
        this.modalFacturaInstance?.hide();
        Swal.fire('Éxito', res.message, 'success');
        this.listar();
      },
      error: (err: any) => {
        this.enviando = false;
        this.respuestaError = err?.error?.message ?? 'Error al generar factura.';
      }
    });
  }

  verDetalle(f: Factura) {
    this.facturaSeleccionada = f;
    const el = document.getElementById('modalDetalle');
    if (el) {
      this.modalDetalleInstance = new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
      this.modalDetalleInstance.show();
    }
  }

  abrirPago(f: Factura) {
    this.facturaSeleccionada = f;
    this.formPago.reset({ metodoPago: 'EFECTIVO' });
    this.respuestaError = '';
    const el = document.getElementById('modalPago');
    if (el) {
      this.modalPagoInstance = new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
      this.modalPagoInstance.show();
    }
  }

  guardarPago() {
    if (this.formPago.invalid) { this.formPago.markAllAsTouched(); return; }
    this.enviando = true;
    const rq = { ...this.formPago.value, facturaId: this.facturaSeleccionada?.id };
    this.facturaService.registrarPago(rq).subscribe({
      next: (res: any) => {
        this.enviando = false;
        this.modalPagoInstance?.hide();
        Swal.fire('Éxito', res.message, 'success');
        this.listar();
      },
      error: (err: any) => {
        this.enviando = false;
        this.respuestaError = err?.error?.message ?? 'Error al registrar pago.';
      }
    });
  }

  anular(f: Factura) {
    Swal.fire({
      title: '¿Anular factura?',
      text: `Factura ${f.numero} — esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.facturaService.anular(f.id!).subscribe({
          next: (res: any) => { Swal.fire('Anulada', res.message, 'success'); this.listar(); },
          error: (err: any) => Swal.fire('Error', err?.error?.message ?? 'Error', 'error')
        });
      }
    });
  }

  badgeEstado(estado: string | undefined): string {
    switch (estado) {
      case 'PENDIENTE': return 'badge bg-warning text-dark';
      case 'PAGO_PARCIAL': return 'badge bg-info text-dark';
      case 'PAGADA': return 'badge bg-success';
      case 'ANULADA': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  generarPDF(f: Factura) {
    const doc = new jsPDF();
    const cita = f.cita;
    const cliente = cita?.cliente;
    const mascota = cita?.mascota;
    const medico = cita?.medico;

    // ── Encabezado clínica ──────────────────────────────────────────────────
    doc.setFontSize(18);
    doc.setTextColor(13, 110, 253);
    doc.text('CLÍNICA VETERINARIA', 105, 16, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('NIT: 900.000.001-9  |  Tel: (601) 123-4567  |  Calle 1 # 2-3, Bogotá', 105, 22, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('FACTURA DE SERVICIOS VETERINARIOS', 105, 29, { align: 'center' });

    doc.setDrawColor(180);
    doc.line(14, 33, 196, 33);

    // ── Columna izquierda: datos de la factura ──────────────────────────────
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('DATOS DE LA FACTURA', 14, 40);
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(`No. Factura:`, 14, 46);  doc.setFont('helvetica', 'bold'); doc.text(`${f.numero}`, 50, 46); doc.setFont('helvetica', 'normal');
    doc.text(`Fecha:`, 14, 52);        doc.text(`${new Date(f.fechaGeneracion ?? '').toLocaleDateString('es-CO')}`, 50, 52);
    doc.text(`Estado:`, 14, 58);       doc.text(`${f.estado}`, 50, 58);

    // ── Columna derecha: propietario, mascota, médico ───────────────────────
    doc.setTextColor(80);
    doc.text('PROPIETARIO', 110, 40);
    doc.setTextColor(0);
    doc.text(`Nombre:`,     110, 46); doc.text(`${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`, 140, 46);
    doc.text(`Documento:`,  110, 52); doc.text(`${cliente?.tipoDocumento ?? ''} ${cliente?.numeroDocumento ?? ''}`, 140, 52);
    doc.text(`Teléfono:`,   110, 58); doc.text(`${cliente?.telefono ?? '—'}`, 140, 58);

    doc.line(14, 63, 196, 63);

    // ── Mascota y médico ────────────────────────────────────────────────────
    doc.setTextColor(80);
    doc.text('MASCOTA', 14, 69);
    doc.setTextColor(0);
    doc.text(`Nombre:`, 14, 75); doc.text(`${mascota?.nombreMascota ?? mascota?.nombre ?? ''}`, 50, 75);
    doc.text(`Raza:`,   14, 81); doc.text(`${(mascota as any)?.raza?.nombre ?? '—'}`, 50, 81);

    doc.setTextColor(80);
    doc.text('VETERINARIO', 110, 69);
    doc.setTextColor(0);
    doc.text(`Médico:`,       110, 75); doc.text(`Dr/a. ${medico?.nombres ?? ''} ${medico?.apellidos ?? ''}`, 140, 75);
    doc.text(`Especialidad:`, 110, 81); doc.text(`${medico?.especializacion?.nombre ?? '—'}`, 140, 81);

    doc.line(14, 86, 196, 86);

    // Tabla de ítems
    autoTable(doc, {
      startY: 90,
      head: [['Descripción', 'Tipo', 'Cant.', 'P. Unitario', 'IVA %', 'Subtotal']],
      body: (f.items ?? []).map(it => [
        it.descripcion ?? '',
        it.tipo ?? '',
        (it.cantidad ?? 0).toString(),
        `$${(it.precioUnitario ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
        `${it.iva}%`,
        `$${(it.subtotal ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [13, 110, 253] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // Totales
    doc.setFontSize(10);
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`$${(f.subtotal ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 196, finalY, { align: 'right' });
    doc.text(`IVA:`, 140, finalY + 6);
    doc.text(`$${(f.totalIva ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 196, finalY + 6, { align: 'right' });
    if ((f.descuento ?? 0) > 0) {
      doc.text(`Descuento:`, 140, finalY + 12);
      doc.text(`-$${(f.descuento ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 196, finalY + 12, { align: 'right' });
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL:`, 140, finalY + 20);
    doc.text(`$${(f.total ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 196, finalY + 20, { align: 'right' });

    // Pagos
    if (f.pagos && f.pagos.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      autoTable(doc, {
        startY: finalY + 28,
        head: [['Pago', 'Fecha', 'Método', 'Monto']],
        body: f.pagos.map((p, i) => [
          `Pago ${i + 1}`,
          new Date(p.fechaPago ?? '').toLocaleDateString('es-CO'),
          p.metodoPago ?? '',
          `$${(p.monto ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [25, 135, 84] }
      });
    }

    if (f.notas) {
      const notasY = (doc as any).lastAutoTable?.finalY ?? finalY + 28;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Notas: ${f.notas}`, 14, notasY + 8);
    }

    doc.save(`Factura-${f.numero}.pdf`);
  }
}
