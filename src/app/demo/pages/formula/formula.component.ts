import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Modal } from 'bootstrap';

import { FormulaService } from './service/formula.service';
import { HistoriaService } from '../historia/service/historia.service';
import { CatalogoService } from 'src/app/services/catalogo.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { ClienteOpcion, MascotaOpcion, MedicamentoOpcion, MedicoOpcion } from 'src/app/models/catalogo';
import { HistoriaClinica } from 'src/app/models/historia';
import {
  ESTADOS_FORMULA,
  EstadoFormula,
  FiltroFormulas,
  Formula,
  FormulaRq,
  LIMITES_FORMULA,
  UNIDADES_DOSIS
} from 'src/app/models/formula';
import { OrdenTabla } from 'src/app/utils/orden-tabla';
import { hoyIso } from 'src/app/utils/fechas';
import { avisar, confirmar, mostrarError, notificarExito } from 'src/app/utils/mensajes';

/** Cliente, mascota e historia que llegan por la URL para abrir el formulario ya diligenciado. */
interface Preseleccion {
  /** Mascota a seleccionar cuando carguen las mascotas del cliente. */
  mascotaId: number | null;
  /** Historia a seleccionar cuando carguen las historias de la mascota. */
  historiaId: number | null;
}

/** Cantidad máxima de historias que se ofrecen en el combo de una mascota. */
const MAXIMO_HISTORIAS_COMBO = 100;

/**
 * Pantalla de fórmulas médicas: listado resumido, paginado, con filtros y
 * orden (resueltos en el backend), registro, edición de los datos del
 * tratamiento, detalle completo e inactivación.
 *
 * Reglas que se reflejan en la interfaz (y que el backend vuelve a validar):
 * la historia debe ser de la mascota elegida y la mascota del cliente; la
 * fecha de emisión no puede ser anterior a la consulta; dosis, frecuencia y
 * duración deben ser valores válidos; una fórmula no se borra, se inactiva,
 * y una fórmula inactiva ya no se edita.
 */
@Component({
  selector: 'app-formula',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './formula.component.html'
})
export class FormulaComponent implements OnInit, OnDestroy {
  /** Estados para el filtro. */
  readonly estados: EstadoFormula[] = ESTADOS_FORMULA;
  /** Unidades para el combo de la dosis. */
  readonly unidades: string[] = UNIDADES_DOSIS;
  /** Límites de dosis, frecuencia y duración. */
  readonly limites = LIMITES_FORMULA;

  // ----- Listado -----

  /** Fórmulas de la página actual. */
  formulas: Formula[] = [];
  /** Indica que se está consultando el listado. */
  cargandoLista = false;
  /** Indica que la última consulta del listado falló. */
  errorLista = false;
  /** Página actual (empieza en 0). */
  paginaActual = 0;
  /** Registros por página. */
  registrosPorPagina = 10;
  /** Total de registros que cumplen los filtros. */
  totalRegistros = 0;
  /** Total de páginas. */
  totalPaginas = 0;
  /** Orden del listado: por defecto las más recientes primero (fecha de creación descendente). */
  readonly orden = new OrdenTabla('creacion', 'desc');

  // ----- Filtros -----

  /** Texto de búsqueda libre. */
  terminoBusqueda = '';
  /** Estado seleccionado (vacío = todos). */
  filtroEstado = '';
  /** Veterinario seleccionado. */
  filtroMedico: number | null = null;
  /** Medicamento seleccionado. */
  filtroMedicamento: number | null = null;
  /** Fecha de emisión inicial. */
  filtroDesde = '';
  /** Fecha de emisión final. */
  filtroHasta = '';

  // ----- Catálogos -----

  /** Clientes disponibles. */
  clientes: ClienteOpcion[] = [];
  /** Veterinarios disponibles. */
  medicos: MedicoOpcion[] = [];
  /** Medicamentos disponibles. */
  medicamentos: MedicamentoOpcion[] = [];
  /** Mascotas del cliente elegido. */
  mascotas: MascotaOpcion[] = [];
  /** Historias clínicas de la mascota elegida. */
  historias: HistoriaClinica[] = [];
  /** Indica que se están cargando las mascotas. */
  cargandoMascotas = false;
  /** Indica que se están cargando las historias. */
  cargandoHistorias = false;

