import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormArray,
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
import { AuthService } from 'src/app/services/auth.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { ClienteOpcion, MascotaOpcion, MedicamentoOpcion, MedicoOpcion } from 'src/app/models/catalogo';
import { HistoriaClinica } from 'src/app/models/historia';
import {
  ESTADOS_DESPACHO,
  ESTADOS_FORMULA,
  EstadoFormula,
  FiltroFormulas,
  Formula,
  FormulaDetalleRq,
  FormulaRq,
  LIMITES_FORMULA,
  UNIDADES_CONTABLES,
  UNIDADES_DOSIS,
  VIAS_ADMINISTRACION,
  claseEstadoDespacho,
  textoEstadoDespacho
} from 'src/app/models/formula';
import { OrdenTabla } from 'src/app/utils/orden-tabla';
import { hoyIso } from 'src/app/utils/fechas';
import { descargarArchivo } from 'src/app/utils/archivos';
import { avisar, confirmar, mostrarError, notificarExito, pedirMotivo } from 'src/app/utils/mensajes';

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
 * Pantalla de fórmulas médicas con varios medicamentos.
 *
 * El veterinario de la sesión formula: elige la consulta, agrega uno o más
 * medicamentos (dosis, frecuencia, duración, vía, cantidad e indicaciones) y
 * guarda la fórmula como borrador o la confirma para enviarla a despacho.
 * Solo el autor modifica o confirma sus borradores; una fórmula sin entregas
 * se puede anular con motivo. Al formular se muestra la disponibilidad del
 * inventario como advertencia: el descuento lo hace despacho al entregar.
 */
@Component({
  selector: 'app-formula',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './formula.component.html'
})
export class FormulaComponent implements OnInit, OnDestroy {
  /** Estados de la fórmula para el filtro. */
  readonly estados: EstadoFormula[] = ESTADOS_FORMULA;
  /** Estados del despacho para el filtro. */
  readonly estadosDespacho = ESTADOS_DESPACHO;
  /** Unidades de la dosis. */
  readonly unidades: string[] = UNIDADES_DOSIS;
  /** Vías de administración. */
  readonly vias = VIAS_ADMINISTRACION;
  /** Límites de los valores numéricos. */
  readonly limites = LIMITES_FORMULA;
  /** Texto y clase de los estados de despacho, para la plantilla. */
  readonly textoDespacho = textoEstadoDespacho;
  readonly claseDespacho = claseEstadoDespacho;

  /** Sesión actual. */
  private readonly auth = inject(AuthService);
  /** Solo el veterinario crea o modifica fórmulas; los demás perfiles las consultan. */
  readonly puedeRegistrar = this.auth.tieneRol('VETERINARIO');
  /** Médico enlazado al usuario de la sesión (null si no es veterinario). */
  readonly medicoSesionId = this.auth.perfil?.medicoId ?? null;
  /** Nombre del médico de la sesión. */
  readonly medicoSesionNombre = this.auth.perfil?.medicoNombre ?? '';

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
  /** Orden del listado: las más recientes primero. */
  readonly orden = new OrdenTabla('creacion', 'desc');

  // ----- Filtros -----

  /** Texto de búsqueda libre. */
  terminoBusqueda = '';
  /** Estado de la fórmula (vacío = todos). */
  filtroEstado = '';
  /** Estado del despacho (vacío = todos). */
  filtroDespacho = '';
  /** Veterinario. */
  filtroMedico: number | null = null;
  /** Medicamento. */
  filtroMedicamento: number | null = null;
  /** Fecha de emisión inicial. */
  filtroDesde = '';
  /** Fecha de emisión final. */
  filtroHasta = '';

  // ----- Catálogos -----

  /** Clientes. */
  clientes: ClienteOpcion[] = [];
  /** Veterinarios (filtro). */
  medicos: MedicoOpcion[] = [];
  /** Medicamentos activos con su disponibilidad. */
  medicamentos: MedicamentoOpcion[] = [];
  /** Mascotas del cliente elegido. */
  mascotas: MascotaOpcion[] = [];
  /** Consultas abiertas de la mascota elegida. */
  historias: HistoriaClinica[] = [];
  /** Indica que se están cargando las mascotas. */
  cargandoMascotas = false;
  /** Indica que se están cargando las historias. */
  cargandoHistorias = false;

