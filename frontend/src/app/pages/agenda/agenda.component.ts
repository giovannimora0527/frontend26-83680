import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventApi, EventClickArg, EventDropArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import { EventResizeDoneArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Mensajes } from '../../core/mensajes';
import { Cita, Horario, Respuesta } from '../../core/models';
import { COLORES_CITA, etiqueta, fechaHoraLocal, hoyISO, primerDiaMes } from '../../core/util';
import { CitaFormComponent } from '../../shared/cita-form.component';
import { EstadoComponent } from '../../shared/estado.component';
import { ModalComponent } from '../../shared/modal.component';

const EDITABLES = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA'];

/** Agenda del veterinario autenticado (perfil MEDICO) con calendario día / semana / mes. */
@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [FullCalendarModule, FormsModule, DatePipe, CitaFormComponent, EstadoComponent, ModalComponent],
  templateUrl: './agenda.component.html'
})
export class AgendaComponent implements OnInit {
  @ViewChild('calendario') calendario?: FullCalendarComponent;
  private api = inject(ApiService);
  private router = inject(Router);
  auth = inject(AuthService);
  colores = COLORES_CITA;
  etiqueta = etiqueta;
  leyenda = Object.keys(COLORES_CITA);
  resumen: Record<string, number> = {};
  repDesde = primerDiaMes();
  repHasta = hoyISO();
  seleccionada: Cita | null = null;
  citasMascota: Cita[] = [];
  verHistMascota = false;
  formAbierto = false;
  citaEditar: Cita | null = null;
  inicioSugerido: Date | null = null;
  medicoId = this.auth.usuario()?.medicoId ?? null;
  rango = { inicio: '', fin: '' };
  sinHorario = false;

