import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';

import { InventarioService } from './service/inventario.service';
import { AuthService } from 'src/app/services/auth.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { AjusteRq, Lote, LoteRq, Movimiento, Producto, ProductoRq, TIPOS_PRODUCTO } from 'src/app/models/inventario';
import { TablaLocal } from 'src/app/utils/tabla-local';
import { ModalBootstrap } from 'src/app/utils/modal';
import { normalizarTexto } from 'src/app/utils/texto';
import { hoyIso, mananaIso } from 'src/app/utils/fechas';
import { confirmar, mostrarError, notificarExito } from 'src/app/utils/mensajes';
import { fechaNoFutura, TEXTO_OBLIGATORIO } from 'src/app/utils/validadores';

/** Filtros rápidos de alerta del inventario. */
type FiltroAlerta = '' | 'AGOTADO' | 'STOCK_BAJO' | 'PROXIMO_A_VENCER' | 'VENCIDOS' | 'INACTIVOS';

/** Precio máximo aceptado (debe coincidir con el backend). */
const PRECIO_MAXIMO = 9999999999.99;
/** Cantidad máxima por operación (debe coincidir con el backend). */
const CANTIDAD_MAXIMA = 1000000;

/**
 * Pantalla de inventario de medicamentos e insumos: existencias, alertas,
 * lotes e historial de movimientos. Todos los perfiles con acceso consultan;
 * solo el administrador registra productos, lotes y ajustes (el backend aplica
 * la misma restricción).
 */
@Component({
  selector: 'app-inventario',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './inventario.component.html'
})
export class InventarioComponent implements OnInit, OnDestroy {
  /** Opciones de tipo de producto. */
  readonly tipos = TIPOS_PRODUCTO;
  /** Indica si el usuario puede modificar el inventario. */
  readonly puedeAdministrar = inject(AuthService).tieneRol('ADMIN');
  /** Fecha actual, límite de las fechas de compra e ingreso. */
  readonly hoy = hoyIso();
  /** Primer día válido para el vencimiento de un lote nuevo. */
  readonly manana = mananaIso();

  /** Tabla de productos resuelta en el navegador (orden inicial por nombre). */
  readonly tabla = new TablaLocal<Producto>(
    {
      codigo: (p) => p.codigo,
      nombre: (p) => p.nombre,
      tipo: (p) => p.tipo,
      disponible: (p) => p.cantidadDisponible,
      precioCompra: (p) => p.ultimoPrecioCompra,
      precioVenta: (p) => p.precioVenta,
      vencimiento: (p) => p.proximoVencimiento
    },
    (p) => `${p.codigo} ${p.nombre} ${p.presentacion ?? ''} ${p.registroInvima ?? ''}`,
    'nombre'
  );
  /** Tipo seleccionado en el filtro (vacío = todos). */
  filtroTipo = '';
  /** Alerta seleccionada en el filtro (vacío = todas). */
  filtroAlerta: FiltroAlerta = '';
  /** Indica que se está consultando el listado. */
  cargando = false;
  /** Indica que la última consulta falló. */
  error = false;
  /** Lista completa de productos. */
  productos: Producto[] = [];

  /** Formulario del producto. */
  formProducto!: FormGroup;
  /** Producto en edición (null al crear). */
  productoEditando: Producto | null = null;
  /** Indica que se está guardando el producto. */
  guardandoProducto = false;

  /** Formulario de entrada de lote. */
  formLote!: FormGroup;
  /** Producto al que ingresa el lote. */
  productoLote: Producto | null = null;
  /** Indica que se está guardando el lote. */
  guardandoLote = false;

  /** Producto mostrado en el detalle. */
  detalle: Producto | null = null;
  /** Indica que se está consultando el detalle. */
  cargandoDetalle = false;
  /** Pestaña activa del detalle. */
  pestana: 'lotes' | 'movimientos' = 'lotes';

