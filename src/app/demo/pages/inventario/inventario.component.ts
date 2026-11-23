import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { InventarioService } from './service/inventario.service';
import { CargaLog, CargaResultado, LoteRq, Movimiento, ProductoInventario } from 'src/app/models/inventario';
import { AuthService } from 'src/app/services/auth.service';
import { PaginacionComponent } from 'src/app/shared/paginacion/paginacion.component';
import { compararValores, fechaHoy, guardarArchivo, normalizarTexto, obtenerMensajeError, pesos } from 'src/app/utils/utilidades';

type Columna = 'codigo' | 'nombre' | 'tipo' | 'stock' | 'compra' | 'venta' | 'vence';

/**
 * Modulo de inventario: productos, lotes, movimientos y carga masiva.
 * El perfil DESPACHO_MEDICO solo consulta (no crea ni edita).
 */
@Component({
  selector: 'app-inventario',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule, PaginacionComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss'
})
export class InventarioComponent {
  readonly pesos = pesos;
  readonly hoy = fechaHoy();
  readonly nombresAlerta: Record<string, string> = {
    AGOTADO: 'Agotado', STOCK_BAJO: 'Stock bajo', POR_VENCER: 'Por vencer', VENCIDO: 'Lote vencido'
  };
  readonly claseAlerta: Record<string, string> = {
    AGOTADO: 'estado-cancelada', STOCK_BAJO: 'estado-programada', POR_VENCER: 'estado-confirmada', VENCIDO: 'estado-cancelada'
  };

  pestana: 'inventario' | 'carga' | 'logs' = 'inventario';
  puedeEditar: boolean;

  // Tabla
  productos: ProductoInventario[] = [];
  cargando = false;
  buscar = '';
  filtroTipo = '';
  filtroAlerta = '';
  pagina = 1;
  readonly porPagina = 8;
  columna: Columna = 'nombre';
  direccion: 'asc' | 'desc' = 'asc';

  // Formularios
  formProducto: FormGroup;
  formLote: FormGroup;
  productoEditando: ProductoInventario | null = null;
  productoLote: ProductoInventario | null = null;
  enviando = false;

  // Detalle
  detalle: ProductoInventario | null = null;
  movimientos: Movimiento[] = [];

  // Carga masiva
  archivo: File | null = null;
  vistaPrevia: CargaResultado | null = null;
  resultadoCarga: CargaResultado | null = null;
  soloErrores = false;
  procesando = false;
  logs: CargaLog[] = [];

  private modales: Record<string, Modal> = {};