  // ----- Formulario -----

  /** Formulario reactivo de la fórmula. */
  form!: FormGroup;
  /** Modo del formulario: C (crear) o E (editar borrador). */
  modoFormulario: 'C' | 'E' = 'C';
  /** Fórmula que se está editando (null al crear). */
  formulaEditando: Formula | null = null;
  /** Indica que se está enviando el formulario. */
  guardando = false;
  /** Indica que se está cargando una fórmula para editarla. */
  cargandoEdicion: number | null = null;

  // ----- Detalle -----

  /** Fórmula mostrada en el modal de detalle. */
  formulaDetalle: Formula | null = null;
  /** Indica que se está consultando el detalle. */
  cargandoDetalle = false;
  /** Fórmula cuyo PDF se está descargando. */
  descargando: number | null = null;

  /** Instancia del modal del formulario. */
  private modalFormulario: Modal | null = null;
  /** Instancia del modal de detalle. */
  private modalDetalle: Modal | null = null;
  /** Emite el texto de búsqueda para esperar a que el usuario deje de escribir. */
  private readonly busqueda$ = new Subject<string>();
  /** Suscripciones permanentes. */
  private readonly suscripciones = new Subscription();
  /** Consulta en curso del listado. */
  private suscripcionLista: Subscription | null = null;
  /** Consulta en curso de mascotas. */
  private suscripcionMascotas: Subscription | null = null;
  /** Consulta en curso de historias. */
  private suscripcionHistorias: Subscription | null = null;
  /** Selección que llegó por la URL y falta aplicar. */
  private preseleccion: Preseleccion | null = null;

  /** Valida que la fecha de emisión no sea anterior a la consulta. */
  private readonly validarFechaEmision = (grupo: AbstractControl): ValidationErrors | null => {
    const fechaEmision = grupo.get('fechaEmision')?.value as string;
    const minima = this.fechaMinimaEmision;
    return fechaEmision && minima && fechaEmision < minima ? { emisionAnterior: true } : null;
  };

  /** Valida que un medicamento no se repita en la fórmula. */
  private readonly validarSinRepetidos = (lineas: AbstractControl): ValidationErrors | null => {
    const ids = (lineas as FormArray).controls
      .map((c) => c.get('medicamentoId')?.value as number | null)
      .filter((id): id is number => id !== null);
    return new Set(ids).size !== ids.length ? { repetidos: true } : null;
  };

  /**
   * @param formulaService servicio de fórmulas.
   * @param historiaService servicio de historias, para el combo de consultas.
   * @param catalogoService clientes, mascotas, veterinarios y medicamentos.
   * @param formBuilder constructor de formularios reactivos.
   * @param route ruta activa, para la historia que llega desde el módulo de historias.
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

  /** Inicializa formulario, catálogos, búsqueda, primer listado y la historia recibida por URL. */
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

  /** Cierra suscripciones y modales al salir. */
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

  /** Medicamentos del formulario. */
  get lineas(): FormArray<FormGroup> {
    return this.form.get('detalles') as FormArray<FormGroup>;
  }

  /** Indica si hay algún filtro activo. */
  get hayFiltros(): boolean {
    return !!(
      this.terminoBusqueda.trim() || this.filtroEstado || this.filtroDespacho ||
      this.filtroMedico !== null || this.filtroMedicamento !== null || this.filtroDesde || this.filtroHasta
    );
  }

  /** Historia elegida en el formulario. */
  get historiaSeleccionada(): HistoriaClinica | null {
    const historiaId = this.form?.get('historiaId')?.value as number | null | undefined;
    return this.historias.find((h) => h.historiaId === historiaId) ?? null;
  }