  /** Formulario de ajuste de existencias. */
  formAjuste!: FormGroup;
  /** Lote que se está ajustando. */
  loteAjuste: Lote | null = null;
  /** Indica que se está guardando el ajuste. */
  guardandoAjuste = false;

  /** Movimientos de la página actual. */
  movimientos: Movimiento[] = [];
  /** Indica que se están consultando los movimientos. */
  cargandoMovimientos = false;
  /** Indica que la última consulta de movimientos falló. */
  errorMovimientos = false;
  /** Página actual de movimientos. */
  paginaMovimientos = 0;
  /** Movimientos por página. */
  movimientosPorPagina = 10;
  /** Total de movimientos del producto. */
  totalMovimientos = 0;
  /** Total de páginas de movimientos. */
  totalPaginasMovimientos = 0;

  /** Suscripciones permanentes. */
  private readonly suscripciones = new Subscription();
  /** Modal del producto. */
  private readonly modalProducto = new ModalBootstrap('modalProducto');
  /** Modal de entrada de lote. */
  private readonly modalLote = new ModalBootstrap('modalLote');
  /** Modal del detalle. */
  private readonly modalDetalle = new ModalBootstrap('modalDetalleProducto');

  /**
   * Valida que el lote haya ingresado después de comprarse.
   */
  private readonly validarFechasLote = (grupo: AbstractControl): ValidationErrors | null => {
    const compra = grupo.get('fechaCompra')?.value as string;
    const ingreso = grupo.get('fechaIngreso')?.value as string;
    return compra && ingreso && ingreso < compra ? { ingresoAnterior: true } : null;
  };

  /**
   * @param inventarioService servicio de inventario.
   * @param formBuilder constructor de formularios reactivos.
   */
  constructor(
    private readonly inventarioService: InventarioService,
    private readonly formBuilder: FormBuilder
  ) { }

