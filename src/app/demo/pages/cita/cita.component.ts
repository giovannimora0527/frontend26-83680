import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { BloqueoHorario } from 'src/app/models/bloqueo-horario';
import { Cita } from 'src/app/models/cita';
import { CitaRq } from 'src/app/models/cita-rq';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { ClienteService } from 'src/app/services/cliente.service';
import { confirmarAccion, mostrarAdvertencia, mostrarError, mostrarExito } from 'src/app/utils/mensajes-utils';
import { compararValores, estaEnRangoFechas, fechaHoy, nombreCompleto, normalizarTexto, textoEstado } from 'src/app/utils/tabla-utils';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { CitaService } from './service/cita.service';

export type TipoVistaCalendario = 'DIA' | 'SEMANA' | 'MES' | 'TABLA';
export type PerfilUsuarioCita = 'VETERINARIO' | 'SECRETARIA' | 'ADMINISTRADOR';

export interface DiaCalendarioMes {
  fechaStr: string;
  fecha: Date;
  numeroDia: number;
  esMesActual: boolean;
  esHoy: boolean;
  citas: Cita[];
  bloqueos: BloqueoHorario[];
}

export interface DiaSemanaHeader {
  fechaStr: string;
  fecha: Date;
  nombreCorto: string;
  numeroDia: number;
  mesCorto: string;
  esHoy: boolean;
}

