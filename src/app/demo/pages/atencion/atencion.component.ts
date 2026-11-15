import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { FacturacionService } from 'src/app/services/facturacion.service';
import { AgendaAtencion, Atencion, AtencionRq, Servicio } from 'src/app/models/facturacion';
import { claseEstadoDespacho, textoEstadoDespacho } from 'src/app/models/formula';
import { descargarArchivo } from 'src/app/utils/archivos';
import { hoyIso } from 'src/app/utils/fechas';
import { avisar, confirmar, mostrarError, notificarExito } from 'src/app/utils/mensajes';

/**
 * Atención médica de las citas del veterinario de la sesión.
 *
 * A la izquierda la agenda del día (y las atenciones abiertas de días
 * anteriores); a la derecha la atención elegida: datos del paciente y del
 * propietario, antecedentes, registro clínico (motivo, síntomas, diagnóstico,
 * observaciones y recomendaciones), servicios prestados con su tarifa,
 * fórmulas de la atención, prefactura en PDF y finalización. Se puede llegar
 * desde el calendario con ?citaId=.
 */
@Component({
  selector: 'app-atencion',
  imports: [CommonModule, FormsModule],
  templateUrl: './atencion.component.html'
})
export class AtencionComponent implements OnInit {
  /** Texto y clase del estado de despacho de una fórmula. */
  readonly textoDespacho = textoEstadoDespacho;
  readonly claseDespacho = claseEstadoDespacho;

  /** Día de la agenda. */
  fecha = hoyIso();
  /** Agenda del día. */
  agenda: AgendaAtencion[] = [];
  /** Indica que se está cargando la agenda. */
  cargandoAgenda = false;

  /** Atención abierta en el panel. */
  atencion: Atencion | null = null;
  /** Datos clínicos en edición. */
  datos: AtencionRq = { motivo: '', sintomas: '', diagnostico: '', observaciones: '', recomendaciones: '' };
  /** Indica que hay cambios sin guardar. */
  sinGuardar = false;
  /** Servicios activos para agregar. */
  servicios: Servicio[] = [];
  /** Servicio elegido para agregar. */
  servicioNuevo: number | null = null;
  /** Cantidad del servicio a agregar. */
  cantidadNueva = 1;
  /** Indica que se está procesando una acción. */
  procesando = false;

  /**
   * @param facturacion servicio de atención y tarifas.
   * @param route ruta activa (para ?citaId=).
   * @param router enrutador.
   */
  constructor(
    private readonly facturacion: FacturacionService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) { }

  /** Carga la agenda, los servicios y la cita recibida por URL. */
  ngOnInit(): void {
    this.cargarAgenda();
    this.facturacion.servicios(true).subscribe({ next: (s) => (this.servicios = s) });
    const citaId = Number(this.route.snapshot.queryParamMap.get('citaId'));
    if (citaId) {
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      this.iniciar(citaId);
    }
  }

  /** Indica si la atención está abierta (editable). */
  get abierta(): boolean {
    return this.atencion?.estado === 'ABIERTA';
  }

  /** Servicios que aún no están en la atención. */
  get serviciosDisponibles(): Servicio[] {
    const usados = new Set(this.atencion?.servicios.map((s) => s.servicioId) ?? []);
    const tieneConsulta = this.atencion?.servicios.some((s) => this.servicios.find((x) => x.servicioId === s.servicioId)?.tipo === 'CONSULTA');
    return this.servicios.filter((s) => !usados.has(s.servicioId) && !(tieneConsulta && s.tipo === 'CONSULTA'));
  }

  /** Campos obligatorios que faltan para finalizar. */
  get faltantes(): string[] {
    const f: string[] = [];
    if (!this.datos.motivo.trim()) f.push('motivo');
    if (!this.datos.sintomas.trim()) f.push('síntomas');
    if (!this.datos.diagnostico.trim()) f.push('diagnóstico');
    if (!this.atencion?.servicios.length) f.push('al menos un servicio');
    if (this.atencion?.formulas.some((x) => x.estado === 'BORRADOR')) f.push('confirmar o anular las fórmulas en borrador');
    return f;
  }

