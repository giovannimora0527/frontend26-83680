import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import {
  CalendarOptions,
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  EventInput,
  EventSourceFuncArg
} from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Modal } from 'bootstrap';

import { CitaService } from '../cita/service/cita.service';
import { AuthService } from 'src/app/services/auth.service';
import { CatalogoService } from 'src/app/services/catalogo.service';
import { ClienteOpcion, MascotaOpcion, MedicoOpcion } from 'src/app/models/catalogo';
import {
  Cita,
  CitaHistorial,
  DIAS_SEMANA,
  EstadoCita,
  EstadoCitaInfo,
  HorarioMedico,
  NOMBRE_ESTADO_CITA
} from 'src/app/models/cita';
import { descargarArchivo } from 'src/app/utils/archivos';
import { horaCorta } from 'src/app/utils/fechas';
import { avisar, confirmar, mostrarError, notificarExito, pedirMotivo } from 'src/app/utils/mensajes';

/** Datos del formulario de cita nueva. */
interface NuevaCita {
  clienteId: number | null;
  mascotaId: number | null;
  fecha: string;
  hora: string;
  horaFin: string;
  motivo: string;
  estado: EstadoCita;
}

/** Datos del formulario de reprogramación. */
interface Reprogramacion {
  fecha: string;
  hora: string;
  horaFin: string;
  observacion: string;
}

/** Fecha local en formato yyyy-MM-dd. */
function isoLocal(fecha: Date): string {
  const d = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
}

/** Hora local en formato HH:mm. */
function horaLocal(fecha: Date): string {
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}

/**
 * Calendario de citas del veterinario autenticado (vista de mes, semana y día).
 *
 * Las citas se leen del backend para el rango visible y se colorean según su
 * estado; el horario de disponibilidad del veterinario se muestra como horas
 * hábiles y limita dónde se pueden crear o mover citas. Desde el calendario
 * se registra una cita (seleccionando el espacio), se consulta su detalle,
 * se confirma, se marca como atendida, se cancela con motivo, se reprograma
 * (arrastrando o con el formulario) y se descarga el reporte en Excel. Todas
 * las reglas (cruces, horario, médico activo) se validan en el backend.
 */
@Component({
  selector: 'app-calendario',
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss']
})
export class CalendarioComponent implements OnInit, OnDestroy {
  /** Referencia al calendario, para refrescar eventos. */
  @ViewChild('calendario') calendario?: FullCalendarComponent;

  /** Sesión actual. */
  private readonly auth = inject(AuthService);
  /** Médico de la sesión (si es veterinario). */
  readonly medicoSesionId = this.auth.perfil?.medicoId ?? null;
  /** Nombre del médico de la sesión. */
  readonly medicoSesionNombre = this.auth.perfil?.medicoNombre ?? '';
  /** El veterinario solo ve su calendario; otros perfiles eligen el veterinario. */
  readonly esVeterinario = this.auth.tieneRol('VETERINARIO');
  /** Recorta horas a HH:mm. */
  readonly horaCorta = horaCorta;
  /** Nombres de los días. */
  readonly dias = DIAS_SEMANA;

  /** Veterinario cuyo calendario se muestra. */
  medicoId: number | null = this.medicoSesionId;
  /** Veterinarios (para administración y recepción). */
  medicos: MedicoOpcion[] = [];
  /** Catálogo de estados con color. */
  estados: EstadoCitaInfo[] = [];
  /** Horario semanal del veterinario. */
  horario: HorarioMedico[] = [];
  /** Citas del rango visible. */
  citas: Cita[] = [];
  /** Indica que se están cargando las citas. */
  cargando = false;
  /** Rango visible (inicio incluido, fin excluido). */
  private rango: { desde: string; hasta: string } | null = null;

  // ----- Cita nueva -----
  /** Clientes. */
  clientes: ClienteOpcion[] = [];
  /** Mascotas del cliente elegido. */
  mascotas: MascotaOpcion[] = [];
  /** Datos de la cita nueva. */
  nueva: NuevaCita = this.citaVacia();
  /** Indica que se intentó guardar (para mostrar errores). */
  intentoGuardar = false;
  /** Indica que se está guardando. */
  guardando = false;

