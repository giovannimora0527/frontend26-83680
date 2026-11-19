import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { DetalleFactura, Factura, PreliquidacionFactura } from 'src/app/models/factura';
import { DetalleServicioRq, FacturaRq, PagoFacturaRq } from 'src/app/models/factura-rq';
import { Mascota } from 'src/app/models/mascota';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { ClienteService } from 'src/app/services/cliente.service';
import { confirmarAccion, mostrarAdvertencia, mostrarError, mostrarExito } from 'src/app/utils/mensajes-utils';
import { compararValores, estaEnRangoFechas, nombreCompleto, normalizarTexto, textoEstado } from 'src/app/utils/tabla-utils';
import { CitaService } from '../cita/service/cita.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { FacturaService } from './service/factura.service';

@Component({
  selector: 'app-factura',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './factura.component.html',
  styleUrl: './factura.component.scss'
})
export class FacturaComponent {
  // Instancias de modales Bootstrap
  modalCrearInstance: Modal | null = null;
  modalPagoInstance: Modal | null = null;
  modalDetalleInstance: Modal | null = null;

  readonly estadosFactura = ['PENDIENTE', 'PARCIAL', 'PAGADA', 'ANULADA'];
  readonly metodosPago = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'];
  readonly tarifasImpuestoConfig = [
    { etiqueta: 'IVA General (19%)', valor: 19 },
    { etiqueta: 'Tarifa Reducida (5%)', valor: 5 },
    { etiqueta: 'Exento / Excluido (0%)', valor: 0 }
  ];
  readonly catalogoServiciosAdicionales = [
    { codigo: 'CONTROL_CLINICO', concepto: 'Valoración y Control Clínico', precio: 35000 },
    { codigo: 'CURACION_HERIDAS', concepto: 'Curación y Limpieza de Heridas', precio: 40000 },
    { codigo: 'APLICACION_MEDICAMENTO', concepto: 'Aplicación Inyectable / Fluidoterapia', precio: 25000 },
    { codigo: 'TOMA_MUESTRA_LAB', concepto: 'Toma de Muestra para Laboratorio', precio: 30000 },
    { codigo: 'ECOGRAFIA_DIAG', concepto: 'Ecografía Diagnóstica Veterinaria', precio: 95000 }
  ];

  // Datos y filtros (incluyendo filtro por propietario y mascota para historial)
  listFacturas: Factura[] = [];
  listClientes: Cliente[] = [];
  listMascotasFiltro: Mascota[] = [];

  terminoBusqueda = '';
  filtroClienteId: number | null = null;
  filtroMascotaId: number | null = null;
  filtroEstado = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  campoOrden = 'fechaGeneracion';
  ordenAscendente = false;
  paginaActual = 1;
  readonly registrosPorPagina = 6;

  cargando = false;
  guardandoFactura = false;
  cargandoPreliquidacion = false;
  registrandoPago = false;
  anulandoFactura = false;

  // Datos del modal de creación de factura
  formFactura!: FormGroup;
  formNuevoServicio!: FormGroup;
  listMascotasModal: Mascota[] = [];
  listCitasAtendidasModal: Cita[] = [];
  preliquidacionActual: PreliquidacionFactura | null = null;
  serviciosFactura: DetalleServicioRq[] = [];

  // Datos del modal de registro de abono / pago
  formPago!: FormGroup;
  facturaPagoSelected: Factura | null = null;

  // Datos del modal de detalle y anulación controlada
  facturaDetalle: Factura | null = null;
  mostrarPanelAnulacion = false;
  motivoAnulacionInput = '';
  usuarioAnulacionInput = 'Administración Facturación';

  readonly nombreCompleto = nombreCompleto;
  readonly textoEstado = textoEstado;

  constructor(
    private readonly facturaService: FacturaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly citaService: CitaService,
    private readonly formBuilder: FormBuilder
  ) {
    this.inicializarFormularios();
    this.cargarClientes();
    this.listar();
  }