  // ===================== Agenda =====================

  /** Consulta la agenda del día elegido. */
  cargarAgenda(): void {
    this.cargandoAgenda = true;
    this.facturacion.agenda(this.fecha).subscribe({
      next: (data) => {
        this.agenda = data;
        this.cargandoAgenda = false;
      },
      error: (e: HttpErrorResponse) => {
        this.cargandoAgenda = false;
        mostrarError(e, 'No se pudo cargar la agenda');
      }
    });
  }

  /** Cambia el día de la agenda. */
  moverDia(dias: number): void {
    const d = new Date(`${this.fecha}T12:00:00`);
    d.setDate(d.getDate() + dias);
    this.fecha = d.toISOString().slice(0, 10);
    this.cargarAgenda();
  }

  /** Inicia o abre la atención de una cita. */
  async abrir(item: AgendaAtencion): Promise<void> {
    if (this.atencion && this.sinGuardar && this.abierta) {
      const ok = await confirmar('Hay cambios sin guardar', 'Si cambia de atención se perderán los cambios.', 'Cambiar de todos modos');
      if (!ok) {
        return;
      }
    }
    if (item.historiaId) {
      this.cargar(item.historiaId);
    } else {
      const ok = await confirmar('¿Iniciar la atención?',
        `${item.mascotaNombre} (${item.clienteNombre}). Se abrirá la historia clínica y se registrará la consulta con su tarifa.`,
        'Sí, iniciar');
      if (ok) {
        this.iniciar(item.citaId);
      }
    }
  }

  /** Inicia la atención de una cita. */
  private iniciar(citaId: number): void {
    this.procesando = true;
    this.facturacion.iniciarAtencion(citaId).subscribe({
      next: (a) => {
        this.procesando = false;
        this.mostrar(a);
        this.cargarAgenda();
      },
      error: (e: HttpErrorResponse) => {
        this.procesando = false;
        mostrarError(e, 'No se pudo iniciar la atención');
      }
    });
  }

  /**
   * Consulta una atención por su historia.
   *
   * @param historiaId atención.
   * @param conservarDatos si se conservan los datos clínicos escritos y aún no guardados
   *                       (al agregar o quitar servicios de la misma atención).
   */
  cargar(historiaId: number, conservarDatos = false): void {
    this.facturacion.atencion(historiaId).subscribe({
      next: (a) => this.mostrar(a, conservarDatos && this.atencion?.historiaId === historiaId),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo consultar la atención')
    });
  }

  /** Muestra la atención en el panel. */
  private mostrar(a: Atencion, conservarDatos = false): void {
    this.atencion = a;
    this.servicioNuevo = null;
    this.cantidadNueva = 1;
    if (conservarDatos) {
      return;
    }
    this.datos = {
      motivo: a.motivo ?? '', sintomas: a.sintomas ?? '', diagnostico: a.diagnostico ?? '',
      observaciones: a.observaciones ?? '', recomendaciones: a.recomendaciones ?? ''
    };
    this.sinGuardar = false;
    this.servicioNuevo = null;
    this.cantidadNueva = 1;
  }

  // ===================== Acciones =====================

  /** Guarda los datos clínicos. */
  guardar(despues?: () => void): void {
    if (!this.atencion || this.procesando) {
      return;
    }
    if (!this.datos.motivo.trim()) {
      avisar('Motivo requerido', 'Escriba el motivo de la consulta.', 'warning');
      return;
    }
    this.procesando = true;
    this.facturacion.guardarAtencion(this.atencion.historiaId, this.datos).subscribe({
      next: (r) => {
        this.procesando = false;
        this.sinGuardar = false;
        if (despues) {
          despues();
        } else {
          notificarExito(r.message);
        }
      },
      error: (e: HttpErrorResponse) => {
        this.procesando = false;
        mostrarError(e, 'No se pudo guardar la atención');
      }
    });
  }