  // ----- Detalle -----
  /** Cita seleccionada. */
  seleccionada: Cita | null = null;
  /** Historial de cambios de la cita seleccionada. */
  historialCita: CitaHistorial[] = [];
  /** Citas anteriores de la mascota. */
  historialMascota: Cita[] = [];
  /** Pestaña del detalle. */
  pestanaDetalle: 'datos' | 'cambios' | 'mascota' = 'datos';
  /** Formulario de reprogramación (null = oculto). */
  reprogramacion: Reprogramacion | null = null;
  /** Indica que se está procesando una acción. */
  procesando = false;

  // ----- Excel -----
  /** Fecha inicial del reporte. */
  excelDesde = '';
  /** Fecha final del reporte. */
  excelHasta = '';
  /** Estado del reporte. */
  excelEstado = '';
  /** Indica que se está generando el Excel. */
  descargando = false;

  /** Modales. */
  private modalNueva: Modal | null = null;
  private modalDetalle: Modal | null = null;
  private modalExcel: Modal | null = null;

  /** Opciones del calendario. */
  opciones: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    locale: esLocale,
    initialView: 'timeGridWeek',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
    buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' },
    height: 'auto',
    slotMinTime: '06:00:00',
    slotMaxTime: '21:00:00',
    slotDuration: '00:15:00',
    slotLabelInterval: '01:00',
    allDaySlot: false,
    nowIndicator: true,
    selectable: true,
    selectMirror: true,
    editable: true,
    eventDurationEditable: true,
    selectConstraint: 'businessHours',
    eventConstraint: 'businessHours',
    businessHours: [],
    dayMaxEvents: 4,
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    events: (info, ok, fallo) => this.cargarEventos(info, ok, fallo),
    datesSet: (arg) => this.alCambiarRango(arg),
    select: (arg) => this.alSeleccionar(arg),
    dateClick: (arg) => this.alHacerClicEnDia(arg),
    eventClick: (arg) => this.alHacerClicEnCita(arg),
    eventDrop: (arg) => this.alMover(arg),
    eventResize: (arg) => this.alMover(arg),
    eventAllow: (_span, evento) => !!evento && evento.startEditable !== false
  };

  /**
   * @param citaService servicio de citas.
   * @param catalogoService catálogos de clientes, mascotas y veterinarios.
   * @param router enrutador, para ir a la atención de la cita.
   */
  constructor(
    private readonly citaService: CitaService,
    private readonly catalogoService: CatalogoService,
    private readonly router: Router
  ) { }

  /** Carga estados, veterinarios, clientes y el horario. */
  ngOnInit(): void {
    this.citaService.estados().subscribe({
      next: (data) => {
        this.estados = data;
        this.refrescar();
      },
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudieron cargar los estados de las citas')
    });
    this.catalogoService.listarClientes().subscribe({
      next: (data) => (this.clientes = data),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo cargar la lista de clientes')
    });
    if (!this.esVeterinario) {
      this.catalogoService.listarMedicos().subscribe({
        next: (data) => {
          this.medicos = data;
          this.medicoId ??= data[0]?.id ?? null;
          this.cargarHorario();
          this.refrescar();
        },
        error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo cargar la lista de veterinarios')
      });
    } else if (!this.medicoSesionId) {
      avisar('Usuario sin médico asociado',
        'Su usuario no está enlazado a un médico veterinario. Solicite al administrador que lo asocie.', 'warning');
    } else {
      this.cargarHorario();
    }
  }

  /** Cierra los modales. */
  ngOnDestroy(): void {
    this.modalNueva?.dispose();
    this.modalDetalle?.dispose();
    this.modalExcel?.dispose();
  }

  /** Nombre del veterinario mostrado. */
  get nombreMedico(): string {
    if (this.esVeterinario) {
      return this.medicoSesionNombre;
    }
    const m = this.medicos.find((x) => x.id === this.medicoId);
    return m ? `${m.nombres} ${m.apellidos}` : '';
  }

  /** Cantidad de citas visibles por estado. */
  get resumen(): { info: EstadoCitaInfo; cantidad: number }[] {
    return this.estados.map((info) => ({ info, cantidad: this.citas.filter((c) => c.estado === info.codigo).length }));
  }

  /** Horario agrupado por día, para mostrarlo bajo el calendario. */
  get horarioPorDia(): { dia: string; franjas: string }[] {
    return [1, 2, 3, 4, 5, 6, 7]
      .map((d) => ({
        dia: DIAS_SEMANA[d],
        franjas: this.horario.filter((h) => h.diaSemana === d)
          .map((h) => `${horaCorta(h.horaInicio)}–${horaCorta(h.horaFin)}`).join(', ')
      }))
      .filter((d) => d.franjas);
  }

  // ===================== Carga =====================

  /** Cambia el veterinario (administración y recepción). */
  cambiarMedico(): void {
    this.cargarHorario();
    this.refrescar();
  }

  /** Vuelve a consultar las citas del rango visible. */
  refrescar(): void {
    this.calendario?.getApi().refetchEvents();
  }

  /** Consulta el horario del veterinario y lo aplica como horas hábiles. */
  private cargarHorario(): void {
    if (!this.medicoId) {
      return;
    }
    this.citaService.horarios(this.medicoId).subscribe({
      next: (data) => {
        this.horario = data;
        const horasHabiles = data.map((h) => ({
          daysOfWeek: [h.diaSemana % 7],
          startTime: horaCorta(h.horaInicio),
          endTime: horaCorta(h.horaFin)
        }));
        // Sin horario no se puede agendar: se deja un horario vacío imposible.
        this.opciones = {
          ...this.opciones,
          businessHours: horasHabiles.length ? horasHabiles : { daysOfWeek: [], startTime: '00:00', endTime: '00:00' }
        };
      },
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo cargar el horario del veterinario')
    });
  }

  /** Fuente de eventos: consulta el backend para el rango visible. */
  private cargarEventos(info: EventSourceFuncArg, ok: (e: EventInput[]) => void, fallo: (e: Error) => void): void {
    if (!this.medicoId) {
      ok([]);
      return;
    }
    const desde = isoLocal(info.start);
    const hasta = isoLocal(new Date(info.end.getTime() - 1));
    this.cargando = true;
    this.citaService.calendario(desde, hasta, this.medicoId).subscribe({
      next: (data) => {
        this.cargando = false;
        this.citas = data;
        ok(data.map((c) => this.aEvento(c)));
      },
      error: (e: HttpErrorResponse) => {
        this.cargando = false;
        mostrarError(e, 'No se pudieron cargar las citas');
        fallo(new Error('citas'));
      }
    });
  }

  /** Convierte una cita en evento del calendario. */
  private aEvento(c: Cita): EventInput {
    const color = this.colorEstado(c.estado);
    const final = c.estado === 'ATENDIDA' || c.estado === 'CANCELADA';
    return {
      id: String(c.citaId),
      title: `${c.mascotaNombre} · ${c.clienteNombre}`,
      start: c.inicio,
      end: c.fin,
      backgroundColor: color,
      borderColor: color,
      textColor: c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA' ? '#1d2630' : '#ffffff',
      editable: !final,
      classNames: c.estado === 'CANCELADA' ? ['cita-cancelada'] : [],
      extendedProps: { cita: c }
    };
  }

  /** Guarda el rango visible (para el reporte en Excel). */
  private alCambiarRango(arg: DatesSetArg): void {
    this.rango = { desde: isoLocal(arg.start), hasta: isoLocal(new Date(arg.end.getTime() - 1)) };
  }

  // ===================== Cita nueva =====================

  /** Al seleccionar un espacio en la vista de semana o día, propone una cita en ese horario. */
  private alSeleccionar(arg: DateSelectArg): void {
    if (arg.view.type === 'dayGridMonth') {
      return;
    }
    this.calendario?.getApi().unselect();
    this.abrirNueva(isoLocal(arg.start), horaLocal(arg.start), horaLocal(arg.end));
  }

  /** En la vista de mes, un clic en el día abre esa fecha en la vista de día. */
  private alHacerClicEnDia(arg: DateClickArg): void {
    if (arg.view.type === 'dayGridMonth') {
      this.calendario?.getApi().changeView('timeGridDay', arg.date);
    }
  }

  /** Abre el formulario de cita nueva. */
  abrirNueva(fecha = '', hora = '', horaFin = ''): void {
    if (!this.medicoId) {
      avisar('Seleccione un veterinario', 'Elija el veterinario cuya agenda desea gestionar.', 'warning');
      return;
    }
    this.nueva = { ...this.citaVacia(), fecha, hora, horaFin };
    this.mascotas = [];
    this.intentoGuardar = false;
    this.modalNueva = this.abrirModal('modalNuevaCita', this.modalNueva);
  }

  /** Al cambiar el cliente consulta sus mascotas. */
  alCambiarCliente(): void {
    this.nueva.mascotaId = null;
    this.mascotas = [];
    if (!this.nueva.clienteId) {
      return;
    }
    this.catalogoService.listarMascotasPorCliente(this.nueva.clienteId).subscribe({
      next: (data) => (this.mascotas = data),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudieron cargar las mascotas del cliente')
    });
  }

  /** Errores del formulario de cita nueva (vacío si es válido). */
  get erroresNueva(): string[] {
    const n = this.nueva;
    const errores: string[] = [];
    if (!n.clienteId) errores.push('Seleccione el propietario.');
    if (!n.mascotaId) errores.push('Seleccione la mascota.');
    if (!n.fecha || !n.hora || !n.horaFin) errores.push('Indique la fecha, la hora de inicio y la de fin.');
    if (n.hora && n.horaFin && n.horaFin <= n.hora) errores.push('La hora de fin debe ser posterior a la de inicio.');
    if (n.fecha && n.hora && new Date(`${n.fecha}T${n.hora}`).getTime() < Date.now()) {
      errores.push('La cita no puede quedar en el pasado.');
    }
    if (!n.motivo.trim()) errores.push('Escriba el motivo de la consulta.');
    if (n.motivo.length > 500) errores.push('El motivo no puede superar 500 caracteres.');
    return errores;
  }

  /** Registra la cita nueva. */
  guardarNueva(): void {
    this.intentoGuardar = true;
    if (this.erroresNueva.length || this.guardando) {
      return;
    }
    const n = this.nueva;
    this.guardando = true;
    this.citaService.guardar({
      clienteId: n.clienteId!,
      mascotaId: n.mascotaId!,
      medicoId: this.medicoId!,
      fecha: n.fecha,
      hora: n.hora,
      horaFin: n.horaFin,
      motivo: n.motivo.trim(),
      estado: n.estado
    }).subscribe({
      next: (r) => {
        this.guardando = false;
        this.modalNueva?.hide();
        notificarExito(r.message);
        this.refrescar();
      },
      error: (e: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(e, 'No se pudo registrar la cita');
      }
    });
  }

  // ===================== Detalle y acciones =====================

  /** Abre el detalle de la cita. */
  private alHacerClicEnCita(arg: EventClickArg): void {
    const cita = arg.event.extendedProps['cita'] as Cita;
    this.verDetalle(cita);
  }

  /** Muestra el detalle de una cita con su historial. */
  verDetalle(cita: Cita): void {
    this.seleccionada = cita;
    this.pestanaDetalle = 'datos';
    this.reprogramacion = null;
    this.historialCita = [];
    this.historialMascota = [];
    this.modalDetalle = this.abrirModal('modalDetalleCita', this.modalDetalle);
    this.citaService.historial(cita.citaId).subscribe({ next: (h) => (this.historialCita = h) });
    this.citaService.historialMascota(cita.mascotaId).subscribe({ next: (c) => (this.historialMascota = c) });
  }

  /** Indica si la cita ya empezó. */
  get yaEmpezo(): boolean {
    return !!this.seleccionada && new Date(this.seleccionada.inicio).getTime() <= Date.now();
  }

  /** Indica si la cita es editable (no atendida ni cancelada). */
  get editable(): boolean {
    return !!this.seleccionada && this.seleccionada.estado !== 'ATENDIDA' && this.seleccionada.estado !== 'CANCELADA';
  }

  /** Confirma la cita. */
  confirmarCita(): void {
    this.cambiarEstado('CONFIRMADA');
  }

  /** Marca la cita como atendida. */
  async marcarAtendida(): Promise<void> {
    const ok = await confirmar('¿Marcar la cita como atendida?',
      'La cita quedará finalizada y ya no se podrá mover ni cancelar.', 'Sí, finalizar');
    if (ok) {
      this.cambiarEstado('ATENDIDA');
    }
  }

  /** Cancela la cita pidiendo el motivo. */
  async cancelarCita(): Promise<void> {
    const motivo = await pedirMotivo('¿Cancelar la cita?',
      'La cita se conserva en el historial y el horario queda libre.', 'Sí, cancelar');
    if (motivo !== null) {
      this.cambiarEstado('CANCELADA', motivo);
    }
  }

  /** Reactiva una cita cancelada. */
  reactivar(): void {
    if (!this.seleccionada || this.procesando) {
      return;
    }
    this.procesando = true;
    this.citaService.reactivar(this.seleccionada.citaId).subscribe({
      next: (r) => this.trasAccion(r.message),
      error: (e: HttpErrorResponse) => {
        this.procesando = false;
        mostrarError(e, 'No se pudo reactivar la cita');
      }
    });
  }

  /** Envía el cambio de estado. */
  private cambiarEstado(estado: EstadoCita, motivo?: string): void {
    if (!this.seleccionada || this.procesando) {
      return;
    }
    this.procesando = true;
    this.citaService.cambiarEstado(this.seleccionada.citaId, estado, motivo).subscribe({
      next: (r) => this.trasAccion(r.message),
      error: (e: HttpErrorResponse) => {
        this.procesando = false;
        mostrarError(e, 'No se pudo cambiar el estado de la cita');
      }
    });
  }

  /** Muestra el formulario de reprogramación con los datos actuales. */
  abrirReprogramacion(): void {
    const c = this.seleccionada!;
    this.reprogramacion = { fecha: c.fecha, hora: horaCorta(c.hora), horaFin: horaCorta(c.horaFin), observacion: '' };
  }

  /** Reprograma la cita con los datos del formulario. */
  guardarReprogramacion(): void {
    const r = this.reprogramacion;
    if (!r || !this.seleccionada || this.procesando) {
      return;
    }
    if (!r.fecha || !r.hora || !r.horaFin || r.horaFin <= r.hora) {
      avisar('Horario inválido', 'Indique la fecha y una hora de fin posterior a la de inicio.', 'warning');
      return;
    }
    this.procesando = true;
    this.citaService.reprogramar(this.seleccionada.citaId, r.fecha, r.hora, r.horaFin, r.observacion.trim())
      .subscribe({
        next: (rs) => this.trasAccion(rs.message),
        error: (e: HttpErrorResponse) => {
          this.procesando = false;
          mostrarError(e, 'No se pudo reprogramar la cita');
        }
      });
  }

  /** Al arrastrar o cambiar la duración de una cita, pide confirmación y la reprograma. */
  private async alMover(arg: EventDropArg | EventResizeDoneArg): Promise<void> {
    const ev = arg.event;
    if (!ev.start || !ev.end) {
      arg.revert();
      return;
    }
    const fecha = isoLocal(ev.start);
    const hora = horaLocal(ev.start);
    const horaFin = horaLocal(ev.end);
    const ok = await confirmar('¿Reprogramar la cita?',
      `${ev.title}: nuevo horario el ${fecha} de ${hora} a ${horaFin}.`, 'Sí, reprogramar');
    if (!ok) {
      arg.revert();
      return;
    }
    this.citaService.reprogramar(Number(ev.id), fecha, hora, horaFin, 'Movida en el calendario').subscribe({
      next: (r) => {
        notificarExito(r.message);
        this.refrescar();
      },
      error: (e: HttpErrorResponse) => {
        arg.revert();
        mostrarError(e, 'No se pudo reprogramar la cita');
      }
    });
  }

  /** Tras una acción exitosa: avisa, cierra el detalle y recarga. */
  private trasAccion(mensaje: string): void {
    this.procesando = false;
    this.modalDetalle?.hide();
    notificarExito(mensaje);
    this.refrescar();
  }

  // ===================== Excel =====================

  /** Abre el formulario del reporte con el rango visible. */
  abrirExcel(): void {
    this.excelDesde = this.rango?.desde ?? '';
    this.excelHasta = this.rango?.hasta ?? '';
    this.excelEstado = '';
    this.modalExcel = this.abrirModal('modalExcelCitas', this.modalExcel);
  }

  /** Descarga el reporte de citas en Excel. */
  descargarExcel(): void {
    if (!this.excelDesde || !this.excelHasta) {
      avisar('Fechas requeridas', 'Indique la fecha inicial y la final del reporte.', 'warning');
      return;
    }
    if (this.excelDesde > this.excelHasta) {
      avisar('Rango de fechas inválido', 'La fecha inicial no puede ser posterior a la final.', 'warning');
      return;
    }
    this.descargando = true;
    this.citaService.descargarExcel(this.excelDesde, this.excelHasta, this.medicoId, this.excelEstado).subscribe({
      next: (archivo) => {
        this.descargando = false;
        this.modalExcel?.hide();
        descargarArchivo(archivo, `citas-${this.excelDesde}-a-${this.excelHasta}.xlsx`);
      },
      error: (e: HttpErrorResponse) => {
        this.descargando = false;
        mostrarError(e, 'No se pudo generar el reporte');
      }
    });
  }

  // ===================== Utilidades =====================

  /** Color de un estado. */
  colorEstado(estado: string): string {
    return this.estados.find((e) => e.codigo === estado)?.color ?? '#04a9f5';
  }

  /** Nombre visible de un estado. */
  nombreEstado(estado: string | null): string {
    if (!estado) {
      return '—';
    }
    return this.estados.find((e) => e.codigo === estado)?.nombre ?? NOMBRE_ESTADO_CITA[estado as EstadoCita] ?? estado;
  }

  /** Texto de una acción del historial. */
  textoAccion(accion: string): string {
    return ({ CREADA: 'Creada', EDITADA: 'Editada', REPROGRAMADA: 'Reprogramada', ESTADO: 'Cambio de estado',
      REACTIVADA: 'Reactivada' } as Record<string, string>)[accion] ?? accion;
  }

  /** Cita vacía para el formulario. */
  private citaVacia(): NuevaCita {
    return { clienteId: null, mascotaId: null, fecha: '', hora: '', horaFin: '', motivo: '', estado: 'PROGRAMADA' };
  }

  /** Abre un modal de Bootstrap, creándolo la primera vez. */
  private abrirModal(id: string, actual: Modal | null): Modal | null {
    const elemento = document.getElementById(id);
    if (!elemento) {
      return actual;
    }
    const modal = actual ?? new Modal(elemento);
    modal.show();
    return modal;
  }

  /** Indica si la cita se puede atender (es del veterinario y empieza en menos de 30 minutos). */
  get puedeAtender(): boolean {
    const c = this.seleccionada;
    return this.esVeterinario && !!c && c.estado !== 'CANCELADA'
      && new Date(c.inicio).getTime() - Date.now() <= 30 * 60000;
  }

  /** Abre la atención médica de la cita seleccionada. */
  atender(): void {
    const c = this.seleccionada;
    if (!c) {
      return;
    }
    this.modalDetalle?.hide();
    this.router.navigate(['/inicio/atencion'], { queryParams: { citaId: c.citaId } });
  }
}

