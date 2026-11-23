import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import { EventResizeDoneArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { AgendaService } from './service/agenda.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { AuthService } from 'src/app/services/auth.service';
import { COLOR_ESTADO, claseEstado, fechaHoy, fechaLocalIso, guardarArchivo, obtenerMensajeError } from 'src/app/utils/utilidades';

/**
 * Agenda del medico: sus citas en un calendario por dia, semana y mes.
 * Las citas vienen de la base de datos (no son datos temporales de la pantalla).
 */
@Component({
  selector: 'app-agenda',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FullCalendarModule],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss'
})
export class AgendaComponent {
  @ViewChild('calendario') calendario?: FullCalendarComponent;

  readonly claseEstado = claseEstado;
  readonly colores = COLOR_ESTADO;
  readonly estados = ['pendiente', 'confirmada', 'programada', 'atendida', 'cancelada'];

  /** Citas del rango visible (para el resumen por estado). */
  citasVisibles: Cita[] = [];
  citaDetalle: Cita | null = null;
  historialMascota: Cita[] = [];
  cargandoHistorial = false;

  // Formulario de cita
  form: FormGroup;
  citaEditando: Cita | null = null;
  listClientes: Cliente[] = [];
  listMascotas: Mascota[] = [];
  enviando = false;

  // Reporte
  reporteDesde = fechaHoy().substring(0, 8) + '01';
  reporteHasta = fechaHoy();