  /** Agrega el servicio elegido. */
  agregarServicio(): void {
    if (!this.atencion || !this.servicioNuevo) {
      return;
    }
    const cantidad = Number(this.cantidadNueva);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 100) {
      avisar('Cantidad inválida', 'La cantidad debe ser un entero entre 1 y 100.', 'warning');
      return;
    }
    this.facturacion.agregarServicio(this.atencion.historiaId, this.servicioNuevo, cantidad).subscribe({
      next: () => this.cargar(this.atencion!.historiaId, true),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo agregar el servicio')
    });
  }

  /** Quita un servicio. */
  async quitarServicio(atencionServicioId: number | null, nombre: string): Promise<void> {
    if (!this.atencion || !atencionServicioId) {
      return;
    }
    const ok = await confirmar(`¿Quitar ${nombre}?`, 'No se cobrará en esta atención.', 'Sí, quitar');
    if (!ok) {
      return;
    }
    this.facturacion.quitarServicio(this.atencion.historiaId, atencionServicioId).subscribe({
      next: () => this.cargar(this.atencion!.historiaId, true),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo quitar el servicio')
    });
  }

  /** Abre el módulo de fórmulas con la atención ya seleccionada. */
  nuevaFormula(): void {
    const a = this.atencion!;
    const ir = (): void => {
      this.router.navigate(['/inicio/formulas'], {
        queryParams: { clienteId: a.clienteId, mascotaId: a.mascotaId, historiaId: a.historiaId }
      });
    };
    if (this.sinGuardar) {
      this.guardar(ir);
    } else {
      ir();
    }
  }

  /** Finaliza la atención (guarda antes los datos). */
  async finalizar(): Promise<void> {
    if (!this.atencion) {
      return;
    }
    if (this.faltantes.length) {
      avisar('Faltan datos para finalizar', 'Complete: ' + this.faltantes.join(', ') + '.', 'warning');
      return;
    }
    const ok = await confirmar('¿Finalizar la atención?',
      'La historia clínica quedará cerrada, la cita como atendida y ya no se podrá modificar.', 'Sí, finalizar');
    if (!ok) {
      return;
    }
    const historiaId = this.atencion.historiaId;
    this.guardar(() => {
      this.procesando = true;
      this.facturacion.finalizarAtencion(historiaId).subscribe({
        next: async (r) => {
          this.procesando = false;
          this.cargar(historiaId);
          this.cargarAgenda();
          const pdf = await confirmar(r.message, '¿Desea descargar la prefactura?', 'Descargar prefactura');
          if (pdf) {
            this.descargarPrefactura();
          }
        },
        error: (e: HttpErrorResponse) => {
          this.procesando = false;
          mostrarError(e, 'No se pudo finalizar la atención');
        }
      });
    });
  }

  /** Descarga la prefactura. */
  descargarPrefactura(): void {
    if (!this.atencion) {
      return;
    }
    const id = this.atencion.historiaId;
    this.facturacion.prefactura(id).subscribe({
      next: (archivo) => descargarArchivo(archivo, `prefactura-${id}.pdf`),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo generar la prefactura')
    });
  }

  // ===================== Utilidades =====================

  /** Clase y texto del estado de atención en la agenda. */
  estadoAgenda(e: string): { texto: string; clase: string } {
    switch (e) {
      case 'EN_CURSO':
        return { texto: 'En curso', clase: 'bg-warning text-dark' };
      case 'FINALIZADA':
        return { texto: 'Finalizada', clase: 'bg-success' };
      default:
        return { texto: 'Sin iniciar', clase: 'bg-light text-dark border' };
    }
  }

  /** Hora HH:mm de una fecha ISO. */
  hora(fecha: string): string {
    return fecha ? fecha.slice(11, 16) : '';
  }
}