  /** Fecha mínima de emisión: la de la consulta. */
  get fechaMinimaEmision(): string {
    if (this.modoFormulario === 'E') {
      return this.formulaEditando?.historiaFecha ?? '';
    }
    return this.historiaSeleccionada?.fecha ?? '';
  }

  // ===================== Listado =====================

  /** Consulta la página actual con el orden y los filtros vigentes. */
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
      estadoDespacho: this.filtroDespacho,
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

  /** Recibe lo que escribe el usuario en el buscador. */
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

  /** Quita los filtros y deja el orden inicial. */
  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroDespacho = '';
    this.filtroMedico = null;
    this.filtroMedicamento = null;
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.orden.reiniciar();
    this.paginaActual = 0;
    this.listar();
  }

  /** Ordena el listado por una columna. */
  ordenar(columna: string): void {
    this.orden.alternar(columna);
    this.paginaActual = 0;
    this.listar();
  }

  /** Cambia de página. */
  irAPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.listar();
  }

  /** Cambia la cantidad de registros por página. */
  cambiarTamanoPagina(tamano: number): void {
    this.registrosPorPagina = tamano;
    this.paginaActual = 0;
    this.listar();
  }

  /** Indica si la fórmula es un borrador del veterinario de la sesión. */
  esBorradorPropio(formula: Formula): boolean {
    return this.puedeRegistrar && formula.estado === 'BORRADOR' && formula.medicoId === this.medicoSesionId;
  }

  // ===================== Formulario =====================

  /** Crea el formulario reactivo con sus validaciones y los combos dependientes. */
  private inicializarFormulario(): void {
    this.form = this.formBuilder.group(
      {
        clienteId: [null, Validators.required],
        mascotaId: [{ value: null, disabled: true }, Validators.required],
        historiaId: [{ value: null, disabled: true }, Validators.required],
        fechaEmision: ['', Validators.required],
        observaciones: ['', Validators.maxLength(1000)],
        detalles: this.formBuilder.array<FormGroup>([], {
          validators: [Validators.required, Validators.maxLength(LIMITES_FORMULA.maximoLineas), this.validarSinRepetidos]
        })
      },
      { validators: this.validarFechaEmision }
    );

    this.suscripciones.add(this.f['clienteId'].valueChanges.subscribe((id: number | null) => this.alCambiarCliente(id)));
    this.suscripciones.add(this.f['mascotaId'].valueChanges.subscribe((id: number | null) => this.alCambiarMascota(id)));
    this.suscripciones.add(this.f['historiaId'].valueChanges.subscribe((id: number | null) => this.alCambiarHistoria(id)));
  }

  /**
   * Crea el grupo de controles de un medicamento.
   *
   * @param valores datos iniciales (al editar).
   */
  private crearLinea(valores?: Partial<FormulaDetalleRq>): FormGroup {
    const entero = Validators.pattern(/^\d+$/);
    return this.formBuilder.group({
      medicamentoId: [valores?.medicamentoId ?? null, Validators.required],
      dosis: [valores?.dosis ?? null, [Validators.required, Validators.min(0.01), Validators.max(LIMITES_FORMULA.dosisMaxima)]],
      unidadDosis: [valores?.unidadDosis ?? '', Validators.required],
      frecuenciaHoras: [valores?.frecuenciaHoras ?? null, [Validators.required, entero,
        Validators.min(LIMITES_FORMULA.frecuenciaMinima), Validators.max(LIMITES_FORMULA.frecuenciaMaxima)]],
      duracionDias: [valores?.duracionDias ?? null, [Validators.required, entero,
        Validators.min(LIMITES_FORMULA.duracionMinima), Validators.max(LIMITES_FORMULA.duracionMaxima)]],
      viaAdministracion: [valores?.viaAdministracion ?? 'ORAL', Validators.required],
      cantidadPrescrita: [valores?.cantidadPrescrita ?? null, [Validators.required, entero,
        Validators.min(1), Validators.max(LIMITES_FORMULA.cantidadMaxima)]],
      indicaciones: [valores?.indicaciones ?? '', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)]]
    });
  }

  /** Agrega un medicamento vacío a la fórmula. */
  agregarLinea(): void {
    if (this.lineas.length >= LIMITES_FORMULA.maximoLineas) {
      avisar('Límite alcanzado', `Una fórmula admite máximo ${LIMITES_FORMULA.maximoLineas} medicamentos.`, 'warning');
      return;
    }
    this.lineas.push(this.crearLinea());
  }

  /** Quita un medicamento de la fórmula. */
  quitarLinea(indice: number): void {
    this.lineas.removeAt(indice);
  }

  /** Medicamento elegido en una línea. */
  medicamentoDe(indice: number): MedicamentoOpcion | null {
    const id = this.lineas.at(indice)?.get('medicamentoId')?.value as number | null;
    return this.medicamentos.find((m) => m.id === id) ?? null;
  }

  /** Indica si el medicamento ya fue elegido en otra línea. */
  medicamentoUsado(medicamentoId: number, indice: number): boolean {
    return this.lineas.controls.some((c, i) => i !== indice && c.get('medicamentoId')?.value === medicamentoId);
  }

  /**
   * Cantidad sugerida para unidades contables (tableta, cápsula, aplicación):
   * dosis × tomas por día × días. Null si no se puede calcular.
   */
  cantidadSugerida(indice: number): number | null {
    const v = this.lineas.at(indice)?.getRawValue();
    if (!v || !UNIDADES_CONTABLES.includes(v.unidadDosis)) {
      return null;
    }
    const dosis = Number(v.dosis);
    const frecuencia = Number(v.frecuenciaHoras);
    const dias = Number(v.duracionDias);
    if (!(dosis > 0) || !(frecuencia >= 1) || !(dias >= 1)) {
      return null;
    }
    const total = Math.ceil(dosis * Math.ceil(24 / frecuencia) * dias);
    return total <= LIMITES_FORMULA.cantidadMaxima ? total : null;
  }

  /** Pone la cantidad sugerida en la línea. */
  usarSugerida(indice: number): void {
    const sugerida = this.cantidadSugerida(indice);
    if (sugerida !== null) {
      const control = this.lineas.at(indice).get('cantidadPrescrita')!;
      control.setValue(sugerida);
      control.markAsTouched();
    }
  }

  /** Indica si la cantidad pedida supera las existencias vigentes (solo advertencia). */
  superaDisponible(indice: number): boolean {
    const med = this.medicamentoDe(indice);
    const cantidad = Number(this.lineas.at(indice)?.get('cantidadPrescrita')?.value);
    return !!med && med.cantidadDisponible !== undefined && cantidad > med.cantidadDisponible;
  }

  /** Indica si un control de una línea es inválido y ya se tocó. */
  invalidoLinea(indice: number, campo: string): boolean {
    const control = this.lineas.at(indice)?.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  /** Carga clientes, veterinarios y medicamentos. */
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

  /** Al cambiar el cliente consulta sus mascotas. */
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

  /** Al cambiar la mascota consulta sus consultas abiertas. */
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
        this.historias = pagina.content.filter((h) => h.estado !== 'CERRADA');
        this.cargandoHistorias = false;
        if (this.historias.length > 0) {
          this.f['historiaId'].enable({ emitEvent: false });
        }
        const historiaId = this.preseleccion?.historiaId;
        if (historiaId && this.historias.some((h) => h.historiaId === historiaId)) {
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

  /** Al elegir la consulta ajusta la fecha de emisión si quedó antes de ella. */
  private alCambiarHistoria(historiaId: number | null): void {
    const historia = this.historias.find((h) => h.historiaId === historiaId);
    if (historia) {
      const emision = this.f['fechaEmision'].value as string;
      if (!emision || emision < historia.fecha) {
        this.f['fechaEmision'].setValue(historia.fecha);
      }
    }
    this.form.updateValueAndValidity();
  }

  /** Borra y deshabilita un combo dependiente sin disparar sus eventos. */
  private limpiarControl(nombre: string): void {
    this.f[nombre].reset(null, { emitEvent: false });
    this.f[nombre].disable({ emitEvent: false });
  }

  /** Deja el formulario como "fórmula nueva" con un medicamento vacío. */
  private reiniciarFormulario(): void {
    this.modoFormulario = 'C';
    this.formulaEditando = null;
    this.lineas.clear({ emitEvent: false });
    this.form.reset(
      { clienteId: null, mascotaId: null, historiaId: null, fechaEmision: hoyIso(), observaciones: '' },
      { emitEvent: false }
    );
    this.lineas.push(this.crearLinea(), { emitEvent: false });
    this.f['clienteId'].enable({ emitEvent: false });
    this.limpiarControl('mascotaId');
    this.limpiarControl('historiaId');
    this.mascotas = [];
    this.historias = [];
  }

  /** Abre el formulario para una fórmula nueva. */
  abrirNueva(): void {
    if (!this.medicoSesionId) {
      avisar('Usuario sin médico asociado',
        'Su usuario no está enlazado a un médico veterinario. Solicite al administrador que lo asocie.', 'warning');
      return;
    }
    this.preseleccion = null;
    this.reiniciarFormulario();
    this.abrirModal('modalFormula', 'formulario');
  }

  /** Si la pantalla se abrió desde una historia, abre el formulario con esos datos. */
  private abrirDesdeUrl(): void {
    const params = this.route.snapshot.queryParamMap;
    const clienteId = Number(params.get('clienteId'));
    if (!clienteId || !this.puedeRegistrar) {
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
   * Abre un borrador propio para editarlo. Se consulta el detalle completo
   * para tener todos los medicamentos.
   */
  abrirEdicion(formula: Formula): void {
    if (!this.esBorradorPropio(formula)) {
      avisar('No se puede modificar', 'Solo el veterinario que la registró puede modificar una fórmula en borrador.');
      return;
    }
    this.cargandoEdicion = formula.formulaId;
    this.formulaService.consultar(formula.formulaId).subscribe({
      next: (data) => {
        this.cargandoEdicion = null;
        this.modoFormulario = 'E';
        this.formulaEditando = data;
        this.mascotas = [];
        this.historias = [];
        // Primero se reinicia el encabezado: reset() también limpiaría las líneas ya cargadas.
        this.lineas.clear({ emitEvent: false });
        this.form.reset(
          {
            clienteId: data.clienteId, mascotaId: data.mascotaId, historiaId: data.historiaId,
            fechaEmision: data.fechaEmision, observaciones: data.observaciones ?? ''
          },
          { emitEvent: false }
        );
        (data.detalles ?? []).forEach((d) => this.lineas.push(this.crearLinea(d), { emitEvent: false }));
        ['clienteId', 'mascotaId', 'historiaId'].forEach((c) => this.f[c].disable({ emitEvent: false }));
        this.form.updateValueAndValidity();
        this.abrirModal('modalFormula', 'formulario');
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoEdicion = null;
        mostrarError(error, 'No se pudo consultar la fórmula');
      }
    });
  }

  /**
   * Guarda la fórmula.
   *
   * @param confirmarFormula true para confirmarla y enviarla a despacho.
   */
  async guardar(confirmarFormula: boolean): Promise<void> {
    if (this.guardando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.lineas.length === 0) {
        avisar('Fórmula sin medicamentos', 'Agregue al menos un medicamento.', 'warning');
      } else if (this.lineas.errors?.['repetidos']) {
        avisar('Medicamento repetido', 'Un medicamento no puede repetirse en la misma fórmula.', 'warning');
      }
      return;
    }
    if (confirmarFormula) {
      const sinExistencias = this.lineas.controls
        .map((_, i) => i)
        .filter((i) => this.superaDisponible(i))
        .map((i) => this.medicamentoDe(i)?.nombre);
      const aviso = sinExistencias.length
        ? ` Atención: no hay existencias suficientes de ${sinExistencias.join(', ')}; despacho podrá entregar parcialmente.`
        : '';
      const ok = await confirmar('¿Confirmar la fórmula?',
        'Una vez confirmada pasa a despacho y ya no se podrá modificar.' + aviso, 'Sí, confirmar');
      if (!ok) {
        return;
      }
    }

    const valores = this.form.getRawValue();
    const formulaRq: FormulaRq = {
      fechaEmision: valores.fechaEmision,
      observaciones: String(valores.observaciones ?? '').trim(),
      confirmar: confirmarFormula,
      detalles: (valores.detalles as FormulaDetalleRq[]).map((d) => ({
        medicamentoId: Number(d.medicamentoId),
        dosis: Number(d.dosis),
        unidadDosis: d.unidadDosis,
        frecuenciaHoras: Number(d.frecuenciaHoras),
        duracionDias: Number(d.duracionDias),
        cantidadPrescrita: Number(d.cantidadPrescrita),
        viaAdministracion: d.viaAdministracion,
        indicaciones: String(d.indicaciones).trim()
      }))
    };
    if (this.modoFormulario === 'C') {
      formulaRq.mascotaId = Number(valores.mascotaId);
      formulaRq.historiaId = Number(valores.historiaId);
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

  /** Indica si un campo del encabezado es inválido y ya se tocó. */
  invalido(campo: string): boolean {
    const control = this.f[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  /** Indica si hay que mostrar el aviso de fecha de emisión anterior a la consulta. */
  get emisionAnterior(): boolean {
    return !!this.form.errors?.['emisionAnterior'] && (this.f['fechaEmision'].touched || this.f['fechaEmision'].dirty
      || !!this.historiaSeleccionada);
  }

  // ===================== Acciones =====================

  /** Confirma un borrador desde el listado. */
  async confirmarBorrador(formula: Formula): Promise<void> {
    const ok = await confirmar('¿Confirmar la fórmula?',
      'Una vez confirmada pasa a despacho y ya no se podrá modificar.', 'Sí, confirmar');
    if (!ok) {
      return;
    }
    this.formulaService.confirmar(formula.formulaId).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.listar();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo confirmar la fórmula')
    });
  }

  /** Anula una fórmula pidiendo el motivo. */
  async anular(formula: Formula): Promise<void> {
    const motivo = await pedirMotivo(`¿Anular la fórmula N.° ${formula.formulaId}?`,
      'La fórmula se conserva como registro, pero ya no se podrá despachar.', 'Sí, anular');
    if (motivo === null) {
      return;
    }
    this.formulaService.anular(formula.formulaId, motivo).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.modalDetalle?.hide();
        this.listar();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo anular la fórmula')
    });
  }

  /** Descarga la fórmula en PDF. */
  descargarPdf(formula: Formula): void {
    this.descargando = formula.formulaId;
    this.formulaService.descargarPdf(formula.formulaId).subscribe({
      next: (archivo) => {
        this.descargando = null;
        descargarArchivo(archivo, `formula-${formula.formulaId}.pdf`);
      },
      error: (error: HttpErrorResponse) => {
        this.descargando = null;
        mostrarError(error, 'No se pudo generar el PDF');
      }
    });
  }

  /** Abre el detalle completo de la fórmula. */
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

  // ===================== Utilidades =====================

  /** Clase de Bootstrap para el estado de la fórmula. */
  claseEstado(estado: EstadoFormula): string {
    switch (estado) {
      case 'CONFIRMADA':
        return 'bg-success';
      case 'ANULADA':
        return 'bg-secondary';
      default:
        return 'bg-warning text-dark';
    }
  }

  /** Texto legible de un estado del historial (de la fórmula o del despacho). */
  textoEstado(estado: string | null): string {
    if (!estado) {
      return '—';
    }
    return ESTADOS_FORMULA.includes(estado as EstadoFormula) ? estado : textoEstadoDespacho(estado);
  }

  /** Texto legible de una vía de administración. */
  textoVia(via: string): string {
    return VIAS_ADMINISTRACION.find((v) => v.valor === via)?.texto ?? via;
  }

  /** Abre uno de los modales. */
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
