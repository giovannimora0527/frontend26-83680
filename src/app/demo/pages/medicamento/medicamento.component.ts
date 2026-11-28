import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Medicamento } from 'src/app/models/medicamento';
import { MedicamentoService } from './service/medicamento.service';
import { getJwtPayload } from 'src/app/utils/jwt.util';
import Swal from 'sweetalert2';

type ColumnaOrden = 'nombre' | 'tipo' | 'cantidadActual' | 'fechaVence';
type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (element: Element) => ModalBootstrap } };

interface FilaError { fila: number; motivo: string; nombre: string; }
interface CargaPreview { registrosValidos: Medicamento[]; registrosConError: FilaError[]; totalValidos: number; totalErrores: number; }

@Component({
  selector: 'app-medicamento',
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './medicamento.component.html',
  styleUrl: './medicamento.component.scss'
})
export class MedicamentoComponent {

  modalInstance: ModalBootstrap | null = null;
  modalCargaInstance: ModalBootstrap | null = null;
  titleModal = '';
  modoFormulario = '';
  titleBoton = '';

  listMedicamentos: Medicamento[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 8;
  columnaOrden: ColumnaOrden = 'nombre';
  direccionOrden: 'asc' | 'desc' = 'asc';

  form!: FormGroup;
  medicamentoSelected: Medicamento | null = null;
  enviando = false;
  respuestaError = '';
  errorMedicamentos = '';

  // Lotes
  modalLotesInstance: ModalBootstrap | null = null;
  medicamentoLotes: Medicamento | null = null;
  listLotes: any[] = [];
  cargandoLotes = false;

  // Carga masiva
  archivoCarga: File | null = null;
  cargandoArchivo = false;
  confirmandoCarga = false;
  errorCarga = '';
  preview: CargaPreview | null = null;

  get esDespachoMedico(): boolean {
    const payload = getJwtPayload();
    if (!payload) return false;
    const rol = payload.rol.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return rol === 'despacho_medico';
  }

  constructor(
    private readonly medicamentoService: MedicamentoService,
    private readonly formBuilder: FormBuilder
  ) {
    this.inicializarFormulario();
    this.listar();
  }

  inicializarFormulario(): void {
    this.form = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.pattern(/\S/)]],
      tipo: ['MEDICAMENTO', Validators.required],
      descripcion: [''],
      presentacion: [''],
      registroInvima: [''],
      precioCompra: [null],
      precioVenta: [null],
      cantidadActual: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [0, [Validators.required, Validators.min(0)]],
      fechaCompra: ['', Validators.required],
      fechaVence: ['', Validators.required],
      fechaProximoPedido: ['']
    });

    this.form.get('tipo')!.valueChanges.subscribe(tipo => {
      const ctrl = this.form.get('registroInvima')!;
      if (tipo === 'MEDICAMENTO') {
        ctrl.setValidators([Validators.required, Validators.pattern(/\S/)]);
      } else {
        ctrl.clearValidators();
      }
      ctrl.updateValueAndValidity();
    });
  }

  get f(): { [key: string]: AbstractControl } { return this.form.controls; }

  listar(): void {
    this.errorMedicamentos = '';
    this.medicamentoService.listarMedicamentos().subscribe({
      next: (data) => {
        this.listMedicamentos = data;
        this.paginaActual = Math.min(this.paginaActual, this.totalPaginas || 1);
      },
      error: (err) => {
        this.errorMedicamentos = 'No fue posible cargar los medicamentos.';
        console.error(err);
      }
    });
  }

  private toDateStr(val: Date | string | undefined | null): string {
    if (!val) return '';
    if (typeof val === 'string') return val.substring(0, 10);
    return new Date(val).toISOString().substring(0, 10);
  }

  // ── Estado de stock ──────────────────────────────────────────────────────

  estadoStock(m: Medicamento): 'agotado' | 'bajo' | 'proximo' | 'vencido' | 'ok' {
    const hoy = new Date();
    const vence = m.fechaVence ? new Date(m.fechaVence) : null;
    if (vence && vence < hoy) return 'vencido';
    if ((m.cantidadActual ?? 0) === 0) return 'agotado';
    if ((m.cantidadActual ?? 0) <= (m.stockMinimo ?? 0)) return 'bajo';
    if (vence) {
      const diasRestantes = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      if (diasRestantes <= 30) return 'proximo';
    }
    return 'ok';
  }

  badgeEstado(estado: string): string {
    return { agotado: 'bg-danger', bajo: 'bg-warning text-dark', proximo: 'bg-info text-dark', vencido: 'bg-dark', ok: 'bg-success' }[estado] ?? 'bg-secondary';
  }

  labelEstado(estado: string): string {
    return { agotado: 'Agotado', bajo: 'Stock bajo', proximo: 'Próx. a vencer', vencido: 'Vencido', ok: 'Disponible' }[estado] ?? estado;
  }

  // ── Filtrado / paginación ────────────────────────────────────────────────

  get medicamentosFiltrados(): Medicamento[] {
    const termino = this.normalizar(this.terminoBusqueda.trim());
    const filtrados = this.listMedicamentos.filter((m) => {
      if (!termino) return true;
      return [m.nombre, m.tipo, m.codigo, m.presentacion, m.registroInvima].some(v =>
        this.normalizar(String(v ?? '')).includes(termino)
      );
    });
    return [...filtrados].sort((a, b) => {
      let va = '', vb = '';
      if (this.columnaOrden === 'nombre') { va = a.nombre ?? ''; vb = b.nombre ?? ''; }
      else if (this.columnaOrden === 'tipo') { va = a.tipo ?? ''; vb = b.tipo ?? ''; }
      else if (this.columnaOrden === 'cantidadActual') { va = String(a.cantidadActual ?? 0); vb = String(b.cantidadActual ?? 0); }
      else if (this.columnaOrden === 'fechaVence') { va = this.toDateStr(a.fechaVence); vb = this.toDateStr(b.fechaVence); }
      const cmp = va.localeCompare(vb, 'es', { numeric: true, sensitivity: 'base' });
      return this.direccionOrden === 'asc' ? cmp : -cmp;
    });
  }

  ordenarPor(col: ColumnaOrden): void {
    this.columnaOrden = col === this.columnaOrden ? this.columnaOrden : col;
    this.direccionOrden = col === this.columnaOrden && this.direccionOrden === 'asc' ? 'desc' : 'asc';
    this.columnaOrden = col;
    this.paginaActual = 1;
  }

  get medicamentosPaginados(): Medicamento[] {
    const ini = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.medicamentosFiltrados.slice(ini, ini + this.registrosPorPagina);
  }
  get totalPaginas(): number { return Math.ceil(this.medicamentosFiltrados.length / this.registrosPorPagina); }
  get paginas(): number[] { return Array.from({ length: this.totalPaginas }, (_, i) => i + 1); }
  actualizarBusqueda(e: Event): void { this.terminoBusqueda = (e.target as HTMLInputElement).value; this.paginaActual = 1; }
  cambiarPagina(p: number): void { if (p >= 1 && p <= this.totalPaginas) this.paginaActual = p; }
  private normalizar(t: string): string { return t.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  nuevoMedicamento(): void {
    this.modoFormulario = 'C';
    this.medicamentoSelected = null;
    this.resetFormulario();
    this.openModal('C');
  }

  resetFormulario(): void {
    this.form.reset({ tipo: 'MEDICAMENTO', cantidadActual: 0, stockMinimo: 0 });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.respuestaError = '';
  }

  abrirEdicion(m: Medicamento): void {
    this.medicamentoSelected = m;
    this.modoFormulario = 'E';
    this.form.patchValue({
      nombre: m.nombre,
      tipo: m.tipo ?? 'MEDICAMENTO',
      descripcion: m.descripcion ?? '',
      presentacion: m.presentacion ?? '',
      registroInvima: m.registroInvima ?? '',
      precioCompra: m.precioCompra ?? null,
      precioVenta: m.precioVenta ?? null,
      cantidadActual: m.cantidadActual ?? 0,
      stockMinimo: m.stockMinimo ?? 0,
      fechaCompra: this.toDateStr(m.fechaCompra),
      fechaVence: this.toDateStr(m.fechaVence),
      fechaProximoPedido: this.toDateStr(m.fechaProximoPedido)
    });
    this.respuestaError = '';
    this.openModal('E');
  }

  guardarMedicamento(): void {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: Medicamento = {
      id: this.modoFormulario === 'E' ? this.medicamentoSelected!.id : undefined,
      nombre: v.nombre.trim(),
      tipo: v.tipo,
      descripcion: v.descripcion?.trim() || null,
      presentacion: v.presentacion?.trim() || null,
      registroInvima: v.registroInvima?.trim() || null,
      precioCompra: v.precioCompra,
      precioVenta: v.precioVenta,
      cantidadActual: v.cantidadActual,
      stockMinimo: v.stockMinimo,
      fechaCompra: v.fechaCompra,
      fechaVence: v.fechaVence,
      fechaProximoPedido: v.fechaProximoPedido || null
    };
    this.enviando = true;
    this.respuestaError = '';
    this.medicamentoService.guardar(payload).subscribe({
      next: (resp) => {
        this.enviando = false;
        const msg = this.extraerMensaje(resp, this.modoFormulario === 'C' ? 'Medicamento creado.' : 'Medicamento actualizado.');
        this.closeModal();
        this.listar();
        void Swal.fire('Operación exitosa', msg, 'success');
      },
      error: (err) => {
        this.enviando = false;
        this.respuestaError = err?.error?.message ?? err?.error?.mensaje ?? 'No fue posible guardar el medicamento.';
      }
    });
  }

  private extraerMensaje(r: unknown, def: string): string {
    if (r && typeof r === 'object') {
      const o = r as { mensaje?: unknown; message?: unknown };
      const m = o.mensaje ?? o.message;
      if (typeof m === 'string') return m;
    }
    return def;
  }

  closeModal(): void { this.modalInstance?.hide(); this.resetFormulario(); }
  openModal(modo: string): void {
    this.titleModal = modo === 'C' ? 'Crear Medicamento' : 'Editar Medicamento';
    this.titleBoton = modo === 'C' ? 'Guardar' : 'Actualizar';
    this.modoFormulario = modo;
    const el = document.getElementById('modalCrearMedicamento');
    if (el) {
      this.modalInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
      this.modalInstance.show();
    }
  }

  // ── Carga masiva ─────────────────────────────────────────────────────────

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoCarga = input.files?.[0] ?? null;
    this.preview = null;
    this.errorCarga = '';
  }

  previsualizarArchivo(): void {
    if (!this.archivoCarga) return;
    this.cargandoArchivo = true;
    this.errorCarga = '';
    this.preview = null;
    this.medicamentoService.previsualizarCargaMasiva(this.archivoCarga).subscribe({
      next: (resp) => {
        this.cargandoArchivo = false;
        this.preview = resp as CargaPreview;
      },
      error: (err) => {
        this.cargandoArchivo = false;
        this.errorCarga = err?.error?.message ?? 'Error al procesar el archivo.';
      }
    });
  }

  confirmarImportacion(): void {
    if (!this.preview?.registrosValidos?.length) return;
    this.confirmandoCarga = true;
    this.medicamentoService.confirmarCargaMasiva(this.preview.registrosValidos).subscribe({
      next: (resp) => {
        this.confirmandoCarga = false;
        this.closeCargaModal();
        this.listar();
        const msg = this.extraerMensaje(resp, 'Importación completada.');
        void Swal.fire('Importación exitosa', msg, 'success');
      },
      error: (err) => {
        this.confirmandoCarga = false;
        this.errorCarga = err?.error?.message ?? 'Error al confirmar la importación.';
      }
    });
  }

  calcularTotalLotes(): number {
    return this.listLotes.reduce((acc, l) => acc + (l.cantidad ?? 0), 0);
  }

  verLotes(m: Medicamento): void {
    this.medicamentoLotes = m;
    this.listLotes = [];
    this.cargandoLotes = true;
    const el = document.getElementById('modalLotesMedicamento');
    if (el) {
      this.modalLotesInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
      this.modalLotesInstance.show();
    }
    this.medicamentoService.listarLotes(m.id!).subscribe({
      next: (lotes) => { this.listLotes = lotes; this.cargandoLotes = false; },
      error: () => { this.cargandoLotes = false; }
    });
  }

  abrirCargaMasiva(): void {
    this.archivoCarga = null;
    this.preview = null;
    this.errorCarga = '';
    const el = document.getElementById('modalCargaMasiva');
    if (el) {
      this.modalCargaInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
      this.modalCargaInstance.show();
    }
  }

  closeCargaModal(): void {
    this.modalCargaInstance?.hide();
    this.archivoCarga = null;
    this.preview = null;
    this.errorCarga = '';
  }

  descargarPlantilla(): void {
    const filas = [
      ['nombre', 'tipo', 'descripcion', 'presentacion', 'registroInvima',
       'precioCompra', 'precioVenta', 'cantidadActual', 'stockMinimo',
       'fechaCompra(yyyy-MM-dd)', 'fechaVence(yyyy-MM-dd)', 'fechaProximoPedido(yyyy-MM-dd)'],
      ['Amoxicilina 500mg', 'MEDICAMENTO', 'Antibiótico de amplio espectro',
       'Tabletas 500mg', 'INVIMA2024M-0001234', '5000', '8000', '100', '20',
       '2024-01-15', '2026-01-15', '2025-10-01'],
      ['Jeringa 5ml', 'UTENSILIO', 'Jeringa desechable', 'Unidad', '',
       '200', '350', '500', '50', '2024-03-01', '2027-03-01', '']
    ];
    const csv = '﻿' + filas.map(f => f.join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_medicamentos.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