  // ----- Formulario -----

  /** Formulario reactivo de la fórmula. */
  form!: FormGroup;
  /** Modo del formulario: C (crear) o E (editar). */
  modoFormulario: 'C' | 'E' = 'C';
  /** Fórmula que se está editando (null al crear). */
  formulaEditando: Formula | null = null;
  /** Indica que se está enviando el formulario. */
  guardando = false;

  // ----- Detalle -----

  /** Fórmula mostrada en el modal de detalle. */
  formulaDetalle: Formula | null = null;
  /** Indica que se está consultando el detalle. */
  cargandoDetalle = false;

  /** Instancia del modal del formulario. */
  private modalFormulario: Modal | null = null;
  /** Instancia del modal de detalle. */
  private modalDetalle: Modal | null = null;
  /** Emite el texto de búsqueda para esperar a que el usuario deje de escribir. */
  private readonly busqueda$ = new Subject<string>();
  /** Suscripciones permanentes que se cierran al destruir el componente. */
  private readonly suscripciones = new Subscription();
  /** Consulta en curso del listado. */
  private suscripcionLista: Subscription | null = null;
  /** Consulta en curso de mascotas. */
  private suscripcionMascotas: Subscription | null = null;
  /** Consulta en curso de historias. */
  private suscripcionHistorias: Subscription | null = null;
  /** Selección que llegó por la URL y falta aplicar. */
  private preseleccion: Preseleccion | null = null;

  /**
   * Valida que la fecha de emisión no sea anterior a la fecha de la consulta asociada.
   */
  private readonly validarFechaEmision = (grupo: AbstractControl): ValidationErrors | null => {
    const fechaEmision = grupo.get('fechaEmision')?.value as string;
    const minima = this.fechaMinimaEmision;
    return fechaEmision && minima && fechaEmision < minima ? { emisionAnterior: true } : null;
  };

  /**
   * @param formulaService servicio de fórmulas.
   * @param historiaService servicio de historias, para el combo de consultas de la mascota.
   * @param catalogoService servicio de clientes, mascotas, veterinarios y medicamentos.
   * @param formBuilder constructor de formularios reactivos.
   * @param route ruta activa, para leer la historia que llega desde el módulo de historias.
   * @param router enrutador, para limpiar los parámetros de la URL.
   */
  constructor(
    private readonly formulaService: FormulaService,
    private readonly historiaService: HistoriaService,
    private readonly catalogoService: CatalogoService,
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) { }

  /** Inicializa formulario, catálogos, búsqueda con espera, primer listado y la historia recibida por URL. */
  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCatalogos();

    this.suscripciones.add(
      this.busqueda$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((texto) => {
        this.terminoBusqueda = texto;
        this.paginaActual = 0;
        this.listar();
      })
    );

