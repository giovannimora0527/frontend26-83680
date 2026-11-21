import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { FormulaMedicaRq } from 'src/app/models/formula-medica-rq';
import { Mascota } from 'src/app/models/mascota';
import { Medicamento } from 'src/app/models/medicamento';
import { Medico } from 'src/app/models/medico';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { MovimientoMedicamento } from 'src/app/models/movimiento-medicamento';
import { ClienteService } from 'src/app/services/cliente.service';
import { confirmarAccion, mostrarAdvertencia, mostrarError, mostrarExito } from 'src/app/utils/mensajes-utils';
import { compararValores, estaEnRangoFechas, fechaHoy, nombreCompleto, normalizarTexto, textoEstado } from 'src/app/utils/tabla-utils';
import { CitaService } from '../cita/service/cita.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicamentoService } from '../medicamento/service/medicamento.service';
import { MedicoService } from '../medico/service/medico.service';
import { FormulaMedicaService } from './service/formula-medica.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-formula-medica',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './formula-medica.component.html',
  styleUrl: './formula-medica.component.scss'
})
export class FormulaMedicaComponent {
  // Instancias de modales Bootstrap
  modalInstance: Modal | null = null;
  modalDetalleInstance: Modal | null = null;
  modalDispensarInstance: Modal | null = null;
  titleModal = '';
  modoFormulario = '';
  titleBoton = '';

  // Frecuencias sugeridas para facilitar la prescripción y el cálculo de unidades
  readonly frecuenciasSugeridas = [
    'Cada 6 horas (4 veces al día)',
    'Cada 8 horas (3 veces al día)',
    'Cada 12 horas (2 veces al día)',
    'Cada 24 horas (1 vez al día)',
    'Cada 48 horas',
    'Dosis única'
  ];

  // Variables para la paginación, búsqueda, filtros y ordenamiento de la datatable
  listFormulas: FormulaMedica[] = [];
  terminoBusqueda = '';
  filtroEstado = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  campoOrden = 'fechaCreacionRegistro';
  ordenAscendente = false;
  paginaActual = 1;
  readonly registrosPorPagina = 6;
  cargando = false;
  guardando = false;
  dispensando = false;
  cargandoMovimientos = false;

  // Listas para los combos dependientes: Cliente -> Mascotas del cliente -> Citas de la mascota
  listClientes: Cliente[] = [];
  listMascotas: Mascota[] = [];
  listCitas: Cita[] = [];
  listMedicos: Medico[] = [];
  listMedicamentos: Medicamento[] = [];

  // Formularios y registros seleccionados
  form!: FormGroup;
  formDispensar!: FormGroup;
  formulaSelected: FormulaMedica | null = null;
  formulaDetalle: FormulaMedica | null = null;
  formulaDispensar: FormulaMedica | null = null;
  movimientosFormula: MovimientoMedicamento[] = [];

  // Funciones de utilidad expuestas a la plantilla
  readonly nombreCompleto = nombreCompleto;
  readonly textoEstado = textoEstado;

  constructor(
    private readonly formulaService: FormulaMedicaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly citaService: CitaService,
    private readonly medicoService: MedicoService,
    private readonly medicamentoService: MedicamentoService,
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder
  ) {
    this.inicializarFormulario();
    this.inicializarFormularioDispensar();
    this.listar();
    if (this.puedeFormular) this.cargarCombos();
  }

