import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API, ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Mensajes } from '../../core/mensajes';
import { Impuesto, Lote, Medicamento, Respuesta } from '../../core/models';
import { hoyISO, sumarDias } from '../../core/util';
import { ModalComponent } from '../../shared/modal.component';
import { EstadoComponent } from '../../shared/estado.component';
import { Tabla } from '../../core/tabla';
import { OrdenComponent } from '../../shared/orden.component';
import { PaginadorComponent } from '../../shared/paginador.component';

/** Inventario: productos, lotes, kardex y carga masiva. Edición sólo para ADMIN. */
@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [OrdenComponent, PaginadorComponent, FormsModule, ModalComponent, EstadoComponent, CurrencyPipe, DatePipe],
  templateUrl: './inventario.component.html'
})
export class InventarioComponent implements OnInit {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  auth = inject(AuthService);
  esAdmin = this.auth.tienePerfil('ADMIN');
  tab: 'p' | 'k' | 'c' | 'l' = 'p';
  filtros = [
    { k: 'TODOS', t: 'Todos' }, { k: 'DISPONIBLES', t: 'Disponibles' }, { k: 'AGOTADOS', t: 'Agotados' },
    { k: 'BAJO_STOCK', t: 'Bajo stock' }, { k: 'PROXIMOS_VENCER', t: 'Próximos a vencer' },
    { k: 'VENCIDOS', t: 'Con lotes vencidos' }, { k: 'INACTIVOS', t: 'Inactivos' }
  ];
  filtro = 'TODOS';
  texto = '';
  productos: Medicamento[] = [];
  tabla = new Tabla<Medicamento>({ codigo: x => x.codigo, nombre: x => x.nombre, tipo: x => x.tipoProducto, vigente: x => x.stockVigente, vencido: x => x.stockVencido, minimo: x => x.stockMinimo, estado: x => x.estadoStock, compra: x => Number(x.precioCompra), venta: x => Number(x.precioVenta), vence: x => x.vencimientoProximo, pedido: x => x.fechaProximoPedido }, { campo: 'nombre' });
  alertas: any = {};
  impuestos: Impuesto[] = [];
  // producto
  modalProd = false; enviado = false; prod: any = {};
  // lotes
  modalLotes = false; lotesDe: Medicamento | null = null; lotes: Lote[] = []; hoy = hoyISO();
  modalLote = false; lote: any = {};
  // kardex
  tablaK = new Tabla<any>({ fecha: x => x.fecha, tipo: x => x.tipo, concepto: x => x.concepto, producto: x => x.medicamento.nombre, lote: x => x.lote?.numeroLote, cantidad: x => x.cantidad, usuario: x => x.usuario.nombreCompleto }, { tamano: 25 });
  kardex: any[] = []; kMed: number | null = null; kTipo = ''; kDesde = sumarDias(hoyISO(), -90); kHasta = hoyISO();
  // carga masiva
  archivo: File | null = null; carga: any = null; soloErrores = false; subiendo = false; cargas: any[] = [];

  ngOnInit(): void {
    this.cargar();
    this.api.get<Impuesto[]>('/tarifa/impuestos').subscribe(i => this.impuestos = i.filter(x => x.activo));
  }

  cargar(): void {
    this.api.get<Medicamento[]>('/medicamento/listar', { filtro: this.filtro, texto: this.texto })
      .subscribe({ next: p => this.productos = p, error: e => Mensajes.error(e) });
    this.api.get<any>('/medicamento/alertas').subscribe(a => this.alertas = a);
  }

  cambiarFiltro(f: string): void { this.filtro = f; this.cargar(); }

  // ------------------------------------------------ productos
  nuevo(): void {
    this.prod = { tipoProducto: 'MEDICAMENTO', unidadMedida: 'UNIDAD', stockMinimo: 0, requiereInvima: true,
      impuestoId: this.impuestos[0]?.id, conLote: true, loteInicial: { fechaCompra: hoyISO() } };
    this.enviado = false; this.modalProd = true;
  }

  editar(m: Medicamento): void {
    this.prod = { ...m, conLote: false };
    this.enviado = false; this.modalProd = true;
  }

  requiereInvima(): boolean { return this.prod.tipoProducto === 'MEDICAMENTO' || this.prod.requiereInvima; }

  guardarProducto(f: NgForm): void {
    this.enviado = true;
    if (f.invalid) { return; }
    if (Number(this.prod.precioVenta) < Number(this.prod.precioCompra)) {
      Mensajes.aviso('Precio inválido', 'El precio de venta no puede ser menor al de compra.'); return;
    }
    const body = { ...this.prod, requiereInvima: this.requiereInvima(),
      loteInicial: !this.prod.id && this.prod.conLote ? { ...this.prod.loteInicial, precioCompra: this.prod.precioCompra } : null };
    const op = this.prod.id ? this.api.put<Respuesta>('/medicamento/actualizar', body) : this.api.post<Respuesta>('/medicamento/crear', body);
    op.subscribe({ next: r => { Mensajes.exito(r.message); this.modalProd = false; this.cargar(); }, error: e => Mensajes.error(e) });
  }