    this.listar();
    this.abrirDesdeUrl();
  }

  /** Cierra suscripciones y modales al salir de la pantalla. */
  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
    this.suscripcionLista?.unsubscribe();
    this.suscripcionMascotas?.unsubscribe();
    this.suscripcionHistorias?.unsubscribe();
    this.modalFormulario?.dispose();
    this.modalDetalle?.dispose();
  }

  /** Acceso corto a los controles del formulario. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Indica si hay algún filtro activo. */
  get hayFiltros(): boolean {
    return !!(
      this.terminoBusqueda.trim() ||
      this.filtroEstado ||
      this.filtroMedico !== null ||
      this.filtroMedicamento !== null ||
      this.filtroDesde ||
      this.filtroHasta
    );
  }

  /** Historia elegida en el formulario. */
  get historiaSeleccionada(): HistoriaClinica | null {
    // El validador del grupo se ejecuta mientras se construye el formulario, antes de que exista.
    const historiaId = this.form?.get('historiaId')?.value as number | null | undefined;
    return this.historias.find((h) => h.historiaId === historiaId) ?? null;
  }

  /** Fecha mínima de emisión: la de la consulta asociada (vacío si aún no hay consulta). */
  get fechaMinimaEmision(): string {
    if (this.modoFormulario === 'E') {
      return this.formulaEditando?.historiaFecha ?? '';
    }
    return this.historiaSeleccionada?.fecha ?? '';
  }

  // ===================== Listado =====================

  /** Consulta al backend la página actual con el orden y los filtros vigentes. */
  listar(): void {
    this.suscripcionLista?.unsubscribe();
    this.cargandoLista = true;
    this.errorLista = false;

    const filtro: FiltroFormulas = {
      page: this.paginaActual,
      size: this.registrosPorPagina,
      orden: this.orden.columna,
      direccion: this.orden.direccion,
      texto: this.terminoBusqueda,
      estado: this.filtroEstado,
      medicoId: this.filtroMedico,
      medicamentoId: this.filtroMedicamento,
      desde: this.filtroDesde,
      hasta: this.filtroHasta
    };

    this.suscripcionLista = this.formulaService.listar(filtro).subscribe({
      next: (pagina) => {
        this.formulas = pagina.content;
        this.totalRegistros = pagina.totalElements;
        this.totalPaginas = pagina.totalPages;
        this.paginaActual = pagina.page;
        this.cargandoLista = false;
        if (pagina.content.length === 0 && pagina.totalPages > 0 && pagina.page >= pagina.totalPages) {
          this.irAPagina(pagina.totalPages - 1);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoLista = false;
        this.errorLista = true;
        this.formulas = [];
        mostrarError(error, 'No se pudieron cargar las fórmulas');
      }
    });
  }

  /**
   * Recibe lo que escribe el usuario en el buscador y lo envía con espera.
   *
   * @param texto texto actual del buscador.
   */
  alEscribirBusqueda(texto: string): void {
    this.busqueda$.next(texto ?? '');
  }

  /** Aplica los filtros y vuelve a la primera página. */
  aplicarFiltros(): void {
    if (this.filtroDesde && this.filtroHasta && this.filtroDesde > this.filtroHasta) {
      avisar('Rango de fechas inválido', 'La fecha inicial no puede ser posterior a la fecha final.', 'warning');
      return;
    }
    this.paginaActual = 0;
    this.listar();
  }

  /** Quita los filtros y deja el orden inicial (más recientes primero). */
  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroMedico = null;
    this.filtroMedicamento = null;
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.orden.reiniciar();
    this.paginaActual = 0;
    this.listar();
  }

  /**
   * Ordena el listado por una columna.
   *
   * @param columna emision, mascota, cliente, medicamento, medico o estado.
   */
  ordenar(columna: string): void {
    this.orden.alternar(columna);
    this.paginaActual = 0;
    this.listar();
  }

  /**
   * Cambia de página.
   *
   * @param pagina número de página (empieza en 0).
   */
  irAPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.listar();
  }

  /**
   * Cambia la cantidad de registros por página y vuelve a la primera.
   *
   * @param tamano nueva cantidad.
   */
  cambiarTamanoPagina(tamano: number): void {
    this.registrosPorPagina = tamano;
    this.paginaActual = 0;
    this.listar();
  }

  // ===================== Formulario =====================

  /** Crea el formulario reactivo con sus validaciones y los combos dependientes. */
  private inicializarFormulario(): void {
    const entero = Validators.pattern(/^\d+$/);
    this.form = this.formBuilder.group(
      {
        clienteId: [null, Validators.required],
        mascotaId: [{ value: null, disabled: true }, Validators.required],
        historiaId: [{ value: null, disabled: true }, Validators.required],
        medicoId: [null, Validators.required],
        fechaEmision: ['', Validators.required],
        medicamentoId: [null, Validators.required],
        dosis: [null, [Validators.required, Validators.min(0.01), Validators.max(LIMITES_FORMULA.dosisMaxima)]],
        unidadDosis: ['', Validators.required],
        frecuenciaHoras: [null, [Validators.required, entero,
          Validators.min(LIMITES_FORMULA.frecuenciaMinima), Validators.max(LIMITES_FORMULA.frecuenciaMaxima)]],
        duracionDias: [null, [Validators.required, entero,
          Validators.min(LIMITES_FORMULA.duracionMinima), Validators.max(LIMITES_FORMULA.duracionMaxima)]],
        indicaciones: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)]]
      },
      { validators: this.validarFechaEmision }
    );

    // Combos dependientes: cliente → mascotas del cliente → historias de la mascota.
    this.suscripciones.add(
      this.f['clienteId'].valueChanges.subscribe((id: number | null) => this.alCambiarCliente(id))
    );
    this.suscripciones.add(
      this.f['mascotaId'].valueChanges.subscribe((id: number | null) => this.alCambiarMascota(id))
    );
    this.suscripciones.add(
      this.f['historiaId'].valueChanges.subscribe((id: number | null) => this.alCambiarHistoria(id))
    );
  }

  /** Carga clientes, veterinarios y medicamentos para los combos y filtros. */
  private cargarCatalogos(): void {
    this.catalogoService.listarClientes().subscribe({
      next: (data) => (this.clientes = data),
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cargar la lista de clientes')
    });
    this.catalogoService.listarMedicos().subscribe({
      next: (data) => (this.medicos = data),
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cargar la lista de veterinarios')
    });
    this.catalogoService.listarMedicamentos().subscribe({
      next: (data) => (this.medicamentos = data),
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cargar la lista de medicamentos')
    });
  }

  /**
   * Al cambiar el cliente limpia mascota e historia, y consulta solo las mascotas del cliente.
   *
   * @param clienteId cliente elegido.
   */
  private alCambiarCliente(clienteId: number | null): void {
    this.suscripcionMascotas?.unsubscribe();
    this.limpiarControl('mascotaId');
    this.mascotas = [];
    this.alCambiarMascota(null);
    if (clienteId === null || this.modoFormulario === 'E') {
      return;
    }

    this.cargandoMascotas = true;
    this.suscripcionMascotas = this.catalogoService.listarMascotasPorCliente(clienteId).subscribe({
      next: (data) => {
        this.mascotas = data;
        this.cargandoMascotas = false;
        if (data.length > 0) {
          this.f['mascotaId'].enable({ emitEvent: false });
        }
        const mascotaId = this.preseleccion?.mascotaId;
        if (mascotaId && data.some((m) => m.mascotaId === mascotaId)) {
          this.f['mascotaId'].setValue(mascotaId);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoMascotas = false;
        mostrarError(error, 'No se pudieron cargar las mascotas del cliente');
      }
    });
  }

  /**
   * Al cambiar la mascota limpia la historia y consulta solo las historias de esa mascota,
   * así una fórmula no puede quedar asociada a la consulta de otra mascota.
   *
   * @param mascotaId mascota elegida.
   */
  private alCambiarMascota(mascotaId: number | null): void {
    this.suscripcionHistorias?.unsubscribe();
    this.limpiarControl('historiaId');
    this.historias = [];
    if (mascotaId === null || this.modoFormulario === 'E') {
      return;
    }

    this.cargandoHistorias = true;
    this.suscripcionHistorias = this.historiaService.listar({
      page: 0,
      size: MAXIMO_HISTORIAS_COMBO,
      orden: 'fecha',
      direccion: 'desc',
      mascotaId
    }).subscribe({
      next: (pagina) => {
        this.historias = pagina.content;
        this.cargandoHistorias = false;
        if (pagina.content.length > 0) {
          this.f['historiaId'].enable({ emitEvent: false });
        }
        const historiaId = this.preseleccion?.historiaId;
        if (historiaId && pagina.content.some((h) => h.historiaId === historiaId)) {
          this.f['historiaId'].setValue(historiaId);
        }
        this.preseleccion = null;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoHistorias = false;
        this.preseleccion = null;
        mostrarError(error, 'No se pudieron cargar las historias clínicas de la mascota');
      }
    });
  }

  /**
   * Al elegir la historia propone su veterinario y, si la fecha de emisión
   * quedó antes de la consulta, la ajusta a la fecha de la consulta.
   *
   * @param historiaId historia elegida.
   */
  private alCambiarHistoria(historiaId: number | null): void {
    const historia = this.historias.find((h) => h.historiaId === historiaId);
    if (historia) {
      this.f['medicoId'].setValue(historia.medicoId);
      const emision = this.f['fechaEmision'].value as string;
      if (!emision || emision < historia.fecha) {
        this.f['fechaEmision'].setValue(historia.fecha);
      }
    }
    this.form.updateValueAndValidity();
  }

  /**
   * Borra y deshabilita un combo dependiente sin disparar sus eventos.
   *
   * @param nombre nombre del control.
   */
  private limpiarControl(nombre: string): void {
    this.f[nombre].reset(null, { emitEvent: false });
    this.f[nombre].disable({ emitEvent: false });
  }

  /** Deja el formulario en su estado inicial de "fórmula nueva". */
  private reiniciarFormulario(): void {
    this.modoFormulario = 'C';
    this.formulaEditando = null;
    this.form.reset(
      {
        clienteId: null, mascotaId: null, historiaId: null, medicoId: null,
        fechaEmision: hoyIso(), medicamentoId: null, dosis: null, unidadDosis: '',
        frecuenciaHoras: null, duracionDias: null, indicaciones: ''
      },
      { emitEvent: false }
    );
    this.f['clienteId'].enable({ emitEvent: false });
    this.f['medicoId'].enable({ emitEvent: false });
    this.limpiarControl('mascotaId');
    this.limpiarControl('historiaId');
    this.mascotas = [];
    this.historias = [];
  }

  /** Abre el formulario vacío para registrar una fórmula. */
  abrirNueva(): void {
    this.preseleccion = null;
    this.reiniciarFormulario();
    this.abrirModal('modalFormula', 'formulario');
  }

  /**
   * Si la pantalla se abrió desde una historia (?clienteId=&mascotaId=&historiaId=),
   * abre el formulario con esos datos ya seleccionados y limpia la URL.
   */
  private abrirDesdeUrl(): void {
    const params = this.route.snapshot.queryParamMap;
    const clienteId = Number(params.get('clienteId'));
    if (!clienteId) {
      return;
    }
    this.reiniciarFormulario();
    this.preseleccion = {
      mascotaId: Number(params.get('mascotaId')) || null,
      historiaId: Number(params.get('historiaId')) || null
    };
    this.f['clienteId'].setValue(clienteId);
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    setTimeout(() => this.abrirModal('modalFormula', 'formulario'));
  }

  /**
   * Abre el formulario para editar una fórmula. Solo se editan los datos del
   * tratamiento; paciente, consulta y veterinario quedan fijos porque la
   * fórmula ya fue emitida para ellos. Una fórmula inactiva no se edita.
   *
   * @param formula fórmula a editar.
   */
  abrirEdicion(formula: Formula): void {
    if (formula.estado === 'INACTIVA') {
      avisar('Esta fórmula está inactiva', 'Una fórmula inactiva se conserva solo como registro y no se puede modificar.');
      return;
    }
    this.modoFormulario = 'E';
    this.formulaEditando = formula;
    this.mascotas = [];
    this.historias = [];
    this.form.reset(
      {
        clienteId: formula.clienteId,
        mascotaId: formula.mascotaId,
        historiaId: formula.historiaId,
        medicoId: formula.medicoId,
        fechaEmision: formula.fechaEmision,
        medicamentoId: formula.medicamentoId,
        dosis: formula.dosis,
        unidadDosis: formula.unidadDosis,
        frecuenciaHoras: formula.frecuenciaHoras,
        duracionDias: formula.duracionDias,
        indicaciones: formula.indicaciones
      },
      { emitEvent: false }
    );
    ['clienteId', 'mascotaId', 'historiaId', 'medicoId'].forEach((campo) =>
      this.f[campo].disable({ emitEvent: false })
    );
    this.form.updateValueAndValidity();
    this.abrirModal('modalFormula', 'formulario');
  }

  /** Envía el formulario: crea la fórmula o actualiza la que se está editando. */
  guardar(): void {
    if (this.guardando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const formulaRq: FormulaRq = {
      fechaEmision: valores.fechaEmision,
      medicamentoId: Number(valores.medicamentoId),
      dosis: Number(valores.dosis),
      unidadDosis: valores.unidadDosis,
      frecuenciaHoras: Number(valores.frecuenciaHoras),
      duracionDias: Number(valores.duracionDias),
      indicaciones: String(valores.indicaciones).trim()
    };
    if (this.modoFormulario === 'C') {
      formulaRq.mascotaId = Number(valores.mascotaId);
      formulaRq.historiaId = Number(valores.historiaId);
      formulaRq.medicoId = Number(valores.medicoId);
    }

    this.guardando = true;
    const peticion = this.modoFormulario === 'C'
      ? this.formulaService.guardar(formulaRq)
      : this.formulaService.actualizar(this.formulaEditando!.formulaId, formulaRq);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando = false;
        notificarExito(respuesta.message);
        this.modalFormulario?.hide();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error, 'No se pudo guardar la fórmula');
      }
    });
  }

  /** Cierra el modal del formulario. */
  cerrarFormulario(): void {
    this.modalFormulario?.hide();
  }

  /**
   * Indica si un campo debe mostrarse como inválido.
   *
   * @param campo nombre del control.
   * @returns true si es inválido y el usuario ya interactuó con él.
   */
  invalido(campo: string): boolean {
    const control = this.f[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  /** Indica si hay que mostrar el aviso de fecha de emisión anterior a la consulta. */
  get emisionAnterior(): boolean {
    return !!this.form.errors?.['emisionAnterior'] && (this.f['fechaEmision'].touched || this.f['fechaEmision'].dirty
      || !!this.historiaSeleccionada);
  }

  // ===================== Detalle e inactivación =====================

  /**
   * Abre el modal con el detalle completo de la fórmula, consultado al backend.
   *
   * @param formula fila seleccionada.
   */
  verDetalle(formula: Formula): void {
    this.formulaDetalle = null;
    this.cargandoDetalle = true;
    this.abrirModal('modalDetalleFormula', 'detalle');
    this.formulaService.consultar(formula.formulaId).subscribe({
      next: (data) => {
        this.formulaDetalle = data;
        this.cargandoDetalle = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoDetalle = false;
        this.modalDetalle?.hide();
        mostrarError(error, 'No se pudo consultar la fórmula');
      }
    });
  }

  /**
   * Inactiva una fórmula tras confirmar con el usuario. No se elimina porque
   * hace parte de la información clínica de la mascota.
   *
   * @param formula fórmula activa.
   */
  async inactivar(formula: Formula): Promise<void> {
    const confirmado = await confirmar(
      '¿Inactivar la fórmula?',
      'La fórmula se conservará en el historial de la mascota, pero ya no se podrá modificar.',
      'Sí, inactivar'
    );
    if (!confirmado) {
      return;
    }
    this.formulaService.inactivar(formula.formulaId).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.listar();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo inactivar la fórmula')
    });
  }

  // ===================== Utilidades =====================

  /**
   * Clase de Bootstrap para la etiqueta de cada estado.
   *
   * @param estado estado de la fórmula.
   * @returns clases CSS de la etiqueta.
   */
  claseEstado(estado: EstadoFormula): string {
    return estado === 'INACTIVA' ? 'bg-secondary' : 'bg-success';
  }

  /**
   * Abre uno de los modales de la pantalla.
   *
   * @param id identificador del elemento del modal.
   * @param tipo modal del formulario o del detalle.
   */
  private abrirModal(id: string, tipo: 'formulario' | 'detalle'): void {
    const elemento = document.getElementById(id);
    if (!elemento) {
      return;
    }
    if (tipo === 'formulario') {
      this.modalFormulario ??= new Modal(elemento);
      this.modalFormulario.show();
    } else {
      this.modalDetalle ??= new Modal(elemento);
      this.modalDetalle.show();
    }
  }
}
