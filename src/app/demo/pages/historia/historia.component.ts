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
  Validators
} from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Modal } from 'bootstrap';

import { HistoriaService } from './service/historia.service';
import { CatalogoService } from 'src/app/services/catalogo.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { ClienteOpcion, MascotaOpcion, MedicoOpcion } from 'src/app/models/catalogo';
import {
  Anotacion,
  AnotacionRq,
  CitaDisponible,
  ESTADOS_HISTORIA,
  EstadoHistoria,
  FiltroHistorias,
  HistoriaClinica,
  HistoriaRq
} from 'src/app/models/historia';
import { OrdenTabla } from 'src/app/utils/orden-tabla';
import { horaCorta } from 'src/app/utils/fechas';
import { avisar, confirmar, mostrarError, notificarExito } from 'src/app/utils/mensajes';

/** Cliente, mascota y cita que llegan por la URL para abrir el formulario ya diligenciado. */
interface Preseleccion {
  /** Mascota a seleccionar cuando carguen las mascotas del cliente. */
  mascotaId: number | null;
  /** Cita a seleccionar cuando carguen las citas de la mascota. */
  citaId: number | null;
}

/**
 * Pantalla de historias clínicas: listado paginado con filtros y orden
 * (resueltos en el backend), registro de nuevas historias a partir de una
 * cita atendida y detalle con el histórico de anotaciones de la mascota.
 *
 * Las reglas críticas (cliente, mascota y cita coherentes; cita atendida y
 * sin historia previa) las valida el backend; aquí se guía al usuario para
 * que no pueda elegir combinaciones inválidas.
 */
@Component({
  selector: 'app-historia',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './historia.component.html'
})
export class HistoriaComponent implements OnInit, OnDestroy {
  /** Estados disponibles para el filtro. */
  readonly estados: EstadoHistoria[] = ESTADOS_HISTORIA;
  /** Recorta la hora a HH:mm en la plantilla. */
  readonly horaCorta = horaCorta;

  // ----- Listado -----

  /** Historias de la página actual. */
  historias: HistoriaClinica[] = [];
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
  /** Orden del listado (por defecto fecha y hora de la consulta, descendente). */
  readonly orden = new OrdenTabla('fecha', 'desc');

  // ----- Filtros -----

  /** Texto de búsqueda libre. */
  terminoBusqueda = '';
  /** Estado seleccionado (vacío = todos). */
  filtroEstado = '';
  /** Veterinario seleccionado. */
  filtroMedico: number | null = null;
  /** Fecha inicial del rango (yyyy-MM-dd). */
  filtroDesde = '';
  /** Fecha final del rango (yyyy-MM-dd). */
  filtroHasta = '';

  // ----- Catálogos -----

  /** Clientes disponibles. */
  clientes: ClienteOpcion[] = [];
  /** Veterinarios disponibles. */
  medicos: MedicoOpcion[] = [];
  /** Mascotas del cliente elegido en el formulario. */
  mascotas: MascotaOpcion[] = [];
  /** Citas atendidas sin historia de la mascota elegida. */
  citasDisponibles: CitaDisponible[] = [];
  /** Indica que se están cargando las mascotas. */
  cargandoMascotas = false;
  /** Indica que se están cargando las citas disponibles. */
  cargandoCitas = false;

  // ----- Formulario de historia -----

  /** Formulario reactivo de la historia clínica. */
  form!: FormGroup;
  /** Indica que se está enviando el formulario. */
  guardando = false;

  // ----- Detalle y anotaciones -----