  inicializarFormularios() {
    this.formFactura = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [null, Validators.required],
      citaId: [null, Validators.required],
      porcentajeDescuento: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      porcentajeImpuesto: [19, [Validators.required, Validators.min(0), Validators.max(100)]],
      observaciones: ['', [Validators.maxLength(500)]],
      registrarPagoInicial: [false],
      montoPagoInicial: [0, [Validators.min(0)]],
      metodoPagoInicial: ['EFECTIVO'],
      referenciaPagoInicial: [''],
      usuarioRegistro: ['Caja / Facturación', [Validators.required, Validators.maxLength(100)]]
    });

    this.formFactura.get('clienteId')?.valueChanges.subscribe((clienteId) => {
      this.alCambiarClienteModal(clienteId);
    });
    this.formFactura.get('mascotaId')?.valueChanges.subscribe((mascotaId) => {
      this.alCambiarMascotaModal(mascotaId);
    });
    this.formFactura.get('citaId')?.valueChanges.subscribe((citaId) => {
      this.alCambiarCitaModal(citaId);
    });

    this.formNuevoServicio = this.formBuilder.group({
      codigoServicio: [''],
      concepto: ['', [Validators.required, Validators.maxLength(200)]],
      precioUnitario: [null, [Validators.required, Validators.min(1)]]
    });

    this.formPago = this.formBuilder.group({
      monto: [null, [Validators.required, Validators.min(1)]],
      metodoPago: ['EFECTIVO', Validators.required],
      referenciaPago: ['', Validators.maxLength(100)],
      usuarioRegistro: ['Caja / Facturación', [Validators.required, Validators.maxLength(100)]],
      observacion: ['', Validators.maxLength(300)]
    });
  }

  get ff(): { [key: string]: AbstractControl } {
    return this.formFactura.controls;
  }

  get fp(): { [key: string]: AbstractControl } {
    return this.formPago.controls;
  }

  // =========================================================================
  // CÁLCULOS FINANCIEROS EN VIVO EN EL MODAL DE FACTURACIÓN
  // =========================================================================

  get subtotalServiciosCalculado(): number {
    return this.serviciosFactura.reduce((acc, s) => acc + (Number(s.precioUnitario) || 0) * (Number(s.cantidad) || 1), 0);
  }

  get subtotalMedicamentosCalculado(): number {
    const meds = this.preliquidacionActual?.medicamentosDispensados ?? [];
    return meds.reduce((acc, m) => acc + (Number(m.subtotalItem) || 0), 0);
  }

  get subtotalBrutoCalculado(): number {
    return this.subtotalServiciosCalculado + this.subtotalMedicamentosCalculado;
  }

  get valorDescuentoCalculado(): number {
    const porc = Math.min(100, Math.max(0, Number(this.formFactura?.get('porcentajeDescuento')?.value) || 0));
    return Math.round((this.subtotalBrutoCalculado * porc) / 100);
  }

  get baseGravableCalculada(): number {
    return Math.max(0, this.subtotalBrutoCalculado - this.valorDescuentoCalculado);
  }

  get valorImpuestoCalculado(): number {
    const porc = Math.min(100, Math.max(0, Number(this.formFactura?.get('porcentajeImpuesto')?.value) || 0));
    return Math.round((this.baseGravableCalculada * porc) / 100);
  }

  get totalPagarCalculado(): number {
    return this.baseGravableCalculada + this.valorImpuestoCalculado;
  }

  fijarImpuestoRapido(porcentaje: number) {
    this.formFactura.get('porcentajeImpuesto')?.setValue(porcentaje);
  }

  fijarPagoInicialTotal() {
    this.formFactura.patchValue({
      registrarPagoInicial: true,
      montoPagoInicial: this.totalPagarCalculado
    });
  }

  // =========================================================================
  // HISTORIAL Y FILTRADO POR PROPIETARIO Y MASCOTA
  // =========================================================================

  alCambiarClienteFiltro(clienteId: number | null) {
    this.filtroMascotaId = null;
    this.listMascotasFiltro = [];
    this.paginaActual = 1;
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (data) => (this.listMascotasFiltro = data ?? []),
      error: (err: HttpErrorResponse) => mostrarError(err)
    });
  }

  get clienteFiltroObj(): Cliente | undefined {
    if (!this.filtroClienteId) return undefined;
    return this.listClientes.find((c) => c.clienteId === Number(this.filtroClienteId));
  }

  get mascotaFiltroObj(): Mascota | undefined {
    if (!this.filtroMascotaId) return undefined;
    return this.listMascotasFiltro.find((m) => m.mascotaId === Number(this.filtroMascotaId));
  }

  get facturasFiltradas(): Factura[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());

    const filtradas = this.listFacturas.filter((fac) => {
      if (this.filtroClienteId && fac.cliente?.clienteId !== Number(this.filtroClienteId)) {
        return false;
      }
      if (this.filtroMascotaId && fac.mascota?.mascotaId !== Number(this.filtroMascotaId)) {
        return false;
      }
      if (this.filtroEstado && fac.estado?.toUpperCase() !== this.filtroEstado) {
        return false;
      }
      if (!estaEnRangoFechas(fac.fechaGeneracion, this.filtroFechaDesde, this.filtroFechaHasta)) {
        return false;
      }
      if (!termino) {
        return true;
      }

      const valores = [
        fac.numeroFactura,
        fac.id,
        fac.cita?.id,
        nombreCompleto(fac.cliente),
        fac.cliente?.numeroDocumento,
        fac.mascota?.nombreMascota,
        nombreCompleto(fac.medico),
        fac.estado
      ];

      return valores.some((v) => normalizarTexto(String(v ?? '')).includes(termino));
    });

    return filtradas.sort((a, b) =>
      compararValores(this.valorOrden(a), this.valorOrden(b), this.ordenAscendente)
    );
  }

  // Totales financieros sobre las facturas filtradas (excluyendo las ANULADAS)
  private get facturasActivasFiltradas(): Factura[] {
    return this.facturasFiltradas.filter((f) => f.estado?.toUpperCase() !== 'ANULADA');
  }

  get totalFacturadoFiltrado(): number {
    return this.facturasActivasFiltradas.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
  }

  get totalRecaudadoFiltrado(): number {
    return this.facturasActivasFiltradas.reduce((acc, f) => acc + (Number(f.totalPagado) || 0), 0);
  }

  get saldoPendienteFiltrado(): number {
    return this.facturasActivasFiltradas.reduce((acc, f) => acc + (Number(f.saldoPendiente) || 0), 0);
  }

  contarPorEstado(estado: string): number {
    return this.listFacturas.filter((f) => {
      if (this.filtroClienteId && f.cliente?.clienteId !== Number(this.filtroClienteId)) return false;
      if (this.filtroMascotaId && f.mascota?.mascotaId !== Number(this.filtroMascotaId)) return false;
      return f.estado?.toUpperCase() === estado;
    }).length;
  }

  filtrarRapidoEstado(estado: string) {
    this.filtroEstado = this.filtroEstado === estado ? '' : estado;
    this.paginaActual = 1;
  }

  verHistorialPropietario(cliente?: Cliente) {
    if (!cliente?.clienteId) return;
    this.filtroClienteId = cliente.clienteId;
    this.alCambiarClienteFiltro(cliente.clienteId);
  }

  verHistorialMascota(mascota?: Mascota, cliente?: Cliente) {
    const cliId = cliente?.clienteId ?? mascota?.cliente?.clienteId ?? null;
    if (cliId) {
      this.filtroClienteId = cliId;
      this.mascotaService.listarPorCliente(cliId).subscribe({
        next: (data) => {
          this.listMascotasFiltro = data ?? [];
          this.filtroMascotaId = mascota?.mascotaId ?? null;
          this.paginaActual = 1;
        }
      });
    }
  }

  get facturasPaginadas(): Factura[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.facturasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.facturasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  // =========================================================================
  // CONSULTAS Y OPERACIONES DEL COMPONENTE
  // =========================================================================

  listar() {
    this.cargando = true;
    this.facturaService.listar().subscribe({
      next: (data) => {
        this.listFacturas = data ?? [];
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        mostrarError(err);
      }
    });
  }

  cargarClientes() {
    this.clienteService.listar().subscribe({
      next: (data) => (this.listClientes = data ?? []),
      error: (err: HttpErrorResponse) => mostrarError(err)
    });
  }

  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  aplicarFiltros() {
    this.paginaActual = 1;
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroClienteId = null;
    this.filtroMascotaId = null;
    this.listMascotasFiltro = [];
    this.filtroEstado = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.paginaActual = 1;
  }

  ordenarPor(campo: string) {
    if (this.campoOrden === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.campoOrden = campo;
      this.ordenAscendente = true;
    }
    this.paginaActual = 1;
  }

  iconoOrden(campo: string): string {
    if (this.campoOrden !== campo) {
      return 'fa-sort';
    }
    return this.ordenAscendente ? 'fa-sort-up' : 'fa-sort-down';
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  claseEstadoFactura(estado?: string): string {
    switch (estado?.toUpperCase()) {
      case 'PAGADA':
        return 'bg-success text-white';
      case 'PARCIAL':
        return 'bg-warning text-dark';
      case 'PENDIENTE':
        return 'bg-primary text-white';
      case 'ANULADA':
        return 'bg-danger text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  // =========================================================================
  // MODAL 1: GENERAR FACTURA DESDE CITA ATENDIDA
  // =========================================================================

  abrirModalNuevaFactura() {
    this.preliquidacionActual = null;
    this.serviciosFactura = [];
    this.listMascotasModal = [];
    this.listCitasAtendidasModal = [];
    this.formFactura.reset({
      clienteId: this.filtroClienteId ?? null,
      mascotaId: null,
      citaId: null,
      porcentajeDescuento: 0,
      porcentajeImpuesto: 19,
      observaciones: '',
      registrarPagoInicial: false,
      montoPagoInicial: 0,
      metodoPagoInicial: 'EFECTIVO',
      referenciaPagoInicial: '',
      usuarioRegistro: 'Caja / Facturación'
    }, { emitEvent: false });

    if (this.filtroClienteId) {
      this.alCambiarClienteModal(this.filtroClienteId);
    }

    const el = document.getElementById('modalCrearFactura');
    if (el) {
      this.modalCrearInstance ??= new Modal(el);
      this.modalCrearInstance.show();
    }
  }

  cerrarModalNuevaFactura() {
    this.modalCrearInstance?.hide();
  }

  private alCambiarClienteModal(clienteId: number | null) {
    this.listMascotasModal = [];
    this.listCitasAtendidasModal = [];
    this.preliquidacionActual = null;
    this.serviciosFactura = [];
    this.formFactura.patchValue({ mascotaId: null, citaId: null }, { emitEvent: false });
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (data) => (this.listMascotasModal = data ?? []),
      error: (err: HttpErrorResponse) => mostrarError(err)
    });
  }

  // Solo permite seleccionar citas ATENDIDAS que no tengan ya una factura activa (no anulada)
  private alCambiarMascotaModal(mascotaId: number | null) {
    this.listCitasAtendidasModal = [];
    this.preliquidacionActual = null;
    this.serviciosFactura = [];
    this.formFactura.patchValue({ citaId: null }, { emitEvent: false });
    if (!mascotaId) {
      return;
    }
    this.citaService.listarPorMascota(mascotaId).subscribe({
      next: (citas) => {
        this.listCitasAtendidasModal = (citas ?? []).filter((c) => {
          const esAtendida = c.estado?.toUpperCase() === 'ATENDIDA' || c.estado?.toUpperCase() === 'FINALIZADA';
          const yaFacturadaActiva = this.listFacturas.some(
            (f) => f.cita?.id === c.id && f.estado?.toUpperCase() !== 'ANULADA'
          );
          return esAtendida && !yaFacturadaActiva;
        });
      },
      error: (err: HttpErrorResponse) => mostrarError(err)
    });
  }

  private alCambiarCitaModal(citaId: number | null) {
    this.preliquidacionActual = null;
    this.serviciosFactura = [];
    if (!citaId) {
      return;
    }
    this.cargandoPreliquidacion = true;
    this.facturaService.preliquidarCita(Number(citaId)).subscribe({
      next: (pre) => {
        this.cargandoPreliquidacion = false;
        this.preliquidacionActual = pre;
        this.serviciosFactura = (pre.serviciosSugeridos ?? []).map((s) => ({
          codigoServicio: s.codigoServicio,
          concepto: s.concepto,
          cantidad: 1,
          precioUnitario: Number(s.precioUnitarioHistorico) || 60000,
          descuentoItem: 0
        }));
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoPreliquidacion = false;
        mostrarError(err);
      }
    });
  }

  seleccionarServicioCatalogo(event: Event) {
    const codigo = (event.target as HTMLSelectElement).value;
    if (!codigo) return;
    const item = this.catalogoServiciosAdicionales.find((s) => s.codigo === codigo);
    if (item) {
      this.formNuevoServicio.patchValue({
        codigoServicio: item.codigo,
        concepto: item.concepto,
        precioUnitario: item.precio
      });
    }
  }

  // Regla 3.3: No cobrar dos veces el mismo servicio
  agregarServicioAdicional() {
    if (this.formNuevoServicio.invalid) {
      this.formNuevoServicio.markAllAsTouched();
      mostrarAdvertencia('Servicio incompleto', 'Ingrese el concepto y el precio del servicio médico.');
      return;
    }
    const val = this.formNuevoServicio.getRawValue();
    const conceptoLimpio = String(val.concepto ?? '').trim();
    const codigoLimpio = String(val.codigoServicio || conceptoLimpio).trim().toUpperCase();

    const duplicado = this.serviciosFactura.some(
      (s) =>
        (s.codigoServicio ?? '').trim().toUpperCase() === codigoLimpio ||
        normalizarTexto(s.concepto ?? '') === normalizarTexto(conceptoLimpio)
    );
    if (duplicado) {
      mostrarAdvertencia('Servicio duplicado', 'No se puede cobrar dos veces el mismo servicio en la factura.');
      return;
    }

    this.serviciosFactura.push({
      codigoServicio: codigoLimpio,
      concepto: conceptoLimpio,
      cantidad: 1,
      precioUnitario: Number(val.precioUnitario),
      descuentoItem: 0
    });
    this.formNuevoServicio.reset();
  }

  quitarServicioFactura(indice: number) {
    if (this.serviciosFactura.length <= 1) {
      mostrarAdvertencia('Servicio requerido', 'La factura debe incluir al menos el servicio de atención médica.');
      return;
    }
    this.serviciosFactura.splice(indice, 1);
  }

  guardarFactura() {
    if (this.formFactura.invalid) {
      this.formFactura.markAllAsTouched();
      mostrarAdvertencia('Campos obligatorios', 'Seleccione propietario, mascota, cita atendida y verifique los datos.');
      return;
    }
    if (this.serviciosFactura.length === 0) {
      mostrarAdvertencia('Sin servicios', 'La factura debe tener al menos un servicio registrado.');
      return;
    }

    const raw = this.formFactura.getRawValue();
    const montoInicial = raw.registrarPagoInicial ? Number(raw.montoPagoInicial || 0) : 0;
    if (montoInicial < 0 || montoInicial > this.totalPagarCalculado) {
      mostrarAdvertencia(
        'Monto inicial inválido',
        `El abono inicial no puede superar el total a pagar ($${this.totalPagarCalculado}).`
      );
      return;
    }

    const rq: FacturaRq = {
      citaId: Number(raw.citaId),
      servicios: this.serviciosFactura,
      porcentajeDescuento: Number(raw.porcentajeDescuento || 0),
      porcentajeImpuesto: Number(raw.porcentajeImpuesto ?? 19),
      observaciones: raw.observaciones,
      montoPagoInicial: montoInicial > 0 ? montoInicial : undefined,
      metodoPagoInicial: montoInicial > 0 ? raw.metodoPagoInicial : undefined,
      referenciaPagoInicial: montoInicial > 0 ? raw.referenciaPagoInicial : undefined,
      usuarioRegistro: raw.usuarioRegistro
    };

    this.guardandoFactura = true;
    this.facturaService.guardar(rq).subscribe({
      next: (res: MiRespuesta) => {
        this.guardandoFactura = false;
        mostrarExito(res.message);
        this.cerrarModalNuevaFactura();
        this.listar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoFactura = false;
        mostrarError(err);
      }
    });
  }

  // =========================================================================
  // MODAL 2: REGISTRAR ABONO / PAGO PARCIAL O TOTAL
  // =========================================================================

  abrirModalPago(factura: Factura) {
    if (!factura.id) return;
    this.facturaService.consultar(factura.id).subscribe({
      next: (data) => {
        this.facturaPagoSelected = data;
        this.formPago.reset({
          monto: data.saldoPendiente ?? 0,
          metodoPago: 'EFECTIVO',
          referenciaPago: '',
          usuarioRegistro: 'Caja / Facturación',
          observacion: ''
        });
        const el = document.getElementById('modalPagoFactura');
        if (el) {
          this.modalPagoInstance ??= new Modal(el);
          this.modalPagoInstance.show();
        }
      },
      error: (err: HttpErrorResponse) => mostrarError(err)
    });
  }

  cerrarModalPago() {
    this.modalPagoInstance?.hide();
  }

  fijarMontoSaldoTotal() {
    if (this.facturaPagoSelected) {
      this.formPago.get('monto')?.setValue(this.facturaPagoSelected.saldoPendiente ?? 0);
    }
  }

  confirmarPagoFactura() {
    if (!this.facturaPagoSelected?.id) return;
    if (this.formPago.invalid) {
      this.formPago.markAllAsTouched();
      mostrarAdvertencia('Datos incompletos', 'Indique el monto a pagar, el método de pago y el usuario.');
      return;
    }

    const val = this.formPago.getRawValue();
    const monto = Number(val.monto);
    const saldo = Number(this.facturaPagoSelected.saldoPendiente ?? 0);
    if (monto <= 0 || monto > saldo) {
      mostrarAdvertencia('Monto no válido', `El monto debe estar entre $1 y el saldo pendiente ($${saldo}).`);
      return;
    }

    const rq: PagoFacturaRq = {
      monto,
      metodoPago: val.metodoPago,
      referenciaPago: val.referenciaPago,
      usuarioRegistro: val.usuarioRegistro,
      observacion: val.observacion
    };

    this.registrandoPago = true;
    this.facturaService.registrarPago(this.facturaPagoSelected.id, rq).subscribe({
      next: (res) => {
        this.registrandoPago = false;
        mostrarExito(res.message);
        this.cerrarModalPago();
        this.listar();
      },
      error: (err: HttpErrorResponse) => {
        this.registrandoPago = false;
        mostrarError(err);
      }
    });
  }

  // =========================================================================
  // MODAL 3: DETALLE DE FACTURA, TRAZABILIDAD Y ANULACIÓN CONTROLADA
  // =========================================================================

  verDetalleFactura(factura: Factura) {
    if (!factura.id) return;
    this.facturaService.consultar(factura.id).subscribe({
      next: (data) => {
        this.facturaDetalle = data;
        this.mostrarPanelAnulacion = false;
        this.motivoAnulacionInput = '';
        const el = document.getElementById('modalDetalleFactura');
        if (el) {
          this.modalDetalleInstance ??= new Modal(el);
          this.modalDetalleInstance.show();
        }
      },
      error: (err: HttpErrorResponse) => mostrarError(err)
    });
  }

  cerrarModalDetalle() {
    this.modalDetalleInstance?.hide();
  }

  get lineasHistorialFactura(): string[] {
    const raw = this.facturaDetalle?.historialOperaciones;
    if (!raw || !raw.trim()) return [];
    return raw.split('\n').filter((l) => l.trim().length > 0);
  }

  confirmarAnulacionFactura() {
    if (!this.facturaDetalle?.id) return;
    if (!this.motivoAnulacionInput.trim()) {
      mostrarAdvertencia('Motivo obligatorio', 'Debe escribir el motivo por el cual se anula la factura.');
      return;
    }

    confirmarAccion(
      'Anular factura sin eliminar historial',
      `¿Confirmar la anulación de la factura ${this.facturaDetalle.numeroFactura}? El registro e historial se conservarán en estado ANULADA.`
    ).then((confirmado) => {
      if (!confirmado || !this.facturaDetalle?.id) return;
      this.anulandoFactura = true;
      this.facturaService
        .anular(this.facturaDetalle.id, this.motivoAnulacionInput.trim(), this.usuarioAnulacionInput)
        .subscribe({
          next: (res) => {
            this.anulandoFactura = false;
            mostrarExito(res.message);
            this.cerrarModalDetalle();
            this.listar();
          },
          error: (err: HttpErrorResponse) => {
            this.anulandoFactura = false;
            mostrarError(err);
          }
        });
    });
  }

  private valorOrden(fac: Factura): string | number | undefined {
    switch (this.campoOrden) {
      case 'numeroFactura':
        return fac.numeroFactura;
      case 'cliente':
        return nombreCompleto(fac.cliente);
      case 'mascota':
        return fac.mascota?.nombreMascota;
      case 'total':
        return Number(fac.total ?? 0);
      case 'saldo':
        return Number(fac.saldoPendiente ?? 0);
      case 'estado':
        return fac.estado;
      default:
        return String(fac.fechaGeneracion ?? '');
    }
  }
}