  inicializarFormulario() {
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [null, Validators.required],
      citaId: [null, Validators.required],
      medicoId: [null, Validators.required],
      medicamentoId: [null, Validators.required],
      fechaEmision: ['', Validators.required],
      dosis: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\d/)]],
      frecuencia: ['', [Validators.required, Validators.maxLength(100)]],
      duracionDias: [null, [Validators.required, Validators.min(1), Validators.max(365)]],
      cantidadSolicitada: [1, [Validators.required, Validators.min(1)]],
      indicaciones: ['', [Validators.required, Validators.maxLength(1000)]]
    });

    // Combos dependientes: cliente -> mascotas -> citas
    this.form.get('clienteId')?.valueChanges.subscribe((clienteId) => {
      this.cargarMascotasCliente(clienteId);
    });
    this.form.get('mascotaId')?.valueChanges.subscribe((mascotaId) => {
      this.cargarCitasMascota(mascotaId);
    });
    // Al elegir la consulta se propone el veterinario que la atendió
    this.form.get('citaId')?.valueChanges.subscribe((citaId) => {
      const cita = this.listCitas.find((item) => item.id === citaId);
      if (cita?.medico) {
        this.form.get('medicoId')?.setValue(cita.medico.id);
      }
    });
  }

  inicializarFormularioDispensar() {
    this.formDispensar = this.formBuilder.group({
      cantidad: [1, [Validators.required, Validators.min(1)]],
      observacion: ['', [Validators.maxLength(300)]]
    });
  }

  get puedeDespachar(): boolean {
    return ['ADMINISTRADOR', 'DESPACHO_MEDICO'].includes(this.authService.role());
  }

  get puedeFormular(): boolean {
    return ['ADMINISTRADOR', 'VETERINARIO'].includes(this.authService.role());
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  get fd(): { [key: string]: AbstractControl } {
    return this.formDispensar.controls;
  }

  // Medicamento seleccionado actualmente en el formulario de prescripción
  get medicamentoSeleccionado(): Medicamento | undefined {
    const id = this.form?.getRawValue()?.medicamentoId;
    return this.listMedicamentos.find((m) => m.id === Number(id));
  }

  // Calcula la cantidad total sugerida a partir de la dosis, frecuencia y duración en días
  get cantidadCalculadaSugerida(): number | null {
    if (!this.form) {
      return null;
    }
    const raw = this.form.getRawValue();
    const duracion = Number(raw.duracionDias);
    if (!duracion || duracion <= 0) {
      return null;
    }
    const textoFrecuencia = String(raw.frecuencia ?? '').toLowerCase();
    let tomasPorDia = 1;
    if (textoFrecuencia.includes('6 hora') || textoFrecuencia.includes('4 veces')) {
      tomasPorDia = 4;
    } else if (textoFrecuencia.includes('8 hora') || textoFrecuencia.includes('3 veces')) {
      tomasPorDia = 3;
    } else if (textoFrecuencia.includes('12 hora') || textoFrecuencia.includes('2 veces')) {
      tomasPorDia = 2;
    } else if (textoFrecuencia.includes('24 hora') || textoFrecuencia.includes('1 vez') || textoFrecuencia.includes('diaria')) {
      tomasPorDia = 1;
    } else if (textoFrecuencia.includes('48 hora')) {
      tomasPorDia = 0.5;
    } else if (textoFrecuencia.includes('unica') || textoFrecuencia.includes('única')) {
      return 1;
    }

    // Si la dosis menciona explícitamente tabletas/cápsulas/unidades, se multiplica; si es mg/ml, se sugiere 1 por toma
    const textoDosis = String(raw.dosis ?? '').toLowerCase();
    let unidadesPorToma = 1;
    const matchUnidades = textoDosis.match(/(\d+)\s*(tableta|capsula|cápsula|comprimido|ampolla|sobre|unidad)/);
    if (matchUnidades) {
      unidadesPorToma = Number(matchUnidades[1]) || 1;
    }

    return Math.max(1, Math.ceil(unidadesPorToma * tomasPorDia * duracion));
  }

  aplicarCantidadSugerida() {
    const sugerida = this.cantidadCalculadaSugerida;
    if (sugerida && sugerida > 0) {
      this.form.get('cantidadSolicitada')?.setValue(sugerida);
    }
  }

  // Validación preventiva de inventario al formular
  get alertaInventarioFormulario(): string | null {
    const med = this.medicamentoSeleccionado;
    if (!med) {
      return null;
    }
    if (med.activo === false) {
      return `El medicamento "${med.nombre}" se encuentra INACTIVO en el inventario.`;
    }
    if (this.estaMedicamentoVencido(med)) {
      return `El medicamento "${med.nombre}" está VENCIDO (fecha de vencimiento: ${med.fechaVence}). No puede formularse.`;
    }
    const disponible = med.cantidadDisponible ?? 0;
    const solicitada = Number(this.form?.getRawValue()?.cantidadSolicitada ?? 0);
    const yaEntregada = this.modoFormulario === 'E' ? (this.formulaSelected?.cantidadEntregada ?? 0) : 0;
    const pendiente = Math.max(0, solicitada - yaEntregada);

    if (disponible <= 0) {
      return `El medicamento "${med.nombre}" está AGOTADO en inventario (0 unidades disponibles).`;
    }
    if (pendiente > disponible) {
      return `Existencia insuficiente: se requieren ${pendiente} unidad(es) y solo hay ${disponible} disponible(s) en inventario.`;
    }
    return null;
  }

  estaMedicamentoVencido(med?: Medicamento): boolean {
    if (!med?.fechaVence) {
      return false;
    }
    return String(med.fechaVence).substring(0, 10) < fechaHoy();
  }

  esStockBajo(med?: Medicamento): boolean {
    if (!med) {
      return false;
    }
    const disp = med.cantidadDisponible ?? 0;
    const min = med.stockMinimo ?? 0;
    return disp > 0 && disp <= min;
  }

  // Contadores KPI para diferenciar Formulación vs. Dispensación
  contarPorEstadoDispensacion(tipo: 'FORMULADA' | 'PARCIAL' | 'ENTREGADA' | 'INACTIVA'): number {
    return this.listFormulas.filter((f) => {
      if (tipo === 'INACTIVA') {
        return !f.activo;
      }
      if (!f.activo) {
        return false;
      }
      const est = (f.estado ?? 'FORMULADA').toUpperCase();
      return est === tipo;
    }).length;
  }

  filtrarRapidoEstado(estado: string) {
    this.filtroEstado = this.filtroEstado === estado ? '' : estado;
    this.paginaActual = 1;
  }

  saldoPendiente(formula?: FormulaMedica | null): number {
    if (!formula) {
      return 0;
    }
    const sol = formula.cantidadSolicitada ?? 0;
    const ent = formula.cantidadEntregada ?? 0;
    return Math.max(0, sol - ent);
  }

  etiquetaEstadoDispensacion(formula?: FormulaMedica | null): string {
    if (!formula) {
      return '-';
    }
    if (!formula.activo) {
      return 'Inactiva / Anulada';
    }
    switch ((formula.estado ?? 'FORMULADA').toUpperCase()) {
      case 'ENTREGADA':
        return 'Dispensada Completa';
      case 'PARCIAL':
        return 'Dispensación Parcial';
      default:
        return 'Formulada (Pendiente Despacho)';
    }
  }

  claseEstadoDispensacion(formula?: FormulaMedica | null): string {
    if (!formula || !formula.activo) {
      return 'bg-secondary text-white';
    }
    switch ((formula.estado ?? 'FORMULADA').toUpperCase()) {
      case 'ENTREGADA':
        return 'bg-success text-white';
      case 'PARCIAL':
        return 'bg-warning text-dark';
      default:
        return 'bg-primary text-white';
    }
  }

  /**
   * Filtra la lista de fórmulas según la búsqueda y los filtros, y la ordena por la columna seleccionada.
   */
  get formulasFiltradas(): FormulaMedica[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());

    const filtradas = this.listFormulas.filter((formula) => {
      const estDisp = (formula.estado ?? 'FORMULADA').toUpperCase();
      if (this.filtroEstado === 'ACTIVA' && !formula.activo) {
        return false;
      }
      if (this.filtroEstado === 'INACTIVA' && formula.activo) {
        return false;
      }
      if (['FORMULADA', 'PARCIAL', 'ENTREGADA'].includes(this.filtroEstado)) {
        if (!formula.activo || estDisp !== this.filtroEstado) {
          return false;
        }
      }
      if (!estaEnRangoFechas(formula.fechaEmision, this.filtroFechaDesde, this.filtroFechaHasta)) {
        return false;
      }
      if (!termino) {
        return true;
      }

      const valores = [
        formula.id,
        formula.mascota?.nombreMascota,
        nombreCompleto(formula.mascota?.cliente),
        formula.medicamento?.nombre,
        formula.medicamento?.codigo,
        formula.medicamento?.lote,
        nombreCompleto(formula.medico),
        formula.dosis,
        formula.frecuencia,
        formula.estado
      ];

      return valores.some((valor) =>
        normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return filtradas.sort((a, b) =>
      compararValores(this.valorOrden(a), this.valorOrden(b), this.ordenAscendente)
    );
  }

  get formulasPaginadas(): FormulaMedica[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.formulasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.formulasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  listar() {
    this.cargando = true;
    const request = this.puedeDespachar && !this.puedeFormular
      ? this.formulaService.listarPendientesDespacho()
      : this.formulaService.listar();
    request.subscribe({
      next: (data) => {
        this.listFormulas = data ?? [];
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        mostrarError(error);
      }
    });
  }

  cargarCombos() {
    this.clienteService.listar().subscribe({
      next: (data) => (this.listClientes = data ?? []),
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
    this.medicoService.listar().subscribe({
      next: (data) => (this.listMedicos = data ?? []),
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
    this.cargarMedicamentos();
  }

  cargarMedicamentos() {
    this.medicamentoService.listar().subscribe({
      next: (data) => (this.listMedicamentos = data ?? []),
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  cargarMascotasCliente(clienteId: number | null) {
    this.listMascotas = [];
    this.listCitas = [];
    this.form.patchValue({ mascotaId: null, citaId: null }, { emitEvent: false });
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (data) => (this.listMascotas = data ?? []),
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  cargarCitasMascota(mascotaId: number | null) {
    this.listCitas = [];
    this.form.get('citaId')?.setValue(null, { emitEvent: false });
    if (!mascotaId) {
      return;
    }
    this.citaService.listarPorMascota(mascotaId).subscribe({
      next: (data) => {
        this.listCitas = (data ?? []).filter((cita) => cita.estado?.toUpperCase() !== 'CANCELADA');
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
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

  nuevaFormula(modo: string) {
    this.formulaSelected = null;
    this.resetFormulario();
    this.cargarMedicamentos();
    this.form.patchValue({ fechaEmision: fechaHoy(), cantidadSolicitada: 1 });
    this.openModal(modo);
  }

  resetFormulario() {
    this.form.enable({ emitEvent: false });
    this.form.reset({ cantidadSolicitada: 1 }, { emitEvent: false });
    this.listMascotas = [];
    this.listCitas = [];
  }

  abrirEdicion(formula: FormulaMedica) {
    if (!formula.id) {
      return;
    }
    this.cargarMedicamentos();
    this.formulaService.consultar(formula.id).subscribe({
      next: (data) => {
        this.formulaSelected = data;
        this.resetFormulario();

        this.listMascotas = data.mascota ? [data.mascota] : [];
        this.listCitas = data.cita ? [data.cita] : [];
        this.form.patchValue({
          clienteId: data.mascota?.cliente?.clienteId,
          mascotaId: data.mascota?.mascotaId,
          citaId: data.cita?.id,
          medicoId: data.medico?.id,
          medicamentoId: data.medicamento?.id,
          fechaEmision: data.fechaEmision,
          dosis: data.dosis,
          frecuencia: data.frecuencia,
          duracionDias: data.duracionDias,
          cantidadSolicitada: data.cantidadSolicitada ?? 1,
          indicaciones: data.indicaciones
        }, { emitEvent: false });
        this.form.get('clienteId')?.disable({ emitEvent: false });
        this.form.get('mascotaId')?.disable({ emitEvent: false });
        this.form.get('citaId')?.disable({ emitEvent: false });

        if ((data.cantidadEntregada ?? 0) > 0) {
          this.form.get('medicamentoId')?.disable({ emitEvent: false });
        }
        if (!data.activo || data.estado?.toUpperCase() === 'ENTREGADA') {
          this.form.disable({ emitEvent: false });
        }
        this.openModal('E');
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  verDetalle(formula: FormulaMedica) {
    if (!formula.id) {
      return;
    }
    this.formulaService.consultar(formula.id).subscribe({
      next: (data) => {
        this.formulaDetalle = data;
        this.movimientosFormula = [];
        this.cargarMovimientosFormula(data.id!);
        const modalElement = document.getElementById('modalDetalleFormula');
        if (modalElement) {
          this.modalDetalleInstance ??= new Modal(modalElement);
          this.modalDetalleInstance.show();
        }
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  private cargarMovimientosFormula(formulaId: number) {
    this.cargandoMovimientos = true;
    this.formulaService.consultarHistorial(formulaId).subscribe({
      next: (movs) => {
        this.movimientosFormula = movs ?? [];
        this.cargandoMovimientos = false;
      },
      error: () => {
        this.cargandoMovimientos = false;
      }
    });
  }

  closeModalDetalle() {
    this.modalDetalleInstance?.hide();
  }

  // Abre el modal para confirmar la dispensación física y descontar inventario
  abrirModalDispensar(formula: FormulaMedica) {
    if (!formula.id) {
      return;
    }
    this.cargarMedicamentos();
    this.formulaService.consultar(formula.id).subscribe({
      next: (data) => {
        this.formulaDispensar = data;
        const pendiente = this.saldoPendiente(data);
        this.formDispensar.reset({
          cantidad: pendiente > 0 ? pendiente : 1,
          observacion: ''
        });
        const el = document.getElementById('modalDispensarFormula');
        if (el) {
          this.modalDispensarInstance ??= new Modal(el);
          this.modalDispensarInstance.show();
        }
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  closeModalDispensar() {
    this.modalDispensarInstance?.hide();
  }

  prepararDespacho(formula: FormulaMedica): void {
    if (!formula.id) return;
    this.formulaService.prepararDespacho(formula.id).subscribe({
      next: (respuesta) => {
        mostrarExito(respuesta.message);
        this.listar();
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  confirmarDispensacion() {
    if (!this.formulaDispensar?.id) {
      return;
    }

    if (this.formDispensar.invalid) {
      this.formDispensar.markAllAsTouched();
      mostrarAdvertencia('Datos incompletos', 'Indique la cantidad a dispensar.');
      return;
    }

    const val = this.formDispensar.getRawValue();
    const cantidad = Number(val.cantidad);
    const pendiente = this.saldoPendiente(this.formulaDispensar);
    const stockActual = this.formulaDispensar.medicamento?.cantidadDisponible ?? 0;

    if (cantidad <= 0 || cantidad > pendiente) {
      mostrarAdvertencia(
        'Cantidad inválida',
        `La cantidad a dispensar debe estar entre 1 y el saldo pendiente de la fórmula (${pendiente}).`
      );
      return;
    }
    if (cantidad > stockActual) {
      mostrarAdvertencia(
        'Stock insuficiente',
        `No hay unidades suficientes en inventario (disponible: ${stockActual}, solicitado: ${cantidad}).`
      );
      return;
    }

    this.dispensando = true;
    this.formulaService.despachar(
      this.formulaDispensar.id,
      cantidad,
      val.observacion
    ).subscribe({
      next: (res) => {
        this.dispensando = false;
        mostrarExito(res.message);
        this.closeModalDispensar();
        this.listar();
        this.cargarMedicamentos();
      },
      error: (error: HttpErrorResponse) => {
        this.dispensando = false;
        mostrarError(error);
      }
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      mostrarAdvertencia('Campos obligatorios', 'Por favor revise los campos marcados con *.');
      return;
    }
    if (this.alertaInventarioFormulario) {
      mostrarAdvertencia('Validación de inventario', this.alertaInventarioFormulario);
      return;
    }

    const datos = this.form.getRawValue();

    // La fecha de emisión no puede ser anterior a la fecha de la consulta
    const cita = this.listCitas.find((item) => item.id === datos.citaId);
    const fechaConsulta = String(cita?.fechaHora ?? '').substring(0, 10);
    if (fechaConsulta && datos.fechaEmision < fechaConsulta) {
      mostrarAdvertencia('Fecha no válida', `La fecha de emisión no puede ser anterior a la fecha de la consulta (${fechaConsulta}).`);
      return;
    }

    const formulaRq: FormulaMedicaRq = {
      formulaId: this.formulaSelected?.id,
      mascotaId: datos.mascotaId,
      citaId: datos.citaId,
      medicoId: datos.medicoId,
      medicamentoId: datos.medicamentoId,
      fechaEmision: datos.fechaEmision,
      cantidadSolicitada: Number(datos.cantidadSolicitada),
      dosis: datos.dosis,
      frecuencia: datos.frecuencia,
      duracionDias: Number(datos.duracionDias),
      indicaciones: datos.indicaciones
    };

    this.guardando = true;
    const peticion = this.modoFormulario === 'C'
      ? this.formulaService.guardar(formulaRq)
      : this.formulaService.actualizar(formulaRq);

    peticion.subscribe({
      next: (respuesta: MiRespuesta) => {
        this.guardando = false;
        mostrarExito(respuesta.message);
        this.closeModal();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error);
      }
    });
  }

  inactivarFormula(formula: FormulaMedica) {
    if (!formula.id) {
      return;
    }
    confirmarAccion(
      'Inactivar fórmula médica',
      `¿Desea inactivar la fórmula #${formula.id} (${formula.medicamento?.nombre})? Ya no se podrá modificar ni dispensar.`
    ).then((confirmado) => {
      if (!confirmado || !formula.id) {
        return;
      }
      this.formulaService.inactivar(formula.id).subscribe({
        next: (respuesta) => {
          mostrarExito(respuesta.message);
          this.listar();
        },
        error: (error: HttpErrorResponse) => mostrarError(error)
      });
    });
  }

  closeModal() {
    this.modalInstance?.hide();
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Generar Nueva Fórmula Médica' : 'Editar Fórmula Médica';
    this.titleBoton = modo === 'C' ? 'Guardar Fórmula Médica' : 'Actualizar Fórmula Médica';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearFormulaMedica');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  private valorOrden(formula: FormulaMedica): string | number | undefined {
    switch (this.campoOrden) {
      case 'fechaEmision':
        return String(formula.fechaEmision ?? '');
      case 'mascota':
        return formula.mascota?.nombreMascota;
      case 'medicamento':
        return formula.medicamento?.nombre;
      case 'medico':
        return nombreCompleto(formula.medico);
      case 'estado':
        return this.etiquetaEstadoDispensacion(formula);
      default:
        return String(formula.fechaCreacionRegistro ?? '');
    }
  }
}