  /** Crea los formularios y consulta el listado. */
  ngOnInit(): void {
    const entero = Validators.pattern(/^\d+$/);
    const precio = [Validators.required, Validators.min(0.01), Validators.max(PRECIO_MAXIMO)];
    this.formProducto = this.formBuilder.group({
      codigo: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{8}$/)]],
      nombre: ['', [...TEXTO_OBLIGATORIO, Validators.maxLength(100)]],
      tipo: ['MEDICAMENTO', Validators.required],
      registroInvima: [''],
      presentacion: ['', Validators.maxLength(100)],
      descripcion: ['', Validators.maxLength(255)],
      precioVenta: [null, precio],
      ivaPorcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      stockMinimo: [null, [Validators.required, entero, Validators.max(CANTIDAD_MAXIMA)]],
      fechaProximoPedido: ['']
    });
    this.suscripciones.add(this.formProducto.controls['tipo'].valueChanges.subscribe(() => this.actualizarInvima()));
    this.actualizarInvima();

    this.formLote = this.formBuilder.group(
      {
        numeroLote: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{1,40}$/)]],
        fechaCompra: ['', [Validators.required, fechaNoFutura]],
        fechaIngreso: ['', [Validators.required, fechaNoFutura]],
        fechaVencimiento: [''],
        cantidad: [null, [Validators.required, entero, Validators.min(1), Validators.max(CANTIDAD_MAXIMA)]],
        precioCompra: [null, precio]
      },
      { validators: this.validarFechasLote }
    );

    this.formAjuste = this.formBuilder.group({
      sentido: ['SALIDA', Validators.required],
      cantidad: [null, [Validators.required, entero, Validators.min(1), Validators.max(CANTIDAD_MAXIMA)]],
      motivo: ['', [...TEXTO_OBLIGATORIO, Validators.maxLength(255)]]
    });

    this.listar();
  }

  /** Cierra suscripciones y libera los modales. */
  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
    this.modalProducto.destruir();
    this.modalLote.destruir();
    this.modalDetalle.destruir();
  }

  /** Acceso corto a los controles del producto. */
  get fp(): { [key: string]: AbstractControl } {
    return this.formProducto.controls;
  }

  /** Indica si hay búsqueda o filtro activo. */
  get hayFiltros(): boolean {
    return this.tabla.hayBusqueda || !!this.filtroTipo || !!this.filtroAlerta;
  }

  /** Conteos de las tarjetas de alerta (solo productos activos). */
  get resumen(): { agotados: number; bajos: number; porVencer: number; vencidos: number } {
    const activos = this.productos.filter((p) => p.activo);
    return {
      agotados: activos.filter((p) => p.estadoStock === 'AGOTADO').length,
      bajos: activos.filter((p) => p.estadoStock === 'STOCK_BAJO').length,
      porVencer: activos.filter((p) => p.proximoAVencer).length,
      vencidos: activos.filter((p) => p.tieneVencidos).length
    };
  }

  /** Indica que el código escrito ya lo usa otro producto. */
  get codigoDuplicado(): boolean {
    return this.existe((p) => p.codigo, this.fp['codigo'].value);
  }

  /** Indica que el nombre escrito ya lo usa otro producto. */
  get nombreDuplicado(): boolean {
    return this.existe((p) => p.nombre, this.fp['nombre'].value);
  }

  /** Indica si el lote que se registra exige vencimiento. */
  get loteExigeVencimiento(): boolean {
    return this.productoLote?.tipo === 'MEDICAMENTO';
  }

  // ===================== Listado =====================

  /** Consulta la lista completa de productos. */
  listar(): void {
    this.cargando = true;
    this.error = false;
    this.inventarioService.listar().subscribe({
      next: (data) => {
        this.productos = data;
        this.tabla.cargar(data);
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.error = true;
        this.productos = [];
        this.tabla.cargar([]);
        mostrarError(error, 'No se pudo cargar el inventario');
      }
    });
  }

  /** Aplica los filtros de tipo y alerta. Los inactivos solo se ven con su propio filtro. */
  aplicarFiltros(): void {
    const tipo = this.filtroTipo;
    const alerta = this.filtroAlerta;
    this.tabla.filtrar((p) => {
      if (tipo && p.tipo !== tipo) {
        return false;
      }
      switch (alerta) {
        case 'AGOTADO':
        case 'STOCK_BAJO':
          return p.activo && p.estadoStock === alerta;
        case 'PROXIMO_A_VENCER':
          return p.activo && p.proximoAVencer;
        case 'VENCIDOS':
          return p.activo && p.tieneVencidos;
        case 'INACTIVOS':
          return !p.activo;
        default:
          return true;
      }
    });
  }

  /**
   * Filtra desde una tarjeta de alerta; si ya estaba activa, la quita.
   *
   * @param alerta alerta de la tarjeta.
   */
  filtrarPorAlerta(alerta: FiltroAlerta): void {
    this.filtroAlerta = this.filtroAlerta === alerta ? '' : alerta;
    this.aplicarFiltros();
  }

  /** Quita búsqueda, filtros y orden personalizados. */
  limpiarFiltros(): void {
    this.filtroTipo = '';
    this.filtroAlerta = '';
    this.tabla.filtrar(() => true);
    this.tabla.reiniciar();
  }

  // ===================== Producto =====================

  /** El registro Invima es obligatorio para medicamentos y opcional para insumos. */
  private actualizarInvima(): void {
    const control = this.fp['registroInvima'];
    const formato = Validators.pattern(/^[A-Za-z0-9/-]{5,30}$/);
    control.setValidators(this.fp['tipo'].value === 'MEDICAMENTO' ? [Validators.required, formato] : [formato]);
    control.updateValueAndValidity({ emitEvent: false });
  }

  /** Abre el formulario vacío para registrar un producto. */
  abrirNuevo(): void {
    this.productoEditando = null;
    this.formProducto.reset({
      codigo: '', nombre: '', tipo: 'MEDICAMENTO', registroInvima: '', presentacion: '',
      descripcion: '', precioVenta: null, ivaPorcentaje: 0, stockMinimo: null, fechaProximoPedido: ''
    });
    this.modalProducto.abrir();
  }

  /**
   * Abre el formulario con los datos de un producto activo.
   *
   * @param producto producto a editar.
   */
  abrirEdicion(producto: Producto): void {
    this.productoEditando = producto;
    this.formProducto.reset({
      codigo: producto.codigo,
      nombre: producto.nombre,
      tipo: producto.tipo,
      registroInvima: producto.registroInvima ?? '',
      presentacion: producto.presentacion ?? '',
      descripcion: producto.descripcion ?? '',
      // Un producto migrado sin precio queda vacío para obligar a definirlo.
      precioVenta: producto.precioVenta > 0 ? producto.precioVenta : null,
      ivaPorcentaje: producto.ivaPorcentaje ?? 0,
      stockMinimo: producto.stockMinimo,
      fechaProximoPedido: producto.fechaProximoPedido ?? ''
    });
    this.modalProducto.abrir();
  }

  /** Cierra el formulario de producto. */
  cerrarProducto(): void {
    this.modalProducto.cerrar();
  }

  /** Crea el producto o actualiza el que se está editando. */
  guardarProducto(): void {
    if (this.guardandoProducto) {
      return;
    }
    if (this.formProducto.invalid || this.codigoDuplicado || this.nombreDuplicado) {
      this.formProducto.markAllAsTouched();
      return;
    }
    const v = this.formProducto.getRawValue();
    const rq: ProductoRq = {
      codigo: String(v.codigo).trim().toUpperCase(),
      nombre: String(v.nombre).trim(),
      descripcion: String(v.descripcion ?? '').trim(),
      presentacion: String(v.presentacion ?? '').trim(),
      tipo: v.tipo,
      registroInvima: String(v.registroInvima ?? '').trim(),
      precioVenta: Number(v.precioVenta),
      ivaPorcentaje: Number(v.ivaPorcentaje ?? 0),
      stockMinimo: Number(v.stockMinimo),
      fechaProximoPedido: v.fechaProximoPedido || null
    };

    this.guardandoProducto = true;
    const peticion = this.productoEditando
      ? this.inventarioService.actualizar(this.productoEditando.id, rq)
      : this.inventarioService.guardar(rq);
    peticion.subscribe({
      next: (respuesta) => {
        this.guardandoProducto = false;
        notificarExito(respuesta.message);
        this.modalProducto.cerrar();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoProducto = false;
        mostrarError(error, 'No se pudo guardar el producto');
      }
    });
  }

  /**
   * Activa o inactiva un producto tras confirmar.
   *
   * @param producto producto de la fila.
   */
  async cambiarEstado(producto: Producto): Promise<void> {
    const activar = !producto.activo;
    const confirmado = await confirmar(
      activar ? `¿Activar ${producto.nombre}?` : `¿Inactivar ${producto.nombre}?`,
      activar
        ? 'Se podrá volver a formular y a recibir lotes.'
        : 'No se podrá formular ni recibir lotes. Sus existencias e historial se conservan.',
      activar ? 'Sí, activar' : 'Sí, inactivar'
    );
    if (!confirmado) {
      return;
    }
    this.inventarioService.cambiarEstado(producto.id, activar).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.listar();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cambiar el estado del producto')
    });
  }

  // ===================== Lotes =====================

  /**
   * Abre el formulario de entrada de un lote.
   *
   * @param producto producto que recibe el lote.
   */
  abrirLote(producto: Producto): void {
    this.productoLote = producto;
    this.formLote.reset({
      numeroLote: '', fechaCompra: this.hoy, fechaIngreso: this.hoy,
      fechaVencimiento: '', cantidad: null, precioCompra: null
    });
    const vencimiento = this.formLote.controls['fechaVencimiento'];
    const vigente = (c: AbstractControl): ValidationErrors | null =>
      c.value && c.value < this.manana ? { vencido: true } : null;
    vencimiento.setValidators(producto.tipo === 'MEDICAMENTO' ? [Validators.required, vigente] : [vigente]);
    vencimiento.updateValueAndValidity({ emitEvent: false });
    this.modalLote.abrir();
  }

  /** Cierra el formulario de lote. */
  cerrarLote(): void {
    this.modalLote.cerrar();
  }

  /** Registra la entrada del lote. */
  guardarLote(): void {
    if (this.guardandoLote || !this.productoLote) {
      return;
    }
    if (this.formLote.invalid) {
      this.formLote.markAllAsTouched();
      return;
    }
    const v = this.formLote.getRawValue();
    const rq: LoteRq = {
      numeroLote: String(v.numeroLote).trim().toUpperCase(),
      fechaCompra: v.fechaCompra,
      fechaIngreso: v.fechaIngreso,
      fechaVencimiento: v.fechaVencimiento || null,
      cantidad: Number(v.cantidad),
      precioCompra: Number(v.precioCompra)
    };

    this.guardandoLote = true;
    this.inventarioService.registrarLote(this.productoLote.id, rq).subscribe({
      next: (respuesta) => {
        this.guardandoLote = false;
        notificarExito(respuesta.message);
        this.modalLote.cerrar();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoLote = false;
        mostrarError(error, 'No se pudo registrar el lote');
      }
    });
  }

  // ===================== Detalle =====================

  /**
   * Abre el detalle de un producto con sus lotes y movimientos.
   *
   * @param producto fila seleccionada.
   */
  verDetalle(producto: Producto): void {
    this.detalle = null;
    this.loteAjuste = null;
    this.pestana = 'lotes';
    this.paginaMovimientos = 0;
    this.movimientos = [];
    this.modalDetalle.abrir();
    this.cargarDetalle(producto.id);
  }

  /**
   * Consulta el detalle y los movimientos de un producto.
   *
   * @param id identificador del producto.
   */
  private cargarDetalle(id: number): void {
    this.cargandoDetalle = true;
    this.inventarioService.consultar(id).subscribe({
      next: (data) => {
        this.detalle = data;
        this.cargandoDetalle = false;
        this.listarMovimientos();
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoDetalle = false;
        this.modalDetalle.cerrar();
        mostrarError(error, 'No se pudo consultar el producto');
      }
    });
  }

  /** Consulta la página actual de movimientos. */
  listarMovimientos(): void {
    if (!this.detalle) {
      return;
    }
    this.cargandoMovimientos = true;
    this.errorMovimientos = false;
    this.inventarioService.listarMovimientos(this.detalle.id, this.paginaMovimientos, this.movimientosPorPagina).subscribe({
      next: (pagina) => {
        this.movimientos = pagina.content;
        this.totalMovimientos = pagina.totalElements;
        this.totalPaginasMovimientos = pagina.totalPages;
        this.paginaMovimientos = pagina.page;
        this.cargandoMovimientos = false;
      },
      error: () => {
        this.cargandoMovimientos = false;
        this.errorMovimientos = true;
      }
    });
  }

  /**
   * Cambia de página en los movimientos.
   *
   * @param pagina número de página.
   */
  irAPaginaMovimientos(pagina: number): void {
    this.paginaMovimientos = pagina;
    this.listarMovimientos();
  }

  /**
   * Cambia la cantidad de movimientos por página.
   *
   * @param tamano nueva cantidad.
   */
  cambiarTamanoMovimientos(tamano: number): void {
    this.movimientosPorPagina = tamano;
    this.paginaMovimientos = 0;
    this.listarMovimientos();
  }

  /**
   * Abre el formulario de ajuste de un lote.
   *
   * @param lote lote a corregir.
   */
  abrirAjuste(lote: Lote): void {
    this.loteAjuste = lote;
    this.formAjuste.reset({ sentido: 'SALIDA', cantidad: null, motivo: '' });
  }

  /** Cierra el formulario de ajuste. */
  cancelarAjuste(): void {
    this.loteAjuste = null;
  }

  /** Indica que el ajuste de salida supera la existencia del lote. */
  get ajusteExcede(): boolean {
    const v = this.formAjuste?.getRawValue();
    return !!this.loteAjuste && v?.sentido === 'SALIDA' && Number(v.cantidad) > this.loteAjuste.cantidadDisponible;
  }

  /** Registra el ajuste y recarga el detalle. */
  guardarAjuste(): void {
    if (this.guardandoAjuste || !this.loteAjuste || !this.detalle) {
      return;
    }
    if (this.formAjuste.invalid || this.ajusteExcede) {
      this.formAjuste.markAllAsTouched();
      return;
    }
    const v = this.formAjuste.getRawValue();
    const rq: AjusteRq = { sentido: v.sentido, cantidad: Number(v.cantidad), motivo: String(v.motivo).trim() };

    this.guardandoAjuste = true;
    this.inventarioService.ajustarLote(this.loteAjuste.loteId, rq).subscribe({
      next: (respuesta) => {
        this.guardandoAjuste = false;
        notificarExito(respuesta.message);
        this.loteAjuste = null;
        this.paginaMovimientos = 0;
        this.cargarDetalle(this.detalle!.id);
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoAjuste = false;
        mostrarError(error, 'No se pudo registrar el ajuste');
      }
    });
  }

  // ===================== Utilidades =====================

  /**
   * Indica si un campo debe mostrarse como inválido.
   *
   * @param formulario formulario del campo.
   * @param campo nombre del control.
   * @returns true si es inválido y el usuario ya interactuó con él.
   */
  invalido(formulario: FormGroup, campo: string): boolean {
    const control = formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  /**
   * Nombre legible del tipo de producto.
   *
   * @param tipo código del tipo.
   * @returns nombre del tipo.
   */
  nombreTipo(tipo: string): string {
    return this.tipos.find((t) => t.codigo === tipo)?.nombre ?? tipo;
  }

  /**
   * Clase de la etiqueta del estado de un lote.
   *
   * @param estado estado del lote.
   * @returns clases de Bootstrap.
   */
  claseLote(estado: Lote['estado']): string {
    const clases: Record<Lote['estado'], string> = {
      VIGENTE: 'bg-success',
      PROXIMO_A_VENCER: 'bg-warning text-dark',
      VENCIDO: 'bg-danger',
      AGOTADO: 'bg-secondary'
    };
    return clases[estado];
  }

  /**
   * Texto legible del estado de un lote.
   *
   * @param estado estado del lote.
   * @returns texto.
   */
  textoLote(estado: Lote['estado']): string {
    return estado === 'PROXIMO_A_VENCER' ? 'POR VENCER' : estado;
  }

  /**
   * Texto legible de un tipo de movimiento.
   *
   * @param tipo tipo de movimiento.
   * @returns texto.
   */
  textoMovimiento(tipo: Movimiento['tipo']): string {
    return tipo.replace('_', ' de ').replace('AJUSTE de ENTRADA', 'AJUSTE +').replace('AJUSTE de SALIDA', 'AJUSTE −');
  }

  /**
   * Indica si otro producto (distinto del que se edita) ya usa un valor.
   *
   * @param campo valor a comparar de cada producto.
   * @param valor valor escrito.
   * @returns true si está repetido.
   */
  private existe(campo: (p: Producto) => string, valor: string): boolean {
    const buscado = normalizarTexto(valor);
    return !!buscado && this.productos.some((p) =>
      p.id !== this.productoEditando?.id && normalizarTexto(campo(p)) === buscado);
  }
}