  /** Historia mostrada en el modal de detalle. */
  historiaDetalle: HistoriaClinica | null = null;
  /** Indica que se está consultando el detalle. */
  cargandoDetalle = false;
  /** Anotaciones de la página actual. */
  anotaciones: Anotacion[] = [];
  /** Indica que se están consultando las anotaciones. */
  cargandoAnotaciones = false;
  /** Indica que la última consulta de anotaciones falló. */
  errorAnotaciones = false;
  /** Página actual de anotaciones. */
  paginaAnotaciones = 0;
  /** Anotaciones por página. */
  anotacionesPorPagina = 5;
  /** Total de anotaciones que cumplen el filtro. */
  totalAnotaciones = 0;
  /** Total de páginas de anotaciones. */
  totalPaginasAnotaciones = 0;
  /** Orden de las anotaciones (por defecto la más reciente primero). */
  readonly ordenAnotaciones = new OrdenTabla('fecha', 'desc');
  /** Texto de búsqueda dentro de las anotaciones. */
  busquedaAnotaciones = '';
  /** Anotación cuyo detalle se está mostrando. */
  anotacionDetalle: Anotacion | null = null;
  /** Indica que se está consultando el detalle de una anotación. */
  cargandoAnotacion = false;
  /** Muestra u oculta el formulario de nueva anotación. */
  mostrarFormAnotacion = false;
  /** Formulario reactivo de la anotación. */
  formAnotacion!: FormGroup;
  /** Indica que se está enviando la anotación. */
  guardandoAnotacion = false;

  /** Instancia del modal del formulario. */
  private modalFormulario: Modal | null = null;
  /** Instancia del modal de detalle. */
  private modalDetalle: Modal | null = null;
  /** Emite el texto de búsqueda del listado para esperar a que el usuario deje de escribir. */
  private readonly busqueda$ = new Subject<string>();
  /** Emite el texto de búsqueda de anotaciones. */
  private readonly busquedaAnotaciones$ = new Subject<string>();
  /** Suscripciones permanentes que se cierran al destruir el componente. */
  private readonly suscripciones = new Subscription();
  /** Consulta en curso del listado (se cancela si llega otra). */
  private suscripcionLista: Subscription | null = null;
  /** Consulta en curso de anotaciones. */
  private suscripcionAnotaciones: Subscription | null = null;
  /** Consulta en curso de mascotas. */
  private suscripcionMascotas: Subscription | null = null;
  /** Consulta en curso de citas disponibles. */
  private suscripcionCitas: Subscription | null = null;
  /** Selección que llegó por la URL y falta aplicar. */
  private preseleccion: Preseleccion | null = null;

  /**
   * @param historiaService servicio de historias clínicas y anotaciones.
   * @param catalogoService servicio de clientes, mascotas y veterinarios.
   * @param formBuilder constructor de formularios reactivos.
   * @param route ruta activa, para leer la cita que llega desde el módulo de citas.
   * @param router enrutador, para ir al módulo de fórmulas.
   */
  constructor(
    private readonly historiaService: HistoriaService,
    private readonly catalogoService: CatalogoService,
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) { }

  /** Inicializa formularios, catálogos, búsquedas con espera, primer listado y la cita recibida por URL. */
  ngOnInit(): void {
    this.inicializarFormularios();
    this.cargarCatalogos();

    this.suscripciones.add(
      this.busqueda$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((texto) => {
        this.terminoBusqueda = texto;
        this.paginaActual = 0;
        this.listar();
      })
    );
    this.suscripciones.add(
      this.busquedaAnotaciones$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((texto) => {
        this.busquedaAnotaciones = texto;
        this.paginaAnotaciones = 0;
        this.listarAnotaciones();
      })
    );

    this.listar();
    this.abrirDesdeUrl();
  }