  async estado(m: Medicamento): Promise<void> {
    if (!await Mensajes.confirmar(`¿${m.activo ? 'Inactivar' : 'Activar'} ${m.nombre}?`)) { return; }
    this.api.patch<Respuesta>('/medicamento/cambiar-estado', {}, { medicamentoId: m.id, activo: !m.activo })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.cargar(); }, error: e => Mensajes.error(e) });
  }

  // ------------------------------------------------ lotes
  verLotes(m: Medicamento): void {
    this.lotesDe = m; this.modalLotes = true; this.lotes = [];
    this.api.get<Lote[]>('/medicamento/lotes', { medicamentoId: m.id }).subscribe(l => this.lotes = l);
  }

  vencido(l: Lote): boolean { return !!l.fechaVencimiento && l.fechaVencimiento <= this.hoy; }

  nuevoLote(m: Medicamento): void {
    this.lotesDe = m;
    this.lote = { medicamentoId: m.id, fechaCompra: hoyISO(), precioCompra: m.precioCompra };
    this.modalLote = true;
  }

  guardarLote(f: NgForm): void {
    if (f.invalid) { Mensajes.aviso('Datos incompletos', 'Revise los campos del lote.'); return; }
    this.api.post<Respuesta>('/medicamento/lotes', this.lote).subscribe({
      next: r => { Mensajes.exito(r.message); this.modalLote = false; this.cargar(); }, error: e => Mensajes.error(e) });
  }

  // ------------------------------------------------ kardex
  verKardex(m?: Medicamento): void {
    this.tab = 'k';
    if (m) { this.kMed = m.id; }
    this.cargarKardex();
  }

  cargarKardex(): void {
    this.api.get<any[]>('/medicamento/movimientos', { medicamentoId: this.kMed, tipo: this.kTipo, desde: this.kDesde, hasta: this.kHasta })
      .subscribe({ next: k => this.kardex = k, error: e => Mensajes.error(e) });
  }

  // ------------------------------------------------ carga masiva
  plantilla(): void {
    this.api.descargar('/medicamento/carga-masiva/plantilla', {}, 'plantilla.xlsx').subscribe({ error: e => Mensajes.error(e) });
  }

  seleccionar(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.archivo = input.files?.[0] ?? null;
  }

  previsualizar(): void {
    if (!this.archivo) { Mensajes.aviso('Archivo requerido', 'Seleccione un archivo .xlsx o .csv.'); return; }
    if (!/\.(xlsx|csv)$/i.test(this.archivo.name)) { Mensajes.aviso('Formato no válido', 'Sólo se aceptan archivos .xlsx o .csv.'); return; }
    if (this.archivo.size > 10 * 1024 * 1024) { Mensajes.aviso('Archivo muy grande', 'El tamaño máximo es 10 MB.'); return; }
    const fd = new FormData();
    fd.append('archivo', this.archivo);
    this.subiendo = true;
    this.http.post<any>(API + '/medicamento/carga-masiva/previsualizar', fd).subscribe({
      next: r => { this.carga = r; this.subiendo = false; },
      error: e => { this.subiendo = false; Mensajes.error(e, 'Archivo rechazado'); }
    });
  }

  filasVisibles(): any[] {
    return (this.carga?.filas ?? []).filter((f: any) => !this.soloErrores || !f.valido || f.estado === 'FALLIDO');
  }

  async confirmarCarga(): Promise<void> {
    const c = this.carga.carga;
    if (!await Mensajes.confirmar(`Se importarán ${c.registrosValidos} registros válidos y se omitirán ${c.registrosError} con error.`,
      'Confirmar importación', 'Importar')) { return; }
    this.subiendo = true;
    this.api.post<any>('/medicamento/carga-masiva/confirmar', {}, { cargaId: c.id }).subscribe({
      next: r => { this.subiendo = false; this.carga = r; this.cargar();
        Mensajes.exito(`Importados: ${r.carga.registrosImportados}. Con error: ${r.carga.registrosError}.`, 'Carga confirmada'); },
      error: e => { this.subiendo = false; Mensajes.error(e); }
    });
  }

  cancelarCarga(): void {
    this.api.post<any>('/medicamento/carga-masiva/cancelar', {}, { cargaId: this.carga.carga.id }).subscribe({
      next: r => { this.carga = r; Mensajes.exito('La carga fue cancelada; no se afectó el inventario.'); }, error: e => Mensajes.error(e) });
  }

  informeErrores(id: number): void {
    this.api.descargar('/medicamento/carga-masiva/errores', { cargaId: id }, 'errores.xlsx').subscribe({ error: e => Mensajes.error(e) });
  }

  verCargas(): void {
    this.tab = 'l';
    this.api.get<any[]>('/medicamento/carga-masiva/historial').subscribe(c => this.cargas = c);
  }

  abrirCarga(id: number): void {
    this.api.get<any>('/medicamento/carga-masiva/detalle', { cargaId: id }).subscribe(r => { this.carga = r; this.tab = 'c'; });
  }
}