@Component({
  selector: 'app-cita',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent {
  // Instancias de modales Bootstrap
  modalInstance: Modal | null = null;
  modalBloqueoInstance: Modal | null = null;
  modalHistorialInstance: Modal | null = null;

  titleModal = '';
  modoFormulario = '';
  titleBoton = '';

  // Perfiles soportados para filtrado y control de agenda
  readonly perfiles: Array<{ codigo: PerfilUsuarioCita; etiqueta: string; icono: string }> = [
    { codigo: 'VETERINARIO', etiqueta: 'Veterinario Autenticado', icono: 'fa-user-md' },
    { codigo: 'SECRETARIA', etiqueta: 'Secretaría / Recepción', icono: 'fa-headset' },
    { codigo: 'ADMINISTRADOR', etiqueta: 'Administrador', icono: 'fa-user-shield' }
  ];
  perfilActual: PerfilUsuarioCita = 'VETERINARIO';
  medicoAutenticadoId: number | null = null;
  filtroMedicoId: number | null = null;

  // Vista activa del calendario: DIA, SEMANA, MES o TABLA
  vistaCalendario: TipoVistaCalendario = 'SEMANA';
  fechaReferencia: string = fechaHoy();

  // Estados que maneja una cita. Una cita nueva solo puede iniciar en los tres primeros.
  readonly estados = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA'];
  readonly estadosIniciales = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA'];

  // Datos y filtros
  listCitas: Cita[] = [];
  listBloqueos: BloqueoHorario[] = [];
  terminoBusqueda = '';
  filtroEstado = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  campoOrden = 'fechaHora';
  ordenAscendente = false;
  paginaActual = 1;
  readonly registrosPorPagina = 8;

  cargando = false;
  guardando = false;
  exportandoExcel = false;
  guardandoBloqueo = false;
  cargandoHistorial = false;

  // Listas para combos dependientes
  listClientes: Cliente[] = [];
  listMascotas: Mascota[] = [];
  listMedicos: Medico[] = [];

  // Formularios
  form!: FormGroup;
  formBloqueo!: FormGroup;
  citaSelected: Cita | null = null;
  readonly fechaMinima = fechaHoy();

  // Estado del modal de Historial por Mascota
  clienteHistorialId: number | null = null;
  mascotaHistorialId: number | null = null;
  mascotasHistorialCliente: Mascota[] = [];
  mascotaHistorialSeleccionada: Mascota | null = null;
  citasHistorialMascota: Cita[] = [];

  // Funciones de utilidad expuestas a la plantilla
  readonly nombreCompleto = nombreCompleto;
  readonly textoEstado = textoEstado;

  private readonly nombresDiasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  private readonly nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoService,
    private readonly formBuilder: FormBuilder
  ) {
    this.restaurarContextoPerfil();
    this.inicializarFormularios();
    this.cargarCombos();
    this.listar();
    this.cargarBloqueos();
  }

  // Restaura el perfil activo desde localStorage para mantener la sesión simulada del usuario.
  private restaurarContextoPerfil() {
    const perfilGuardado = localStorage.getItem('clinica_perfil_cita') as PerfilUsuarioCita | null;
    if (perfilGuardado && ['VETERINARIO', 'SECRETARIA', 'ADMINISTRADOR'].includes(perfilGuardado)) {
      this.perfilActual = perfilGuardado;
    }
    const medicoGuardado = localStorage.getItem('clinica_medico_autenticado_id');
    if (medicoGuardado) {
      const parsed = Number(medicoGuardado);
      if (!Number.isNaN(parsed) && parsed > 0) {
        this.medicoAutenticadoId = parsed;
      }
    }
  }

  cambiarPerfil(nuevoPerfil: PerfilUsuarioCita) {
    this.perfilActual = nuevoPerfil;
    localStorage.setItem('clinica_perfil_cita', nuevoPerfil);

    if (nuevoPerfil === 'VETERINARIO') {
      if (!this.medicoAutenticadoId && this.listMedicos.length > 0) {
        this.medicoAutenticadoId = this.listMedicos[0].id ?? null;
      }
      this.filtroMedicoId = this.medicoAutenticadoId;
    }
    this.paginaActual = 1;
  }

  cambiarMedicoAutenticado(medicoId: number | null) {
    this.medicoAutenticadoId = medicoId;
    if (medicoId) {
      localStorage.setItem('clinica_medico_autenticado_id', String(medicoId));
    } else {
      localStorage.removeItem('clinica_medico_autenticado_id');
    }
    if (this.perfilActual === 'VETERINARIO') {
      this.filtroMedicoId = medicoId;
    }
    this.paginaActual = 1;
  }

  // Identificador del médico efectivamente filtrado según el perfil actual.
  get medicoEfectivoId(): number | null {
    return this.perfilActual === 'VETERINARIO' ? this.medicoAutenticadoId : this.filtroMedicoId;
  }

  get medicoEfectivoObj(): Medico | undefined {
    const id = this.medicoEfectivoId;
    return this.listMedicos.find((m) => m.id === id);
  }

  inicializarFormularios() {
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [null, Validators.required],
      medicoId: [null, Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      horaFin: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      estado: ['PENDIENTE', Validators.required]
    });

    // Cuando cambia el cliente se consultan únicamente sus mascotas.
    this.form.get('clienteId')?.valueChanges.subscribe((clienteId) => {
      this.cargarMascotasCliente(clienteId);
    });

    // Cuando cambia la hora de inicio, si la hora fin está vacía o es menor/igual, se sugiere +30 minutos.
    this.form.get('hora')?.valueChanges.subscribe((horaInicio: string) => {
      if (horaInicio) {
        const horaFinActual = this.form.get('horaFin')?.value;
        const sugerida = this.sumarMinutosHora(horaInicio, 30);
        if (!horaFinActual || horaFinActual <= horaInicio) {
          this.form.get('horaFin')?.setValue(sugerida, { emitEvent: false });
        }
      }
    });

    this.formBloqueo = this.formBuilder.group({
      medicoId: [null, Validators.required],
      fecha: [this.fechaMinima, Validators.required],
      horaInicio: ['12:00', Validators.required],
      horaFin: ['13:00', Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(250)]]
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  get fb(): { [key: string]: AbstractControl } {
    return this.formBloqueo.controls;
  }

  // Cliente y Mascota actualmente seleccionados en el modal para mostrar su ficha de datos básicos.
  get clienteFormularioObj(): Cliente | undefined {
    const id = this.form?.getRawValue()?.clienteId;
    if (this.citaSelected?.cliente && this.citaSelected.cliente.clienteId === id) {
      return this.citaSelected.cliente;
    }
    return this.listClientes.find((c) => c.clienteId === id);
  }

  get mascotaFormularioObj(): Mascota | undefined {
    const id = this.form?.getRawValue()?.mascotaId;
    if (this.citaSelected?.mascota && this.citaSelected.mascota.mascotaId === id) {
      return this.citaSelected.mascota;
    }
    return this.listMascotas.find((m) => m.mascotaId === id);
  }

  // Validación preventiva en tiempo real de disponibilidad y bloqueos en el modal de cita.
  get alertaConflictoFormulario(): string | null {
    if (!this.form || this.esCitaBloqueada(this.citaSelected)) {
      return null;
    }
    const raw = this.form.getRawValue();
    if (!raw.medicoId || !raw.fecha || !raw.hora || !raw.horaFin || raw.estado === 'CANCELADA') {
      return null;
    }
    if (raw.horaFin <= raw.hora) {
      return 'La hora de finalización debe ser posterior a la hora de inicio.';
    }

    const inicioSel = `${raw.fecha}T${raw.hora}:00`;
    const finSel = `${raw.fecha}T${raw.horaFin}:00`;

    // 1. Verificar contra bloqueos de horario del veterinario
    for (const b of this.listBloqueos) {
      const medId = b.medico?.id ?? b.medicoId;
      if (medId === Number(raw.medicoId) && b.activo !== false) {
        const bIni = String(b.fechaHoraInicio ?? '').substring(0, 19);
        const bFin = String(b.fechaHoraFin ?? '').substring(0, 19);
        if (bIni < finSel && bFin > inicioSel) {
          return `Horario bloqueado para este veterinario (${b.motivo}: ${bIni.substring(11, 16)} - ${bFin.substring(11, 16)}).`;
        }
      }
    }

    // 2. Verificar contra otras citas activas del mismo veterinario o mascota
    const minInicioSel = this.convertirFechaHoraAMinutos(raw.fecha, raw.hora);
    for (const c of this.listCitas) {
      if (this.citaSelected?.id && c.id === this.citaSelected.id) {
        continue;
      }
      if (c.estado?.toUpperCase() === 'CANCELADA') {
        continue;
      }
      const fechaC = this.obtenerFechaStr(c.fechaHora);
      if (fechaC !== raw.fecha) {
        continue;
      }
      const horaIniC = this.obtenerHoraStr(c.fechaHora);
      const horaFinC = this.obtenerHoraFinStr(c);
      const cIni = `${fechaC}T${horaIniC}:00`;
      const cFin = `${fechaC}T${horaFinC}:00`;
      const minIniC = this.convertirFechaHoraAMinutos(fechaC, horaIniC);

      const solapaRango = cIni < finSel && cFin > inicioSel;
      const dentroMargen15 = Math.abs(minIniC - minInicioSel) <= 15;

      if (c.medico?.id === Number(raw.medicoId) && (solapaRango || dentroMargen15)) {
        return `El veterinario ya tiene una cita en ese horario (${horaIniC} - ${horaFinC}, paciente: ${c.mascota?.nombreMascota ?? ''}).`;
      }
      if (raw.mascotaId && c.mascota?.mascotaId === Number(raw.mascotaId) && (solapaRango || dentroMargen15)) {
        return `La mascota seleccionada ya tiene otra cita programada en ese horario (${horaIniC} - ${horaFinC}).`;
      }
    }

    return null;
  }

  // Líneas desglosadas del seguimiento de cambios de la cita seleccionada
  get lineasHistorialCambios(): string[] {
    const raw = this.citaSelected?.historialCambios;
    if (!raw || !raw.trim()) {
      return [];
    }
    return raw.split('\n').filter((l) => l.trim().length > 0);
  }

  /**
   * Citas filtradas por el perfil/veterinario activo, estado, rango de fechas y término de búsqueda.
   */
  get citasFiltradas(): Cita[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());
    const medicoFiltro = this.medicoEfectivoId;

    const filtradas = this.listCitas.filter((cita) => {
      if (medicoFiltro && cita.medico?.id !== Number(medicoFiltro)) {
        return false;
      }
      if (this.filtroEstado && this.normalizarEstadoVista(cita.estado) !== this.filtroEstado) {
        return false;
      }
      if (!estaEnRangoFechas(cita.fechaHora, this.filtroFechaDesde, this.filtroFechaHasta)) {
        return false;
      }
      if (!termino) {
        return true;
      }

      const valores = [
        cita.motivo,
        cita.estado,
        nombreCompleto(cita.cliente),
        cita.cliente?.numeroDocumento,
        cita.mascota?.nombreMascota,
        cita.mascota?.raza?.nombre,
        nombreCompleto(cita.medico)
      ];

      return valores.some((valor) =>
        normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return filtradas.sort((a, b) =>
      compararValores(this.valorOrden(a), this.valorOrden(b), this.ordenAscendente)
    );
  }

  /**
   * Bloqueos filtrados por el veterinario activo.
   */
  get bloqueosFiltrados(): BloqueoHorario[] {
    const medicoFiltro = this.medicoEfectivoId;
    return this.listBloqueos.filter((b) => {
      if (b.activo === false) {
        return false;
      }
      const medId = b.medico?.id ?? b.medicoId;
      if (medicoFiltro && medId !== Number(medicoFiltro)) {
        return false;
      }
      return true;
    });
  }

  // Contadores KPI por estado (sobre las citas del veterinario activo y rango de fechas)
  private get citasBasePerfil(): Cita[] {
    const medicoFiltro = this.medicoEfectivoId;
    return this.listCitas.filter((cita) => {
      if (medicoFiltro && cita.medico?.id !== Number(medicoFiltro)) {
        return false;
      }
      if (!estaEnRangoFechas(cita.fechaHora, this.filtroFechaDesde, this.filtroFechaHasta)) {
        return false;
      }
      return true;
    });
  }

  contarPorEstado(estado: string): number {
    return this.citasBasePerfil.filter((c) => this.normalizarEstadoVista(c.estado) === estado).length;
  }

  filtrarRapidoEstado(estado: string) {
    this.filtroEstado = this.filtroEstado === estado ? '' : estado;
    this.paginaActual = 1;
  }

  // Paginación para la vista de Tabla
  get citasPaginadas(): Cita[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.citasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.citasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  // =========================================================================
  // LÓGICA DE CALENDARIO (DÍA, SEMANA, MES)
  // =========================================================================

  cambiarVista(vista: TipoVistaCalendario) {
    this.vistaCalendario = vista;
  }

  irAHoy() {
    this.fechaReferencia = fechaHoy();
  }

  navegarPeriodo(direccion: -1 | 1) {
    const actual = this.parsearFechaLocal(this.fechaReferencia);
    if (this.vistaCalendario === 'DIA') {
      actual.setDate(actual.getDate() + direccion);
    } else if (this.vistaCalendario === 'SEMANA') {
      actual.setDate(actual.getDate() + direccion * 7);
    } else {
      actual.setMonth(actual.getMonth() + direccion);
    }
    this.fechaReferencia = this.formatearFechaDate(actual);
  }

  get tituloPeriodoCalendario(): string {
    const fecha = this.parsearFechaLocal(this.fechaReferencia);
    if (this.vistaCalendario === 'DIA') {
      const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fecha.getDay()];
      return `${diaSemana}, ${fecha.getDate()} de ${this.nombresMeses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
    }
    if (this.vistaCalendario === 'SEMANA') {
      const dias = this.diasSemanaActual;
      const primero = dias[0];
      const ultimo = dias[6];
      if (primero.fecha.getMonth() === ultimo.fecha.getMonth()) {
        return `Semana del ${primero.numeroDia} al ${ultimo.numeroDia} de ${this.nombresMeses[primero.fecha.getMonth()]} ${primero.fecha.getFullYear()}`;
      }
      return `Semana del ${primero.numeroDia} ${primero.mesCorto} al ${ultimo.numeroDia} ${ultimo.mesCorto} ${ultimo.fecha.getFullYear()}`;
    }
    return `${this.nombresMeses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
  }

  // Franjas horarias de 30 minutos para las vistas Día y Semana (07:00 a 19:00, ampliable)
  get franjasHorarias(): string[] {
    let horaMin = 7;
    let horaMax = 19;

    for (const c of this.citasFiltradas) {
      const h = Number(this.obtenerHoraStr(c.fechaHora).substring(0, 2));
      if (!Number.isNaN(h)) {
        if (h < horaMin) horaMin = h;
        if (h > horaMax) horaMax = h;
      }
    }

    const franjas: string[] = [];
    for (let h = horaMin; h <= horaMax; h++) {
      const hh = String(h).padStart(2, '0');
      franjas.push(`${hh}:00`);
      franjas.push(`${hh}:30`);
    }
    return franjas;
  }

  // Días de la semana activa (Lunes a Domingo)
  get diasSemanaActual(): DiaSemanaHeader[] {
    const base = this.parsearFechaLocal(this.fechaReferencia);
    const diaSemana = base.getDay(); // 0=Dom, 1=Lun ...
    const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    const lunes = new Date(base.getFullYear(), base.getMonth(), base.getDate() + diffLunes);
    const hoyStr = fechaHoy();

    const dias: DiaSemanaHeader[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i);
      const dStr = this.formatearFechaDate(d);
      dias.push({
        fechaStr: dStr,
        fecha: d,
        nombreCorto: this.nombresDiasSemana[d.getDay()],
        numeroDia: d.getDate(),
        mesCorto: this.nombresMeses[d.getMonth()].substring(0, 3),
        esHoy: dStr === hoyStr
      });
    }
    return dias;
  }

  // Cuadrícula de días para la vista Mes (42 celdas, empezando en Lunes)
  get semanasMesActual(): DiaCalendarioMes[][] {
    const base = this.parsearFechaLocal(this.fechaReferencia);
    const anio = base.getFullYear();
    const mes = base.getMonth();
    const primerDiaMes = new Date(anio, mes, 1);
    const diaSemanaPrimero = primerDiaMes.getDay();
    const offsetLunes = diaSemanaPrimero === 0 ? 6 : diaSemanaPrimero - 1;

    const fechaInicioGrilla = new Date(anio, mes, 1 - offsetLunes);
    const hoyStr = fechaHoy();
    const semanas: DiaCalendarioMes[][] = [];

    for (let sem = 0; sem < 6; sem++) {
      const fila: DiaCalendarioMes[] = [];
      for (let d = 0; d < 7; d++) {
        const fechaCelda = new Date(
          fechaInicioGrilla.getFullYear(),
          fechaInicioGrilla.getMonth(),
          fechaInicioGrilla.getDate() + sem * 7 + d
        );
        const fStr = this.formatearFechaDate(fechaCelda);
        fila.push({
          fechaStr: fStr,
          fecha: fechaCelda,
          numeroDia: fechaCelda.getDate(),
          esMesActual: fechaCelda.getMonth() === mes,
          esHoy: fStr === hoyStr,
          citas: this.obtenerCitasDeFecha(fStr),
          bloqueos: this.obtenerBloqueosDeFecha(fStr)
        });
      }
      semanas.push(fila);
    }
    return semanas;
  }

  obtenerCitasDeFecha(fechaStr: string): Cita[] {
    return this.citasFiltradas
      .filter((c) => this.obtenerFechaStr(c.fechaHora) === fechaStr)
      .sort((a, b) => this.obtenerHoraStr(a.fechaHora).localeCompare(this.obtenerHoraStr(b.fechaHora)));
  }

  obtenerBloqueosDeFecha(fechaStr: string): BloqueoHorario[] {
    return this.bloqueosFiltrados.filter(
      (b) => this.obtenerFechaStr(b.fechaHoraInicio) <= fechaStr && this.obtenerFechaStr(b.fechaHoraFin) >= fechaStr
    );
  }

  // Obtiene las citas que inician dentro de una franja de 30 minutos [franja, franja + 29 min]
  obtenerCitasEnFranja(fechaStr: string, franjaHora: string): Cita[] {
    const minFranja = this.convertirHoraAMinutos(franjaHora);
    return this.citasFiltradas.filter((c) => {
      if (this.obtenerFechaStr(c.fechaHora) !== fechaStr) {
        return false;
      }
      const minCita = this.convertirHoraAMinutos(this.obtenerHoraStr(c.fechaHora));
      return minCita >= minFranja && minCita < minFranja + 30;
    });
  }

  // Obtiene los bloqueos activos que cubren una franja horaria determinada
  obtenerBloqueosEnFranja(fechaStr: string, franjaHora: string): BloqueoHorario[] {
    const instanteFranja = `${fechaStr}T${franjaHora}:00`;
    const instanteFinFranja = `${fechaStr}T${this.sumarMinutosHora(franjaHora, 30)}:00`;
    return this.bloqueosFiltrados.filter((b) => {
      const bIni = String(b.fechaHoraInicio ?? '').substring(0, 19);
      const bFin = String(b.fechaHoraFin ?? '').substring(0, 19);
      return bIni < instanteFinFranja && bFin > instanteFranja;
    });
  }

  // Abre el modal de creación pre-llenando la fecha, hora clicada y el veterinario activo
  agendarEnFranja(fechaStr: string, horaInicio: string = '09:00') {
    if (fechaStr < this.fechaMinima) {
      mostrarAdvertencia('Fecha pasada', 'Solo se pueden agendar citas nuevas a partir de la fecha actual.');
      return;
    }
    const bloqueos = this.obtenerBloqueosEnFranja(fechaStr, horaInicio);
    if (bloqueos.length > 0 && this.medicoEfectivoId) {
      mostrarAdvertencia(
        'Horario bloqueado',
        `El veterinario tiene un bloqueo en esta franja (${bloqueos[0].motivo}).`
      );
      return;
    }

    this.citaSelected = null;
    this.resetFormulario();
    this.form.patchValue({
      fecha: fechaStr,
      hora: horaInicio,
      horaFin: this.sumarMinutosHora(horaInicio, 30),
      medicoId: this.medicoEfectivoId ?? null,
      estado: 'PENDIENTE'
    }, { emitEvent: false });

    if (this.perfilActual === 'VETERINARIO' && this.medicoAutenticadoId) {
      this.form.get('medicoId')?.setValue(this.medicoAutenticadoId, { emitEvent: false });
    }
    this.openModal('C');
  }

  irADiaDesdeCalendario(fechaStr: string) {
    this.fechaReferencia = fechaStr;
    this.vistaCalendario = 'DIA';
  }

  // =========================================================================
  // SERVICIOS Y OPERACIONES CRUD DE CITAS
  // =========================================================================

  listar() {
    this.cargando = true;
    this.citaService.listar().subscribe({
      next: (data) => {
        this.listCitas = data ?? [];
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        mostrarError(error);
      }
    });
  }

  cargarBloqueos() {
    this.citaService.listarBloqueos().subscribe({
      next: (data) => {
        this.listBloqueos = data ?? [];
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  cargarCombos() {
    this.clienteService.listar().subscribe({
      next: (data) => (this.listClientes = data ?? []),
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
    this.medicoService.listar().subscribe({
      next: (data) => {
        this.listMedicos = data ?? [];
        if (!this.medicoAutenticadoId && this.listMedicos.length > 0) {
          this.medicoAutenticadoId = this.listMedicos[0].id ?? null;
          if (this.medicoAutenticadoId) {
            localStorage.setItem('clinica_medico_autenticado_id', String(this.medicoAutenticadoId));
          }
        }
        if (this.perfilActual === 'VETERINARIO') {
          this.filtroMedicoId = this.medicoAutenticadoId;
        }
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  cargarMascotasCliente(clienteId: number | null) {
    this.listMascotas = [];
    this.form.get('mascotaId')?.setValue(null, { emitEvent: false });
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (data) => (this.listMascotas = data ?? []),
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  aplicarFiltros() {
    this.paginaActual = 1;
    if (this.filtroFechaDesde) {
      this.fechaReferencia = this.filtroFechaDesde;
    }
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    if (this.perfilActual !== 'VETERINARIO') {
      this.filtroMedicoId = null;
    }
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

  // Clases de color por estado para badges y tarjetas del calendario
  claseEstado(estado?: string): string {
    switch (this.normalizarEstadoVista(estado)) {
      case 'PENDIENTE':
        return 'bg-warning text-dark';
      case 'PROGRAMADA':
        return 'bg-info text-dark';
      case 'CONFIRMADA':
        return 'bg-primary text-white';
      case 'ATENDIDA':
        return 'bg-success text-white';
      case 'CANCELADA':
        return 'bg-danger text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  claseTarjetaCalendario(estado?: string): string {
    switch (this.normalizarEstadoVista(estado)) {
      case 'PENDIENTE':
        return 'cita-card-pendiente';
      case 'PROGRAMADA':
        return 'cita-card-programada';
      case 'CONFIRMADA':
        return 'cita-card-confirmada';
      case 'ATENDIDA':
        return 'cita-card-atendida';
      case 'CANCELADA':
        return 'cita-card-cancelada';
      default:
        return 'cita-card-default';
    }
  }

  esCitaBloqueada(cita: Cita | null): boolean {
    const estado = this.normalizarEstadoVista(cita?.estado);
    return estado === 'ATENDIDA' || estado === 'CANCELADA';
  }

  nuevaCita(modo: string) {
    this.citaSelected = null;
    this.resetFormulario();
    const fechaPreseleccionada = this.fechaReferencia >= this.fechaMinima ? this.fechaReferencia : this.fechaMinima;
    this.form.patchValue({
      fecha: fechaPreseleccionada,
      hora: '09:00',
      horaFin: '09:30',
      medicoId: this.medicoEfectivoId ?? null,
      estado: 'PENDIENTE'
    }, { emitEvent: false });
    this.openModal(modo);
  }

  resetFormulario() {
    this.form.enable({ emitEvent: false });
    this.form.reset({ estado: 'PENDIENTE' }, { emitEvent: false });
    this.listMascotas = [];
  }

  abrirEdicion(cita: Cita, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!cita.id) {
      return;
    }
    this.citaService.consultar(cita.id).subscribe({
      next: (data) => {
        this.citaSelected = data;
        this.resetFormulario();

        // En la edición el cliente y la mascota no cambian
        this.listMascotas = data.mascota ? [data.mascota] : [];
        const horaInicio = this.obtenerHoraStr(data.fechaHora);
        const horaFin = this.obtenerHoraFinStr(data);

        this.form.patchValue({
          clienteId: data.cliente?.clienteId,
          mascotaId: data.mascota?.mascotaId,
          medicoId: data.medico?.id,
          fecha: this.obtenerFechaStr(data.fechaHora),
          hora: horaInicio,
          horaFin: horaFin,
          motivo: data.motivo,
          estado: this.normalizarEstadoVista(data.estado)
        }, { emitEvent: false });
        this.form.get('clienteId')?.disable({ emitEvent: false });
        this.form.get('mascotaId')?.disable({ emitEvent: false });

        if (this.esCitaBloqueada(data)) {
          this.form.disable({ emitEvent: false });
        }
        this.openModal('E');
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      mostrarAdvertencia('Campos obligatorios', 'Por favor diligencie todos los campos marcados con *.');
      return;
    }

    const datos = this.form.getRawValue();
    if (datos.horaFin <= datos.hora) {
      mostrarAdvertencia('Horario no válido', 'La hora de finalización debe ser posterior a la hora de inicio.');
      return;
    }

    const fechaHora = `${datos.fecha}T${datos.hora}:00`;
    const fechaHoraFin = `${datos.fecha}T${datos.horaFin}:00`;
    if (this.modoFormulario === 'C' && new Date(fechaHora) < new Date()) {
      mostrarAdvertencia('Fecha no válida', 'No se pueden registrar citas en fechas anteriores a la fecha actual.');
      return;
    }

    const citaRq: CitaRq = {
      citaId: this.citaSelected?.id,
      clienteId: datos.clienteId,
      mascotaId: datos.mascotaId,
      medicoId: datos.medicoId,
      fechaHora: fechaHora,
      fechaHoraFin: fechaHoraFin,
      estado: datos.estado,
      motivo: datos.motivo,
      usuarioCambio: this.etiquetaUsuarioActual()
    };

    this.guardando = true;
    const peticion = this.modoFormulario === 'C'
      ? this.citaService.guardar(citaRq)
      : this.citaService.actualizar(citaRq);

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

  // Acción rápida para marcar una cita como ATENDIDA desde el modal o la tabla
  marcarComoAtendida(cita: Cita | null, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!cita?.id) {
      return;
    }
    confirmarAccion(
      'Marcar cita como atendida',
      `¿Confirmar que la consulta de ${cita.mascota?.nombreMascota ?? 'la mascota'} con Dr(a). ${nombreCompleto(cita.medico)} fue atendida?`
    ).then((confirmado) => {
      if (!confirmado || !cita.id) {
        return;
      }
      this.citaService.atender(cita.id, this.etiquetaUsuarioActual()).subscribe({
        next: (respuesta) => {
          mostrarExito(respuesta.message);
          this.closeModal();
          this.listar();
        },
        error: (error: HttpErrorResponse) => mostrarError(error)
      });
    });
  }

  reactivarCita(cita: Cita | null, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!cita?.id) {
      return;
    }
    confirmarAccion(
      'Reactivar cita',
      `¿Desea reactivar la cita de ${cita.mascota?.nombreMascota}? Quedará en estado Pendiente.`
    ).then((confirmado) => {
      if (!confirmado || !cita.id) {
        return;
      }
      this.citaService.reactivar(cita.id).subscribe({
        next: (respuesta) => {
          mostrarExito(respuesta.message);
          this.closeModal();
          this.listar();
        },
        error: (error: HttpErrorResponse) => mostrarError(error)
      });
    });
  }

  // =========================================================================
  // EXPORTACIÓN A EXCEL (.XLSX)
  // =========================================================================

  exportarReporteExcel() {
    if (this.filtroFechaDesde && this.filtroFechaHasta && this.filtroFechaDesde > this.filtroFechaHasta) {
      mostrarAdvertencia('Rango de fechas inválido', 'La fecha inicial no puede ser mayor que la fecha final.');
      return;
    }

    const fechaInicial = this.filtroFechaDesde ? `${this.filtroFechaDesde}T00:00:00` : undefined;
    const fechaFinal = this.filtroFechaHasta ? `${this.filtroFechaHasta}T23:59:59` : undefined;

    this.exportandoExcel = true;
    this.citaService.exportarExcel({
      medicoId: this.medicoEfectivoId,
      fechaInicial,
      fechaFinal,
      estado: this.filtroEstado || undefined
    }).subscribe({
      next: (blob: Blob) => {
        this.exportandoExcel = false;
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        const sufijoMedico = this.medicoEfectivoObj
          ? `_${normalizarTexto(nombreCompleto(this.medicoEfectivoObj)).replace(/\s+/g, '_')}`
          : '_todos';
        enlace.href = url;
        enlace.download = `reporte_citas${sufijoMedico}_${fechaHoy()}.xlsx`;
        enlace.click();
        window.URL.revokeObjectURL(url);
        mostrarExito('Reporte Excel generado y descargado correctamente.');
      },
      error: (error: HttpErrorResponse) => {
        this.exportandoExcel = false;
        mostrarError(error);
      }
    });
  }

  // =========================================================================
  // GESTIÓN DE BLOQUEOS DE HORARIO
  // =========================================================================

  abrirModalBloqueos() {
    this.formBloqueo.reset({
      medicoId: this.medicoEfectivoId ?? (this.listMedicos[0]?.id ?? null),
      fecha: this.fechaReferencia >= this.fechaMinima ? this.fechaReferencia : this.fechaMinima,
      horaInicio: '12:00',
      horaFin: '13:00',
      motivo: ''
    });
    const el = document.getElementById('modalBloqueosHorario');
    if (el) {
      this.modalBloqueoInstance ??= new Modal(el);
      this.modalBloqueoInstance.show();
    }
  }

  cerrarModalBloqueos() {
    this.modalBloqueoInstance?.hide();
  }

  guardarBloqueoHorario() {
    if (this.formBloqueo.invalid) {
      this.formBloqueo.markAllAsTouched();
      mostrarAdvertencia('Datos incompletos', 'Complete el veterinario, fecha, hora inicio, hora fin y motivo del bloqueo.');
      return;
    }
    const val = this.formBloqueo.getRawValue();
    if (val.horaFin <= val.horaInicio) {
      mostrarAdvertencia('Horario inválido', 'La hora de fin del bloqueo debe ser posterior a la hora de inicio.');
      return;
    }

    const rq: BloqueoHorario = {
      medicoId: Number(val.medicoId),
      fechaHoraInicio: `${val.fecha}T${val.horaInicio}:00`,
      fechaHoraFin: `${val.fecha}T${val.horaFin}:00`,
      motivo: val.motivo
    };

    this.guardandoBloqueo = true;
    this.citaService.guardarBloqueo(rq).subscribe({
      next: (res) => {
        this.guardandoBloqueo = false;
        mostrarExito(res.message);
        this.formBloqueo.patchValue({ motivo: '' });
        this.cargarBloqueos();
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoBloqueo = false;
        mostrarError(error);
      }
    });
  }

  eliminarBloqueoHorario(bloqueo: BloqueoHorario) {
    if (!bloqueo.id) {
      return;
    }
    confirmarAccion(
      'Eliminar bloqueo de horario',
      `¿Desea liberar el bloqueo "${bloqueo.motivo}" de Dr(a). ${nombreCompleto(bloqueo.medico)}?`
    ).then((confirmado) => {
      if (!confirmado || !bloqueo.id) {
        return;
      }
      this.citaService.inactivarBloqueo(bloqueo.id).subscribe({
        next: (res) => {
          mostrarExito(res.message);
          this.cargarBloqueos();
        },
        error: (error: HttpErrorResponse) => mostrarError(error)
      });
    });
  }

  // =========================================================================
  // HISTORIAL DE CITAS POR MASCOTA
  // =========================================================================

  abrirModalHistorialMascota(mascota?: Mascota, cliente?: Cliente, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (mascota?.mascotaId) {
      this.clienteHistorialId = cliente?.clienteId ?? mascota.cliente?.clienteId ?? null;
      this.mascotaHistorialSeleccionada = mascota;
      this.mascotaHistorialId = mascota.mascotaId;
      if (this.clienteHistorialId) {
        this.mascotaService.listarPorCliente(this.clienteHistorialId).subscribe({
          next: (lista) => (this.mascotasHistorialCliente = lista ?? [])
        });
      } else {
        this.mascotasHistorialCliente = [mascota];
      }
      this.consultarHistorialMascota(mascota.mascotaId);
    } else {
      this.clienteHistorialId = null;
      this.mascotaHistorialId = null;
      this.mascotasHistorialCliente = [];
      this.mascotaHistorialSeleccionada = null;
      this.citasHistorialMascota = [];
    }

    const el = document.getElementById('modalHistorialMascota');
    if (el) {
      this.modalHistorialInstance ??= new Modal(el);
      this.modalHistorialInstance.show();
    }
  }

  cerrarModalHistorialMascota() {
    this.modalHistorialInstance?.hide();
  }

  alCambiarClienteHistorial(clienteId: number | null) {
    this.mascotaHistorialId = null;
    this.mascotaHistorialSeleccionada = null;
    this.citasHistorialMascota = [];
    this.mascotasHistorialCliente = [];
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (data) => (this.mascotasHistorialCliente = data ?? []),
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  alCambiarMascotaHistorial(mascotaId: number | null) {
    this.citasHistorialMascota = [];
    if (!mascotaId) {
      this.mascotaHistorialSeleccionada = null;
      return;
    }
    this.mascotaHistorialSeleccionada =
      this.mascotasHistorialCliente.find((m) => m.mascotaId === Number(mascotaId)) ?? null;
    this.consultarHistorialMascota(Number(mascotaId));
  }

  private consultarHistorialMascota(mascotaId: number) {
    this.cargandoHistorial = true;
    this.citaService.listarPorMascota(mascotaId).subscribe({
      next: (citas) => {
        this.citasHistorialMascota = citas ?? [];
        this.cargandoHistorial = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoHistorial = false;
        mostrarError(error);
      }
    });
  }

  // =========================================================================
  // UTILIDADES DE FORMATO Y FECHAS
  // =========================================================================

  closeModal() {
    this.modalInstance?.hide();
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Registrar Nueva Cita Médica' : 'Detalle y Gestión de Cita Médica';
    this.titleBoton = modo === 'C' ? 'Guardar Cita' : 'Actualizar Cita';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearCita');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  obtenerFechaStr(fechaHora?: Date | string): string {
    return String(fechaHora ?? '').substring(0, 10);
  }

  obtenerHoraStr(fechaHora?: Date | string): string {
    return String(fechaHora ?? '').substring(11, 16);
  }

  obtenerHoraFinStr(cita: Cita): string {
    if (cita.fechaHoraFin) {
      return String(cita.fechaHoraFin).substring(11, 16);
    }
    const horaIni = this.obtenerHoraStr(cita.fechaHora);
    return horaIni ? this.sumarMinutosHora(horaIni, 30) : '';
  }

  sumarMinutosHora(hora: string, minutosAgregar: number): string {
    const partes = hora.split(':');
    if (partes.length < 2) {
      return hora;
    }
    const totalMin = Number(partes[0]) * 60 + Number(partes[1]) + minutosAgregar;
    const minLimitado = Math.min(totalMin, 23 * 60 + 59);
    const hh = String(Math.floor(minLimitado / 60)).padStart(2, '0');
    const mm = String(minLimitado % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private convertirHoraAMinutos(hora: string): number {
    const partes = hora.split(':');
    if (partes.length < 2) {
      return 0;
    }
    return Number(partes[0]) * 60 + Number(partes[1]);
  }

  private convertirFechaHoraAMinutos(fecha: string, hora: string): number {
    const d = this.parsearFechaLocal(fecha);
    return Math.floor(d.getTime() / 60000) + this.convertirHoraAMinutos(hora);
  }

  private parsearFechaLocal(fechaStr: string): Date {
    const partes = (fechaStr || fechaHoy()).split('-').map(Number);
    return new Date(partes[0], (partes[1] || 1) - 1, partes[2] || 1);
  }

  private formatearFechaDate(d: Date): string {
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private normalizarEstadoVista(estado?: string): string {
    const limpio = (estado ?? '').trim().toUpperCase();
    return limpio === 'FINALIZADA' ? 'ATENDIDA' : limpio;
  }

  private etiquetaUsuarioActual(): string {
    if (this.perfilActual === 'VETERINARIO' && this.medicoEfectivoObj) {
      return `Veterinario: Dr(a). ${nombreCompleto(this.medicoEfectivoObj)}`;
    }
    return `Perfil: ${this.perfilActual}`;
  }

  private valorOrden(cita: Cita): string | number | undefined {
    switch (this.campoOrden) {
      case 'hora':
        return this.obtenerHoraStr(cita.fechaHora);
      case 'cliente':
        return nombreCompleto(cita.cliente);
      case 'mascota':
        return cita.mascota?.nombreMascota;
      case 'medico':
        return nombreCompleto(cita.medico);
      case 'estado':
        return cita.estado;
      default:
        return String(cita.fechaHora ?? '');
    }
  }
}
