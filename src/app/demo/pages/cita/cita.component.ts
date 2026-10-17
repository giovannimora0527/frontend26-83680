import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
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

import { CitaService } from './service/cita.service';
import { CatalogoService } from 'src/app/services/catalogo.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { ClienteOpcion, MascotaOpcion, MedicoOpcion } from 'src/app/models/catalogo';
import {
  Cita,
  CitaRq,
  ESTADOS_CITA,
  EstadoCita,
  FiltroCitas,
  TRANSICIONES_CITA
} from 'src/app/models/cita';
import { OrdenTabla } from 'src/app/utils/orden-tabla';
import { horaCorta, hoyIso } from 'src/app/utils/fechas';
import { avisar, confirmar, mostrarError, notificarExito } from 'src/app/utils/mensajes';

/**
 * Pantalla de gestión de citas médicas: listado paginado con filtros y orden
 * (todo resuelto en el backend), detalle, creación y edición.
 *
 * Las reglas críticas (horarios, estados, existencia de cliente/mascota/médico)
 * las valida el backend; aquí solo se validan los datos para guiar al usuario.
 */
@Component({
  selector: 'app-cita',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './cita.component.html'
})
export class CitaComponent implements OnInit, OnDestroy {
  /** Todos los estados, para el filtro del listado. */
  readonly estados: EstadoCita[] = ESTADOS_CITA;
  /** Recorta la hora a HH:mm en la plantilla. */
  readonly horaCorta = horaCorta;

  // ----- Listado -----

  /** Citas de la página actual. */
  citas: Cita[] = [];
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
  /** Orden del listado (por defecto fecha y hora, descendente). */
  readonly orden = new OrdenTabla('fecha', 'desc');

  // ----- Filtros -----

  /** Texto de búsqueda libre. */
  terminoBusqueda = '';
  /** Estado seleccionado en el filtro (vacío = todos). */
  filtroEstado = '';
  /** Veterinario seleccionado en el filtro. */
  filtroMedico: number | null = null;
  /** Fecha inicial del filtro (yyyy-MM-dd). */
  filtroDesde = '';
  /** Fecha final del filtro (yyyy-MM-dd). */
  filtroHasta = '';

  // ----- Catálogos de los combos -----

  /** Clientes disponibles. */
  clientes: ClienteOpcion[] = [];
  /** Veterinarios disponibles. */
  medicos: MedicoOpcion[] = [];
  /** Mascotas del cliente seleccionado en el formulario. */
  mascotas: MascotaOpcion[] = [];
  /** Indica que se están cargando las mascotas del cliente. */
  cargandoMascotas = false;

  // ----- Formulario (crear / editar) -----

  /** Formulario reactivo de la cita. */
  form!: FormGroup;
  /** Modo del formulario: C (crear) o E (editar). */
  modoFormulario: 'C' | 'E' = 'C';
  /** Cita que se está editando (null al crear). */
  citaEditando: Cita | null = null;
  /** Estados que el formulario ofrece según la cita. */
  estadosFormulario: EstadoCita[] = [];
  /** Indica que se está enviando el formulario. */
  guardando = false;
  /** Fecha mínima permitida (hoy), formato yyyy-MM-dd. */
  minFecha = '';

  // ----- Detalle -----

  /** Cita mostrada en el modal de detalle. */
  citaDetalle: Cita | null = null;
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
  /** Consulta en curso del listado (se cancela si llega otra). */
  private suscripcionLista: Subscription | null = null;
  /** Consulta en curso de mascotas (se cancela si cambia el cliente). */
  private suscripcionMascotas: Subscription | null = null;

  /**
   * Valida que la fecha y la hora no sean anteriores al momento actual.
   * Al editar, solo aplica si el usuario cambió la fecha o la hora.
   */
  private readonly validarFechaHora = (grupo: AbstractControl): ValidationErrors | null => {
    const fecha = grupo.get('fecha')?.value as string;
    const hora = grupo.get('hora')?.value as string;
    if (!fecha || !hora) {
      return null;
    }
    if (
      this.modoFormulario === 'E' &&
      this.citaEditando &&
      fecha === this.citaEditando.fecha &&
      hora === horaCorta(this.citaEditando.hora)
    ) {
      return null;
    }
    const seleccion = new Date(`${fecha}T${hora}`);
    return seleccion.getTime() < Date.now() ? { fechaPasada: true } : null;
  };