  private modalDetalle: Modal | null = null;
  private modalForm: Modal | null = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    locale: esLocale,
    initialView: 'timeGridWeek',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek,dayGridMonth' },
    slotMinTime: '06:00:00',
    slotMaxTime: '21:00:00',
    allDaySlot: false,
    nowIndicator: true,
    height: 'auto',
    editable: true,
    selectable: true,
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    events: (info, exito, fallo) => this.cargarEventos(info.start, info.end, exito, fallo),
    eventClick: (arg) => this.verCita(arg),
    eventDrop: (arg) => this.moverCita(arg),
    eventResize: (arg) => this.moverCita(arg),
    select: (arg) => this.nuevaCita(arg)
  };

  constructor(private readonly agendaService: AgendaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    readonly auth: AuthService,
    private readonly router: Router,
    formBuilder: FormBuilder) {
    this.form = formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [null, Validators.required],
      fecha: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      estado: ['programada', Validators.required]
    });
    this.agendaService.misHorarios().subscribe({
      next: (horarios) => this.calendarOptions = {
        ...this.calendarOptions,
        // Sombrea las horas en que el medico atiende
        businessHours: horarios.map((h) => ({ daysOfWeek: [h.diaSemana % 7], startTime: h.horaInicio, endTime: h.horaFin }))
      }
    });
    this.clienteService.listarClientes().subscribe({ next: (data) => this.listClientes = data });
  }

  /** Resumen de citas visibles por estado. */
  get resumen(): { estado: string; cantidad: number }[] {
    return this.estados.map((estado) => ({ estado, cantidad: this.citasVisibles.filter((c) => c.estado === estado).length }));
  }

  /**
   * Trae las citas del rango visible del calendario.
   */
  private cargarEventos(inicio: Date, fin: Date, exito: (e: EventInput[]) => void, fallo: (e: Error) => void) {
    this.agendaService.misCitas(fechaLocalIso(inicio), fechaLocalIso(fin)).subscribe({
      next: (citas) => {
        this.citasVisibles = citas;
        exito(citas.map((c) => ({
          id: String(c.id),
          title: `${c.mascotaNombre} · ${c.clienteNombre}`,
          start: c.fechaHora,
          end: c.fechaHoraFin,
          backgroundColor: COLOR_ESTADO[c.estado ?? ''] ?? '#64748b',
          borderColor: COLOR_ESTADO[c.estado ?? ''] ?? '#64748b',
          // Las atendidas y canceladas no se pueden mover
          editable: c.estado !== 'atendida' && c.estado !== 'cancelada',
          extendedProps: { cita: c }
        })));
      },
      error: (e: HttpErrorResponse) => {
        fallo(new Error(obtenerMensajeError(e)));
        Swal.fire('Error', obtenerMensajeError(e), 'error');
      }
    });
  }

  /** Recarga el calendario. */
  refrescar() {
    this.calendario?.getApi().refetchEvents();
  }

  // ------------------------------------------------------------------ detalle

  /** Abre el detalle de la cita. */
  verCita(arg: EventClickArg) {
    this.citaDetalle = arg.event.extendedProps['cita'] as Cita;
    this.historialMascota = [];
    this.abrir('modalDetalleAgenda', 'detalle');
  }

  /** Carga el historial de citas de la mascota. */
  cargarHistorial() {
    if (!this.citaDetalle?.mascotaId) {
      return;
    }
    this.cargandoHistorial = true;
    this.agendaService.historialMascota(this.citaDetalle.mascotaId).subscribe({
      next: (data) => { this.historialMascota = data; this.cargandoHistorial = false; },
      error: (e: HttpErrorResponse) => { this.cargandoHistorial = false; Swal.fire('Error', obtenerMensajeError(e), 'error'); }
    });
  }

  /** Va a la pantalla de atencion de la cita. */
  atender(cita: Cita) {
    this.modalDetalle?.hide();
    this.router.navigate(['/inicio/atencion', cita.id]);
  }

  /** Cambia el estado de la cita (confirmar o cancelar). */
  cambiarEstado(cita: Cita, estado: string) {
    Swal.fire({
      title: estado === 'cancelada' ? '¿Cancelar la cita?' : '¿Confirmar la cita?',
      text: estado === 'cancelada' ? 'La cita queda en el historial como cancelada.' : '',
      icon: 'question', showCancelButton: true, confirmButtonText: 'Sí', cancelButtonText: 'No'
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.agendaService.cambiarEstado(cita.id!, estado).subscribe({
        next: (rta) => { this.modalDetalle?.hide(); this.refrescar(); Swal.fire('Listo', rta.message, 'success'); },
        error: (e: HttpErrorResponse) => Swal.fire('No se pudo cambiar', obtenerMensajeError(e), 'error')
      });
    });
  }

  // ------------------------------------------------------------------ mover y crear

  /** Arrastrar o estirar una cita: cambia fecha y hora en la base de datos. */
  moverCita(arg: EventDropArg | EventResizeDoneArg) {
    const cita = arg.event.extendedProps['cita'] as Cita;
    this.agendaService.reprogramar(cita.id!, fechaLocalIso(arg.event.start!), fechaLocalIso(arg.event.end!)).subscribe({
      next: (rta) => { this.refrescar(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: rta.message, timer: 2500, showConfirmButton: false }); },
      error: (e: HttpErrorResponse) => { arg.revert(); Swal.fire('No se puede mover la cita', obtenerMensajeError(e), 'warning'); }
    });
  }

  /** Abre el formulario de nueva cita (desde el boton o seleccionando horas en el calendario). */
  nuevaCita(arg?: DateSelectArg) {
    this.citaEditando = null;
    const inicio = arg ? arg.start : new Date();
    const fin = arg ? arg.end : new Date(inicio.getTime() + 30 * 60000);
    this.form.reset({
      fecha: fechaLocalIso(inicio).substring(0, 10),
      horaInicio: fechaLocalIso(inicio).substring(11, 16),
      horaFin: fechaLocalIso(arg?.allDay ? new Date(inicio.getTime() + 30 * 60000) : fin).substring(11, 16),
      estado: 'programada'
    });
    this.listMascotas = [];
    this.calendario?.getApi().unselect();
    this.abrir('modalFormAgenda', 'form');
  }

  /** Abre el formulario con la cita para editarla. */
  editarCita(cita: Cita) {
    this.modalDetalle?.hide();
    this.citaEditando = cita;
    this.form.reset({
      clienteId: cita.clienteId,
      fecha: cita.fechaHora?.substring(0, 10),
      horaInicio: cita.fechaHora?.substring(11, 16),
      horaFin: cita.fechaHoraFin?.substring(11, 16),
      motivo: cita.motivo,
      estado: cita.estado
    });
    this.cambioCliente(cita.mascotaId ?? null);
    this.abrir('modalFormAgenda', 'form');
  }

  /** Carga solo las mascotas del cliente elegido. */
  cambioCliente(mascotaSeleccionada: number | null = null) {
    const clienteId = this.form.get('clienteId')?.value;
    this.listMascotas = [];
    this.form.get('mascotaId')?.setValue(mascotaSeleccionada);
    if (!clienteId) { return; }
    this.mascotaService.listarPorCliente(clienteId).subscribe({ next: (data) => this.listMascotas = data });
  }

  /** Guarda la cita. */
  guardar() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.horaFin <= v.horaInicio) {
      Swal.fire('Revise las horas', 'La hora de fin debe ser posterior a la de inicio', 'warning');
      return;
    }
    const cita: Cita = {
      citaId: this.citaEditando?.id,
      clienteId: Number(v.clienteId),
      mascotaId: Number(v.mascotaId),
      fechaHora: `${v.fecha}T${v.horaInicio}:00`,
      fechaHoraFin: `${v.fecha}T${v.horaFin}:00`,
      motivo: v.motivo.trim(),
      estado: v.estado
    };
    this.enviando = true;
    const peticion = this.citaEditando ? this.agendaService.actualizar(cita) : this.agendaService.crear(cita);
    peticion.subscribe({
      next: (rta) => { this.enviando = false; this.modalForm?.hide(); this.refrescar(); Swal.fire('Listo', rta.message, 'success'); },
      error: (e: HttpErrorResponse) => { this.enviando = false; Swal.fire('No se pudo guardar', obtenerMensajeError(e), 'error'); }
    });
  }

  // ------------------------------------------------------------------ reporte

  /** Descarga el Excel de citas del medico en el rango elegido. */
  descargarReporte() {
    if (!this.reporteDesde || !this.reporteHasta || this.reporteDesde > this.reporteHasta) {
      Swal.fire('Revise las fechas', 'La fecha inicial debe ser menor o igual a la final', 'warning');
      return;
    }
    this.agendaService.reporteExcel(this.reporteDesde, this.reporteHasta).subscribe({
      next: (archivo) => guardarArchivo(archivo, `mis_citas_${this.reporteDesde}_${this.reporteHasta}.xlsx`),
      error: () => Swal.fire('Error', 'No se pudo generar el reporte', 'error')
    });
  }

  private abrir(id: string, tipo: 'detalle' | 'form') {
    const el = document.getElementById(id);
    if (!el) { return; }
    if (tipo === 'detalle') {
      this.modalDetalle ??= new Modal(el);
      this.modalDetalle.show();
    } else {
      this.modalForm ??= new Modal(el);
      this.modalForm.show();
    }
  }
}