  constructor(private readonly inventarioService: InventarioService, auth: AuthService, fb: FormBuilder) {
    this.puedeEditar = auth.esAdministrador();
    this.formProducto = fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{8}$/)]],
      nombre: ['', Validators.required],
      tipo: ['MEDICAMENTO', Validators.required],
      registroInvima: [''],
      presentacion: [''],
      descripcion: [''],
      precioVenta: [null, [Validators.required, Validators.min(1)]],
      ivaPorcentaje: [0, [Validators.min(0), Validators.max(100)]],
      stockMinimo: [0, [Validators.required, Validators.min(0)]],
      fechaProximoPedido: [''],
      activo: [true],
      conLote: [false],
      numeroLote: [''],
      cantidad: [null],
      precioCompra: [null],
      fechaCompra: [this.hoy],
      fechaVence: ['']
    });
    this.formLote = fb.group({
      numeroLote: ['', Validators.required],
      cantidad: [null, [Validators.required, Validators.min(1)]],
      precioCompra: [null, [Validators.required, Validators.min(1)]],
      fechaCompra: [this.hoy, Validators.required],
      fechaVence: ['']
    });
    this.listar();
  }

  /** Trae el inventario. */
  listar() {
    this.cargando = true;
    this.inventarioService.listar().subscribe({
      next: (data) => { this.productos = data; this.cargando = false; },
      error: (e: HttpErrorResponse) => { this.cargando = false; Swal.fire('Error', obtenerMensajeError(e), 'error'); }
    });
  }

  // ------------------------------------------------------------------ tabla

  /** Contadores de alertas para las tarjetas de resumen. */
  get resumen() {
    return {
      total: this.productos.length,
      agotados: this.productos.filter((p) => p.alertas?.includes('AGOTADO')).length,
      bajos: this.productos.filter((p) => p.alertas?.includes('STOCK_BAJO')).length,
      porVencer: this.productos.filter((p) => p.alertas?.includes('POR_VENCER')).length,
      vencidos: this.productos.filter((p) => p.alertas?.includes('VENCIDO')).length
    };
  }

  get filtrados(): ProductoInventario[] {
    const t = normalizarTexto(this.buscar.trim());
    return this.productos
      .filter((p) => !this.filtroTipo || p.tipo === this.filtroTipo)
      .filter((p) => !this.filtroAlerta || (this.filtroAlerta === 'OK' ? !p.alertas?.length : p.alertas?.includes(this.filtroAlerta)))
      .filter((p) => !t || [p.codigo, p.nombre, p.presentacion, p.registroInvima].some((v) => normalizarTexto(v ?? '').includes(t)))
      .sort((a, b) => compararValores(this.valor(a), this.valor(b), this.direccion));
  }

  private valor(p: ProductoInventario): string | number {
    switch (this.columna) {
      case 'codigo': return p.codigo;
      case 'tipo': return p.tipo;
      case 'stock': return p.stockDisponible ?? 0;
      case 'compra': return p.precioCompra ?? 0;
      case 'venta': return p.precioVenta;
      case 'vence': return p.proximoVencimiento ?? '9999';
      default: return p.nombre;
    }
  }

  get paginados(): ProductoInventario[] {
    const i = (this.pagina - 1) * this.porPagina;
    return this.filtrados.slice(i, i + this.porPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.filtrados.length / this.porPagina);
  }

  ordenar(c: Columna) {
    this.direccion = this.columna === c && this.direccion === 'asc' ? 'desc' : 'asc';
    this.columna = c;
  }

  icono(c: Columna): string {
    return this.columna !== c ? 'fa-sort' : this.direccion === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  filtrarAlerta(alerta: string) {
    this.filtroAlerta = this.filtroAlerta === alerta ? '' : alerta;
    this.pagina = 1;
  }

  // ------------------------------------------------------------------ producto

  nuevoProducto() {
    this.productoEditando = null;
    this.formProducto.reset({ tipo: 'MEDICAMENTO', ivaPorcentaje: 0, stockMinimo: 0, activo: true, conLote: true, fechaCompra: this.hoy });
    this.abrir('modalProducto');
  }

  editarProducto(p: ProductoInventario) {
    this.productoEditando = p;
    this.formProducto.reset({ ...p, conLote: false, fechaProximoPedido: p.fechaProximoPedido ?? '' });
    this.abrir('modalProducto');
  }

  guardarProducto() {
    const v = this.formProducto.getRawValue();
    if (this.formProducto.invalid || this.enviando) {
      this.formProducto.markAllAsTouched();
      return;
    }
    if (v.tipo === 'MEDICAMENTO' && !v.registroInvima?.trim()) {
      Swal.fire('Falta el registro Invima', 'Es obligatorio para los medicamentos', 'warning');
      return;
    }
    const producto: ProductoInventario & { lote?: LoteRq } = {
      id: this.productoEditando?.id, codigo: v.codigo.toUpperCase(), nombre: v.nombre, tipo: v.tipo,
      registroInvima: v.registroInvima, presentacion: v.presentacion, descripcion: v.descripcion,
      precioVenta: Number(v.precioVenta), ivaPorcentaje: Number(v.ivaPorcentaje ?? 0), stockMinimo: Number(v.stockMinimo),
      fechaProximoPedido: v.fechaProximoPedido || null, activo: v.activo
    };
    if (!this.productoEditando && v.conLote) {
      producto.lote = { numeroLote: v.numeroLote, cantidad: Number(v.cantidad), precioCompra: Number(v.precioCompra),
        fechaCompra: v.fechaCompra, fechaVence: v.fechaVence || null };
    }
    this.enviando = true;
    const peticion = this.productoEditando ? this.inventarioService.actualizar(producto) : this.inventarioService.guardar(producto);
    peticion.subscribe({
      next: (r) => { this.enviando = false; this.modales['modalProducto']?.hide(); this.listar(); Swal.fire('Listo', r.message, 'success'); },
      error: (e: HttpErrorResponse) => { this.enviando = false; Swal.fire('No se pudo guardar', obtenerMensajeError(e), 'error'); }
    });
  }

  // ------------------------------------------------------------------ lotes y detalle

  nuevoLote(p: ProductoInventario) {
    this.productoLote = p;
    this.formLote.reset({ fechaCompra: this.hoy });
    this.abrir('modalLote');
  }

  guardarLote() {
    if (this.formLote.invalid || this.enviando || !this.productoLote) {
      this.formLote.markAllAsTouched();
      return;
    }
    const v = this.formLote.getRawValue();
    this.enviando = true;
    this.inventarioService.agregarLote({ medicamentoId: this.productoLote.id, numeroLote: v.numeroLote, cantidad: Number(v.cantidad),
      precioCompra: Number(v.precioCompra), fechaCompra: v.fechaCompra, fechaVence: v.fechaVence || null }).subscribe({
      next: (r) => { this.enviando = false; this.modales['modalLote']?.hide(); this.listar(); Swal.fire('Listo', r.message, 'success'); },
      error: (e: HttpErrorResponse) => { this.enviando = false; Swal.fire('No se pudo ingresar el lote', obtenerMensajeError(e), 'error'); }
    });
  }

  verDetalle(p: ProductoInventario) {
    this.detalle = null;
    this.movimientos = [];
    this.inventarioService.consultar(p.id!).subscribe({ next: (d) => this.detalle = d });
    this.inventarioService.movimientos(p.id!).subscribe({ next: (m) => this.movimientos = m });
    this.abrir('modalDetalleProducto');
  }

  // ------------------------------------------------------------------ carga masiva

  descargarPlantilla() {
    this.inventarioService.plantilla().subscribe({ next: (b) => guardarArchivo(b, 'plantilla_inventario.csv') });
  }

  elegirArchivo(evento: Event) {
    const input = evento.target as HTMLInputElement;
    this.archivo = input.files?.[0] ?? null;
    this.vistaPrevia = null;
    this.resultadoCarga = null;
  }

  previsualizar() {
    if (!this.archivo) {
      Swal.fire('Seleccione un archivo', 'Debe ser .csv o .xlsx', 'info');
      return;
    }
    this.procesando = true;
    this.inventarioService.previsualizarCarga(this.archivo).subscribe({
      next: (r) => { this.procesando = false; this.vistaPrevia = r; this.resultadoCarga = null; },
      error: (e: HttpErrorResponse) => { this.procesando = false; Swal.fire('Archivo no válido', obtenerMensajeError(e), 'error'); }
    });
  }

  get filasVista() {
    return (this.vistaPrevia?.filas ?? []).filter((f) => !this.soloErrores || !f.valida);
  }

  confirmarCarga() {
    if (!this.archivo || !this.vistaPrevia) { return; }
    Swal.fire({
      title: `¿Importar ${this.vistaPrevia.filasValidas} registros válidos?`,
      text: this.vistaPrevia.filasError ? `${this.vistaPrevia.filasError} filas con errores no se importarán.` : '',
      icon: 'question', showCancelButton: true, confirmButtonText: 'Importar', cancelButtonText: 'Cancelar'
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.procesando = true;
      this.inventarioService.confirmarCarga(this.archivo!).subscribe({
        next: (res) => {
          this.procesando = false;
          this.resultadoCarga = res;
          this.vistaPrevia = res;
          this.listar();
          Swal.fire('Carga terminada', `Importados: ${res.filasImportadas} · Rechazados: ${res.filasError} · Log #${res.logId}`, 'success');
        },
        error: (e: HttpErrorResponse) => { this.procesando = false; Swal.fire('Error', obtenerMensajeError(e), 'error'); }
      });
    });
  }

  /** Genera un CSV con la fila y el motivo de cada rechazo. */
  descargarErrores() {
    const errores = (this.vistaPrevia?.filas ?? []).filter((f) => !f.valida);
    const lineas = ['fila,codigo,nombre,lote,motivo'].concat(errores.map((f) =>
      [f.fila, f.codigo, f.nombre, f.numeroLote, f.errores.join(' | ')].map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')));
    guardarArchivo(new Blob(['﻿' + lineas.join('\n')], { type: 'text/csv' }), 'informe_errores_carga.csv');
  }

  verLogs() {
    this.pestana = 'logs';
    this.inventarioService.logsCarga().subscribe({ next: (l) => this.logs = l });
  }

  private abrir(id: string) {
    const el = document.getElementById(id);
    if (el) {
      this.modales[id] ??= new Modal(el);
      this.modales[id].show();
    }
  }
}