  opciones: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    locale: esLocale,
    initialView: 'timeGridWeek',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' },
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    slotDuration: '00:15:00',
    slotLabelInterval: '00:30:00',
    dayMaxEvents: 4,
    allDaySlot: false,
    nowIndicator: true,
    height: 'auto',
    selectable: true,
    selectMirror: true,
    editable: true,
    eventDurationEditable: true,
    // No se agenda ni se mueve nada hacia el pasado (el backend también lo valida).
    selectAllow: s => s.start >= new Date(),
    eventAllow: d => d.start >= new Date(),
    events: (info, ok, fallo) => {
      this.rango = { inicio: fechaHoraLocal(info.start), fin: fechaHoraLocal(info.end) };
      this.api.get<Cita[]>('/cita/agenda', this.rango).subscribe({
        next: citas => { ok(citas.map(c => this.evento(c))); this.calcularResumen(citas); },
        error: e => { fallo(e); Mensajes.error(e); }
      });
    },
    eventClick: (a: EventClickArg) => this.abrir(a.event),
    select: (s: DateSelectArg) => this.nueva(s.start),
    eventDrop: (a: EventDropArg) => this.reprogramar(a.event, a.revert),
    eventResize: (a: EventResizeDoneArg) => this.reprogramar(a.event, a.revert)
  };

  ngOnInit(): void {
    if (this.medicoId) {
      this.api.get<Horario[]>('/medico/horarios', { medicoId: this.medicoId }).subscribe(h => {
        const activos = h.filter(x => x.activo !== false);
        this.sinHorario = activos.length === 0;
        if (this.sinHorario) { return; }
        // Con horario definido, seleccionar o arrastrar fuera de él queda bloqueado en el calendario.
        this.opciones = {
          ...this.opciones,
          businessHours: activos.map(x => ({
            daysOfWeek: [x.diaSemana === 7 ? 0 : x.diaSemana], startTime: x.horaInicio.substring(0, 5), endTime: x.horaFin.substring(0, 5) })),
          selectConstraint: 'businessHours',
          eventConstraint: 'businessHours'
        };
      });
    }
  }

  private evento(c: Cita): EventInput {
    return {
      id: String(c.id),
      title: `${c.mascota.nombreMascota} · ${c.cliente.nombres} ${c.cliente.apellidos}`,
      start: c.fechaHora,
      end: c.fechaHoraFin,
      backgroundColor: COLORES_CITA[c.estado] ?? '#6c757d',
      borderColor: COLORES_CITA[c.estado] ?? '#6c757d',
      editable: EDITABLES.includes(c.estado),
      extendedProps: { cita: c }
    };
  }

  private calcularResumen(citas: Cita[]): void {
    const r: Record<string, number> = { TOTAL: citas.length };
    citas.forEach(c => r[c.estado] = (r[c.estado] ?? 0) + 1);
    this.resumen = r;
  }

  refrescar(): void { this.calendario?.getApi().refetchEvents(); }

  abrir(e: EventApi): void { this.seleccionada = e.extendedProps['cita'] as Cita; }

  editable(c: Cita): boolean { return EDITABLES.includes(c.estado); }

  nueva(inicio: Date | null = null): void {
    if (inicio && inicio < new Date()) { Mensajes.aviso('Horario pasado', 'Seleccione un horario futuro.'); return; }
    this.citaEditar = null; this.inicioSugerido = inicio; this.formAbierto = true;
  }

  editar(c: Cita): void { this.seleccionada = null; this.citaEditar = c; this.formAbierto = true; }

  guardado(): void { this.formAbierto = false; this.refrescar(); }

  /** Al arrastrar o estirar una cita se pide confirmación; un movimiento accidental se deshace con "Cancelar". */
  private async reprogramar(e: EventApi, revertir: () => void): Promise<void> {
    const c = e.extendedProps['cita'] as Cita;
    if (!e.start || !e.end) { revertir(); return; }
    const p = (n: number) => String(n).padStart(2, '0');
    const dia = `${p(e.start.getDate())}/${p(e.start.getMonth() + 1)}/${e.start.getFullYear()}`;
    const horas = `${p(e.start.getHours())}:${p(e.start.getMinutes())} a ${p(e.end.getHours())}:${p(e.end.getMinutes())}`;
    const ok = await Mensajes.confirmar(`${c.mascota.nombreMascota}: nuevo horario el ${dia} de ${horas}.`, '¿Reprogramar la cita?', 'Sí, reprogramar');
    if (!ok) { revertir(); return; }
    this.api.patch<Respuesta>('/cita/reprogramar', { citaId: c.id, fechaHora: fechaHoraLocal(e.start), fechaHoraFin: fechaHoraLocal(e.end) })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.refrescar(); }, error: err => { revertir(); Mensajes.error(err, 'No se pudo reprogramar'); } });
  }

  cambiar(c: Cita, estado: string): void {
    this.api.patch<Respuesta>('/cita/cambiar-estado', { citaId: c.id, estado })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.seleccionada = null; this.refrescar(); }, error: e => Mensajes.error(e) });
  }

  async cancelar(c: Cita): Promise<void> {
    const motivo = await Mensajes.pedirTexto('Cancelar cita', 'Motivo (se conserva en el historial)');
    if (!motivo) { return; }
    this.api.patch<Respuesta>('/cita/cambiar-estado', { citaId: c.id, estado: 'CANCELADA', observacion: motivo })
      .subscribe({ next: r => { Mensajes.exito(r.message); this.seleccionada = null; this.refrescar(); }, error: e => Mensajes.error(e) });
  }

  atender(c: Cita): void {
    this.seleccionada = null;
    this.router.navigate(['/inicio/atencion', c.id]);
  }

  historialMascota(c: Cita): void {
    this.verHistMascota = true; this.citasMascota = [];
    this.api.get<Cita[]>('/cita/listar-por-mascota', { mascotaId: c.mascota.mascotaId }).subscribe(x => this.citasMascota = x);
  }

  reporteExcel(): void {
    if (!this.repDesde || !this.repHasta || this.repDesde > this.repHasta) { Mensajes.aviso('Fechas', 'Seleccione un rango válido.'); return; }
    this.api.descargar('/cita/reporte-excel', { fechaInicial: this.repDesde, fechaFinal: this.repHasta }, 'citas.xlsx')
      .subscribe({ error: e => Mensajes.error(e) });
  }

  reportePdf(): void {
    if (!this.repDesde || !this.repHasta || this.repDesde > this.repHasta) { Mensajes.aviso('Fechas', 'Seleccione un rango válido.'); return; }
    this.api.descargar('/cita/reporte-pdf', { fechaInicial: this.repDesde, fechaFinal: this.repHasta }, 'citas.pdf')
      .subscribe({ error: e => Mensajes.error(e) });
  }
}