  /**
   * @param citaService servicio que consume la API de citas.
   * @param catalogoService servicio de clientes, mascotas y veterinarios.
   * @param formBuilder constructor de formularios reactivos.
   * @param router enrutador, para generar la historia clínica de una cita atendida.
   */
  constructor(
    private readonly citaService: CitaService,
    private readonly catalogoService: CatalogoService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router
  ) { }

  /** Inicializa formulario, catálogos, búsqueda con espera y primer listado. */
  ngOnInit(): void {
    this.minFecha = hoyIso();
    this.inicializarFormulario();
    this.cargarCatalogos();

    this.suscripciones.add(
      this.busqueda$
        .pipe(debounceTime(350), distinctUntilChanged())
        .subscribe((texto) => {
          this.terminoBusqueda = texto;
          this.paginaActual = 0;
          this.listar();
        })
    );

    this.listar();
  }

  /** Cierra suscripciones y modales al salir de la pantalla. */
  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
    this.suscripcionLista?.unsubscribe();
    this.suscripcionMascotas?.unsubscribe();
    this.modalFormulario?.dispose();
    this.modalDetalle?.dispose();
  }

  /** Acceso corto a los controles del formulario. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Indica si hay algún filtro activo (para mostrar "Limpiar" y el mensaje vacío). */
  get hayFiltros(): boolean {
    return !!(
      this.terminoBusqueda.trim() ||
      this.filtroEstado ||
      this.filtroMedico !== null ||
      this.filtroDesde ||
      this.filtroHasta
    );
  }

  // ===================== Listado =====================

  /** Consulta al backend la página actual con el orden y los filtros vigentes. */
  listar(): void {
    this.suscripcionLista?.unsubscribe();
    this.cargandoLista = true;
    this.errorLista = false;

    const filtro: FiltroCitas = {
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

    this.suscripcionLista = this.citaService.listar(filtro).subscribe({
      next: (pagina) => {
        this.citas = pagina.content;
        this.totalRegistros = pagina.totalElements;
        this.totalPaginas = pagina.totalPages;
        this.paginaActual = pagina.page;
        this.cargandoLista = false;
        // Si la página quedó fuera de rango (por ejemplo tras filtrar), vuelve a la última.
        if (pagina.content.length === 0 && pagina.totalPages > 0 && pagina.page >= pagina.totalPages) {
          this.irAPagina(pagina.totalPages - 1);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoLista = false;
        this.errorLista = true;
        this.citas = [];
        mostrarError(error, 'No se pudieron cargar las citas');
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

  /** Quita todos los filtros y deja el orden inicial (fecha descendente). */
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
   * Ordena por una columna; si ya estaba ordenada por ella, invierte la dirección.
   *
   * @param columna columna elegida (fecha, hora, cliente, mascota, medico o estado).
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
   * @param tamano nueva cantidad de registros por página.
   */
  cambiarTamanoPagina(tamano: number): void {
    this.registrosPorPagina = tamano;
    this.paginaActual = 0;
    this.listar();
  }

  // ===================== Formulario =====================

  /** Crea el formulario reactivo con sus validaciones. */
  private inicializarFormulario(): void {
    this.form = this.formBuilder.group(
      {
        clienteId: [null, Validators.required],
        mascotaId: [{ value: null, disabled: true }, Validators.required],
        medicoId: [null, Validators.required],
        fecha: ['', Validators.required],
        hora: ['', Validators.required],
        motivo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]],
        estado: ['PENDIENTE', Validators.required]
      },
      { validators: this.validarFechaHora }
    );

    // Combo dependiente: al elegir cliente se consultan solo sus mascotas.
    this.suscripciones.add(
      this.f['clienteId'].valueChanges.subscribe((clienteId: number | null) =>
        this.alCambiarCliente(clienteId)
      )
    );
  }

  /** Carga los clientes y veterinarios que llenan los combos. */
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
   * Reacciona al cambio de cliente: limpia la mascota y consulta solo las del cliente.
   *
   * @param clienteId cliente elegido (null si se borró la selección).
   */
  private alCambiarCliente(clienteId: number | null): void {
    this.suscripcionMascotas?.unsubscribe();
    const mascotaCtrl = this.f['mascotaId'];
    mascotaCtrl.reset(null, { emitEvent: false });
    mascotaCtrl.disable({ emitEvent: false });
    this.mascotas = [];

    if (clienteId === null || this.modoFormulario === 'E') {
      return;
    }

    this.cargandoMascotas = true;
    this.suscripcionMascotas = this.catalogoService.listarMascotasPorCliente(clienteId).subscribe({
      next: (data) => {
        this.mascotas = data;
        this.cargandoMascotas = false;
        if (data.length > 0) {
          mascotaCtrl.enable({ emitEvent: false });
        }
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoMascotas = false;
        mostrarError(error, 'No se pudieron cargar las mascotas del cliente');
      }
    });
  }

  /** Abre el formulario vacío para registrar una cita nueva. */
  abrirNueva(): void {
    this.modoFormulario = 'C';
    this.citaEditando = null;
    this.estadosFormulario = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA'];
    this.reiniciarFormulario();
    this.f['clienteId'].enable({ emitEvent: false });
    this.f['mascotaId'].disable({ emitEvent: false });
    this.mascotas = [];
    this.abrirModalFormulario();
  }

  /**
   * Abre el formulario para editar una cita. Las citas atendidas o canceladas
   * no se editan: se explica el motivo en lugar de abrir el formulario.
   *
   * @param cita cita a editar.
   */
  abrirEdicion(cita: Cita): void {
    if (cita.estado === 'ATENDIDA') {
      avisar('Esta cita ya fue atendida', 'Hace parte del historial clínico y no se puede modificar.');
      return;
    }
    if (cita.estado === 'CANCELADA') {
      avisar('Esta cita está cancelada', 'No se puede modificar. Si necesita activarla de nuevo, use la opción Reactivar.');
      return;
    }

    this.modoFormulario = 'E';
    this.citaEditando = cita;
    // Solo se ofrece ATENDIDA si la cita ya ocurrió (el backend aplica la misma regla).
    const yaOcurrio = new Date(`${cita.fecha}T${cita.hora}`).getTime() <= Date.now();
    this.estadosFormulario = TRANSICIONES_CITA[cita.estado].filter((e) => e !== 'ATENDIDA' || yaOcurrio);
    this.mascotas = [];
    this.form.reset(
      {
        clienteId: cita.clienteId,
        mascotaId: cita.mascotaId,
        medicoId: cita.medicoId,
        fecha: cita.fecha,
        hora: horaCorta(cita.hora),
        motivo: cita.motivo,
        estado: cita.estado
      },
      { emitEvent: false }
    );
    // Cliente y mascota no se pueden cambiar en una cita ya registrada.
    this.f['clienteId'].disable({ emitEvent: false });
    this.f['mascotaId'].disable({ emitEvent: false });
    this.form.updateValueAndValidity();
    this.abrirModalFormulario();
  }

  /** Deja el formulario en su estado inicial de "cita nueva". */
  private reiniciarFormulario(): void {
    this.form.reset(
      {
        clienteId: null,
        mascotaId: null,
        medicoId: null,
        fecha: '',
        hora: '',
        motivo: '',
        estado: 'PENDIENTE'
      },
      { emitEvent: false }
    );
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.form.updateValueAndValidity();
  }

  /**
   * Envía el formulario: crea la cita o actualiza la que se está editando.
   *
   * @param crearOtra si es true, tras guardar deja el modal abierto con el formulario limpio.
   */
  async guardar(crearOtra = false): Promise<void> {
    if (this.guardando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const citaRq: CitaRq = {
      medicoId: Number(valores.medicoId),
      fecha: valores.fecha,
      hora: valores.hora,
      motivo: String(valores.motivo).trim(),
      estado: valores.estado
    };

    if (this.modoFormulario === 'C') {
      citaRq.clienteId = Number(valores.clienteId);
      citaRq.mascotaId = Number(valores.mascotaId);
    } else if (citaRq.estado === 'CANCELADA' || citaRq.estado === 'ATENDIDA') {
      const accion = citaRq.estado === 'CANCELADA' ? 'cancelar' : 'marcar como atendida';
      const confirmado = await confirmar(
        `¿Desea ${accion} la cita?`,
        'Después de este cambio la cita ya no se podrá editar.'
      );
      if (!confirmado) {
        return;
      }
    }

    this.guardando = true;
    const peticion =
      this.modoFormulario === 'C'
        ? this.citaService.guardar(citaRq)
        : this.citaService.actualizar(this.citaEditando!.citaId, citaRq);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando = false;
        notificarExito(respuesta.message);
        this.listar();
        if (crearOtra && this.modoFormulario === 'C') {
          this.reiniciarFormulario();
          this.f['mascotaId'].disable({ emitEvent: false });
          this.mascotas = [];
        } else {
          this.cerrarModalFormulario();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error, 'No se pudo guardar la cita');
      }
    });
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

  /** Indica si hay que mostrar el aviso de fecha y hora en el pasado. */
  get fechaPasada(): boolean {
    return !!this.form.errors?.['fechaPasada'] &&
      (this.f['fecha'].touched || this.f['hora'].touched);
  }

  // ===================== Detalle, reactivación e historia =====================

  /**
   * Abre el modal con el detalle completo de una cita, consultado al backend.
   *
   * @param cita fila seleccionada en la tabla.
   */
  verDetalle(cita: Cita): void {
    this.citaDetalle = null;
    this.cargandoDetalle = true;
    this.abrirModalDetalle();
    this.citaService.consultar(cita.citaId).subscribe({
      next: (data) => {
        this.citaDetalle = data;
        this.cargandoDetalle = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoDetalle = false;
        this.modalDetalle?.hide();
        mostrarError(error, 'No se pudo consultar la cita');
      }
    });
  }

  /**
   * Reactiva una cita cancelada tras confirmar con el usuario.
   *
   * @param cita cita cancelada.
   */
  async reactivar(cita: Cita): Promise<void> {
    const confirmado = await confirmar(
      '¿Reactivar la cita?',
      'Volverá a quedar en estado Pendiente, siempre que el horario siga disponible.',
      'Sí, reactivar'
    );
    if (!confirmado) {
      return;
    }
    this.citaService.reactivar(cita.citaId).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.listar();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo reactivar la cita')
    });
  }

  /**
   * Abre el módulo de historias clínicas con esta cita atendida ya seleccionada,
   * para generar su historia (regla: una cita atendida debe poder generar una historia).
   *
   * @param cita cita atendida.
   */
  crearHistoria(cita: Cita): void {
    this.router.navigate(['/inicio/historias'], {
      queryParams: { clienteId: cita.clienteId, mascotaId: cita.mascotaId, citaId: cita.citaId }
    });
  }

  // ===================== Utilidades =====================

  /**
   * Clase de Bootstrap para la etiqueta de color de cada estado.
   *
   * @param estado estado de la cita.
   * @returns clases CSS de la etiqueta.
   */
  claseEstado(estado: EstadoCita): string {
    const clases: Record<EstadoCita, string> = {
      PENDIENTE: 'bg-secondary',
      CONFIRMADA: 'bg-primary',
      ATENDIDA: 'bg-success',
      CANCELADA: 'bg-danger',
      PROGRAMADA: 'bg-warning text-dark'
    };
    return clases[estado];
  }

  /** Abre el modal del formulario. */
  private abrirModalFormulario(): void {
    const elemento = document.getElementById('modalCita');
    if (elemento) {
      this.modalFormulario ??= new Modal(elemento);
      this.modalFormulario.show();
    }
  }

  /** Cierra el modal del formulario. */
  cerrarModalFormulario(): void {
    this.modalFormulario?.hide();
  }

  /** Abre el modal de detalle. */
  private abrirModalDetalle(): void {
    const elemento = document.getElementById('modalDetalleCita');
    if (elemento) {
      this.modalDetalle ??= new Modal(elemento);
      this.modalDetalle.show();
    }
  }
}