  /** Cierra suscripciones y modales al salir de la pantalla. */
  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
    this.suscripcionLista?.unsubscribe();
    this.suscripcionAnotaciones?.unsubscribe();
    this.suscripcionMascotas?.unsubscribe();
    this.suscripcionCitas?.unsubscribe();
    this.modalFormulario?.dispose();
    this.modalDetalle?.dispose();
  }

  /** Acceso corto a los controles del formulario de historia. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Acceso corto a los controles del formulario de anotación. */
  get fa(): { [key: string]: AbstractControl } {
    return this.formAnotacion.controls;
  }

  /** Indica si hay algún filtro activo. */
  get hayFiltros(): boolean {
    return !!(
      this.terminoBusqueda.trim() ||
      this.filtroEstado ||
      this.filtroMedico !== null ||
      this.filtroDesde ||
      this.filtroHasta
    );
  }

  /** Cita elegida en el formulario (para mostrar su fecha y hora). */
  get citaSeleccionada(): CitaDisponible | null {
    const citaId = this.f['citaId'].value as number | null;
    return this.citasDisponibles.find((c) => c.citaId === citaId) ?? null;
  }

  /** Indica si la historia del detalle admite nuevas anotaciones. */
  get historiaAbierta(): boolean {
    return !!this.historiaDetalle && this.historiaDetalle.estado !== 'CERRADA';
  }

  // ===================== Listado =====================

  /** Consulta al backend la página actual con el orden y los filtros vigentes. */
  listar(): void {
    this.suscripcionLista?.unsubscribe();
    this.cargandoLista = true;
    this.errorLista = false;

    const filtro: FiltroHistorias = {
      page: this.paginaActual,
      size: this.registrosPorPagina,
      orden: this.orden.columna,
      direccion: this.orden.direccion,
      texto: this.terminoBusqueda,
      estado: this.filtroEstado,
      medicoId: this.filtroMedico,
      desde: this.filtroDesde,
      hasta: this.filtroHasta
    };

    this.suscripcionLista = this.historiaService.listar(filtro).subscribe({
      next: (pagina) => {
        this.historias = pagina.content;
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
        this.historias = [];
        mostrarError(error, 'No se pudieron cargar las historias clínicas');
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

  /** Aplica los filtros de estado, veterinario y fechas, y vuelve a la primera página. */
  aplicarFiltros(): void {
    if (this.filtroDesde && this.filtroHasta && this.filtroDesde > this.filtroHasta) {
      avisar('Rango de fechas inválido', 'La fecha inicial no puede ser posterior a la fecha final.', 'warning');
      return;
    }
    this.paginaActual = 0;
    this.listar();
  }

  /** Quita los filtros y deja el orden inicial (fecha descendente). */
  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroMedico = null;
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.orden.reiniciar();
    this.paginaActual = 0;
    this.listar();
  }

  /**
   * Ordena el listado por una columna.
   *
   * @param columna fecha, cliente, mascota, medico o estado.
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

  // ===================== Formulario de historia =====================

  /** Crea los formularios reactivos con sus validaciones y los combos dependientes. */
  private inicializarFormularios(): void {
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [{ value: null, disabled: true }, Validators.required],
      citaId: [{ value: null, disabled: true }, Validators.required],
      medicoId: [null, Validators.required],
      motivo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]],
      diagnostico: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)]],
      observaciones: ['', Validators.maxLength(1000)]
    });

    this.formAnotacion = this.formBuilder.group({
      medicoId: [null, Validators.required],
      descripcion: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)]],
      observacion: ['', Validators.maxLength(1000)],
      diagnostico: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)]]
    });

    // Combos dependientes: cliente → mascotas del cliente → citas atendidas de la mascota.
    this.suscripciones.add(
      this.f['clienteId'].valueChanges.subscribe((id: number | null) => this.alCambiarCliente(id))
    );
    this.suscripciones.add(
      this.f['mascotaId'].valueChanges.subscribe((id: number | null) => this.alCambiarMascota(id))
    );
    this.suscripciones.add(
      this.f['citaId'].valueChanges.subscribe((id: number | null) => this.alCambiarCita(id))
    );
  }

  /** Carga los clientes y veterinarios que llenan los combos y el filtro. */
  private cargarCatalogos(): void {
    this.catalogoService.listarClientes().subscribe({
      next: (data) => (this.clientes = data),
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cargar la lista de clientes')
    });
    this.catalogoService.listarMedicos().subscribe({
      next: (data) => (this.medicos = data),
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cargar la lista de veterinarios')
    });
  }

  /**
   * Al cambiar el cliente limpia mascota y cita, y consulta solo las mascotas del cliente.
   *
   * @param clienteId cliente elegido (null si se borró la selección).
   */
  private alCambiarCliente(clienteId: number | null): void {
    this.suscripcionMascotas?.unsubscribe();
    this.limpiarControl('mascotaId');
    this.mascotas = [];
    this.alCambiarMascota(null);
    if (clienteId === null) {
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
   * Al cambiar la mascota limpia la cita y consulta sus citas atendidas sin historia.
   *
   * @param mascotaId mascota elegida (null si se borró la selección).
   */
  private alCambiarMascota(mascotaId: number | null): void {
    this.suscripcionCitas?.unsubscribe();
    this.limpiarControl('citaId');
    this.citasDisponibles = [];
    if (mascotaId === null) {
      return;
    }

    this.cargandoCitas = true;
    this.suscripcionCitas = this.historiaService.listarCitasDisponibles(mascotaId).subscribe({
      next: (data) => {
        this.citasDisponibles = data;
        this.cargandoCitas = false;
        if (data.length > 0) {
          this.f['citaId'].enable({ emitEvent: false });
        }
        const citaId = this.preseleccion?.citaId;
        if (citaId && data.some((c) => c.citaId === citaId)) {
          this.f['citaId'].setValue(citaId);
        }
        this.preseleccion = null;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoCitas = false;
        this.preseleccion = null;
        mostrarError(error, 'No se pudieron cargar las citas de la mascota');
      }
    });
  }

  /**
   * Al elegir la cita propone su veterinario y su motivo, que el usuario puede ajustar.
   *
   * @param citaId cita elegida.
   */
  private alCambiarCita(citaId: number | null): void {
    const cita = this.citasDisponibles.find((c) => c.citaId === citaId);
    if (!cita) {
      return;
    }
    this.f['medicoId'].setValue(cita.medicoId);
    if (!String(this.f['motivo'].value ?? '').trim()) {
      this.f['motivo'].setValue(cita.motivo);
    }
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

  /** Abre el formulario vacío para registrar una historia clínica. */
  abrirNueva(): void {
    this.preseleccion = null;
    this.reiniciarFormulario();
    this.abrirModal('modalHistoria', 'formulario');
  }

  /** Deja el formulario de historia en su estado inicial. */
  private reiniciarFormulario(): void {
    this.form.reset(
      { clienteId: null, mascotaId: null, citaId: null, medicoId: null, motivo: '', diagnostico: '', observaciones: '' },
      { emitEvent: false }
    );
    this.limpiarControl('mascotaId');
    this.limpiarControl('citaId');
    this.mascotas = [];
    this.citasDisponibles = [];
  }

  /**
   * Si la pantalla se abrió desde una cita atendida (?clienteId=&mascotaId=&citaId=),
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
      citaId: Number(params.get('citaId')) || null
    };
    this.f['clienteId'].setValue(clienteId);
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    // Espera a que la vista exista para poder abrir el modal.
    setTimeout(() => this.abrirModal('modalHistoria', 'formulario'));
  }

  /** Envía el formulario y registra la historia clínica. */
  guardar(): void {
    if (this.guardando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const historiaRq: HistoriaRq = {
      clienteId: Number(valores.clienteId),
      mascotaId: Number(valores.mascotaId),
      citaId: Number(valores.citaId),
      medicoId: Number(valores.medicoId),
      motivo: String(valores.motivo).trim(),
      diagnostico: String(valores.diagnostico).trim(),
      observaciones: String(valores.observaciones ?? '').trim()
    };

    this.guardando = true;
    this.historiaService.guardar(historiaRq).subscribe({
      next: (respuesta) => {
        this.guardando = false;
        notificarExito(respuesta.message);
        this.modalFormulario?.hide();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error, 'No se pudo registrar la historia clínica');
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
   * @param formulario formulario al que pertenece el campo.
   * @param campo nombre del control.
   * @returns true si es inválido y el usuario ya interactuó con él.
   */
  invalido(formulario: FormGroup, campo: string): boolean {
    const control = formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  // ===================== Detalle y anotaciones =====================

  /**
   * Abre el modal con el detalle de la historia y su histórico de anotaciones.
   *
   * @param historia fila seleccionada.
   */
  verDetalle(historia: HistoriaClinica): void {
    this.historiaDetalle = null;
    this.anotaciones = [];
    this.anotacionDetalle = null;
    this.mostrarFormAnotacion = false;
    this.busquedaAnotaciones = '';
    this.paginaAnotaciones = 0;
    this.ordenAnotaciones.reiniciar();
    this.cargandoDetalle = true;
    this.abrirModal('modalDetalleHistoria', 'detalle');

    this.historiaService.consultar(historia.historiaId).subscribe({
      next: (data) => {
        this.historiaDetalle = data;
        this.cargandoDetalle = false;
        this.listarAnotaciones();
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoDetalle = false;
        this.modalDetalle?.hide();
        mostrarError(error, 'No se pudo consultar la historia clínica');
      }
    });
  }

  /** Consulta la página actual de anotaciones de la historia abierta. */
  listarAnotaciones(): void {
    if (!this.historiaDetalle) {
      return;
    }
    this.suscripcionAnotaciones?.unsubscribe();
    this.cargandoAnotaciones = true;
    this.errorAnotaciones = false;

    this.suscripcionAnotaciones = this.historiaService.listarAnotaciones({
      historiaId: this.historiaDetalle.historiaId,
      page: this.paginaAnotaciones,
      size: this.anotacionesPorPagina,
      orden: this.ordenAnotaciones.columna,
      direccion: this.ordenAnotaciones.direccion,
      texto: this.busquedaAnotaciones
    }).subscribe({
      next: (pagina) => {
        this.anotaciones = pagina.content;
        this.totalAnotaciones = pagina.totalElements;
        this.totalPaginasAnotaciones = pagina.totalPages;
        this.paginaAnotaciones = pagina.page;
        this.cargandoAnotaciones = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoAnotaciones = false;
        this.errorAnotaciones = true;
        this.anotaciones = [];
        mostrarError(error, 'No se pudieron cargar las anotaciones');
      }
    });
  }

  /**
   * Recibe el texto del buscador de anotaciones y lo envía con espera.
   *
   * @param texto texto actual del buscador.
   */
  alBuscarAnotaciones(texto: string): void {
    this.busquedaAnotaciones$.next(texto ?? '');
  }

  /**
   * Ordena las anotaciones por una columna.
   *
   * @param columna fecha o medico.
   */
  ordenarAnotaciones(columna: string): void {
    this.ordenAnotaciones.alternar(columna);
    this.paginaAnotaciones = 0;
    this.listarAnotaciones();
  }

  /**
   * Cambia de página en las anotaciones.
   *
   * @param pagina número de página (empieza en 0).
   */
  irAPaginaAnotaciones(pagina: number): void {
    this.paginaAnotaciones = pagina;
    this.listarAnotaciones();
  }

  /**
   * Cambia la cantidad de anotaciones por página.
   *
   * @param tamano nueva cantidad.
   */
  cambiarTamanoAnotaciones(tamano: number): void {
    this.anotacionesPorPagina = tamano;
    this.paginaAnotaciones = 0;
    this.listarAnotaciones();
  }

  /**
   * Muestra el detalle completo de una anotación, consultado al backend.
   *
   * @param anotacion fila seleccionada.
   */
  verAnotacion(anotacion: Anotacion): void {
    this.cargandoAnotacion = true;
    this.mostrarFormAnotacion = false;
    this.historiaService.consultarAnotacion(anotacion.anotacionId).subscribe({
      next: (data) => {
        this.anotacionDetalle = data;
        this.cargandoAnotacion = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoAnotacion = false;
        mostrarError(error, 'No se pudo consultar la anotación');
      }
    });
  }

  /** Vuelve del detalle de una anotación al listado de anotaciones. */
  cerrarAnotacion(): void {
    this.anotacionDetalle = null;
  }

  /** Muestra el formulario de nueva anotación con el veterinario de la historia propuesto. */
  abrirFormAnotacion(): void {
    this.anotacionDetalle = null;
    this.formAnotacion.reset({
      medicoId: this.historiaDetalle?.medicoId ?? null,
      descripcion: '',
      observacion: '',
      diagnostico: ''
    });
    this.mostrarFormAnotacion = true;
  }

  /** Oculta el formulario de nueva anotación sin guardar. */
  cancelarAnotacion(): void {
    this.mostrarFormAnotacion = false;
  }

  /** Registra la anotación en la historia abierta y recarga el histórico. */
  guardarAnotacion(): void {
    if (this.guardandoAnotacion || !this.historiaDetalle) {
      return;
    }
    if (this.formAnotacion.invalid) {
      this.formAnotacion.markAllAsTouched();
      return;
    }

    const valores = this.formAnotacion.getRawValue();
    const anotacionRq: AnotacionRq = {
      historiaId: this.historiaDetalle.historiaId,
      medicoId: Number(valores.medicoId),
      descripcion: String(valores.descripcion).trim(),
      observacion: String(valores.observacion ?? '').trim(),
      diagnostico: String(valores.diagnostico).trim()
    };

    this.guardandoAnotacion = true;
    this.historiaService.guardarAnotacion(anotacionRq).subscribe({
      next: (respuesta) => {
        this.guardandoAnotacion = false;
        notificarExito(respuesta.message);
        this.mostrarFormAnotacion = false;
        // La nueva anotación es la más reciente: se vuelve al orden y página iniciales.
        this.ordenAnotaciones.reiniciar();
        this.paginaAnotaciones = 0;
        this.listarAnotaciones();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoAnotacion = false;
        mostrarError(error, 'No se pudo registrar la anotación');
      }
    });
  }

  /** Cierra la historia abierta en el detalle, tras confirmar con el usuario. */
  async cerrarHistoria(): Promise<void> {
    const historia = this.historiaDetalle;
    if (!historia) {
      return;
    }
    const confirmado = await confirmar(
      '¿Cerrar la historia clínica?',
      'Ya no se podrán agregar anotaciones ni fórmulas. La información se conserva para consulta.',
      'Sí, cerrar'
    );
    if (!confirmado) {
      return;
    }
    this.historiaService.cerrar(historia.historiaId).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.historiaDetalle = { ...historia, estado: 'CERRADA' };
        this.mostrarFormAnotacion = false;
        this.listar();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cerrar la historia clínica')
    });
  }

  /** Va al módulo de fórmulas con la historia abierta ya seleccionada. */
  nuevaFormula(): void {
    const historia = this.historiaDetalle;
    const elemento = document.getElementById('modalDetalleHistoria');
    if (!historia || !elemento) {
      return;
    }
    // Se navega cuando el modal terminó de cerrarse, para no dejar el fondo oscuro.
    elemento.addEventListener('hidden.bs.modal', () => {
      this.router.navigate(['/inicio/formulas'], {
        queryParams: { clienteId: historia.clienteId, mascotaId: historia.mascotaId, historiaId: historia.historiaId }
      });
    }, { once: true });
    this.modalDetalle?.hide();
  }

  // ===================== Utilidades =====================

  /**
   * Clase de Bootstrap para la etiqueta de cada estado.
   *
   * @param estado estado de la historia.
   * @returns clases CSS de la etiqueta.
   */
  claseEstado(estado: EstadoHistoria | null | undefined): string {
    return estado === 'CERRADA' ? 'bg-secondary' : 'bg-success';
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
