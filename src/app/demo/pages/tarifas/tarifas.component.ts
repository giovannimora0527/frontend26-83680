import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { FacturacionService } from 'src/app/services/facturacion.service';
import { EspecializacionService } from '../especializacion/service/especializacion.service';
import { Especializacion } from 'src/app/models/especializacion';
import { Servicio, ServicioRq, TIPOS_SERVICIO, TarifaLog, TipoServicio } from 'src/app/models/facturacion';
import { ModalBootstrap } from 'src/app/utils/modal';
import { confirmar, mostrarError, notificarExito } from 'src/app/utils/mensajes';

/**
 * Administración de servicios y tarifas: consultas por especialidad,
 * procedimientos, laboratorio y otros, con valor e IVA configurables. Los
 * cambios de tarifa exigen un motivo y quedan en el historial; las facturas
 * anteriores conservan el valor con que se generaron.
 */
@Component({
  selector: 'app-tarifas',
  imports: [CommonModule, FormsModule],
  templateUrl: './tarifas.component.html'
})
export class TarifasComponent implements OnInit, OnDestroy {
  /** Tipos de servicio. */
  readonly tipos = TIPOS_SERVICIO;

  /** Servicios. */
  servicios: Servicio[] = [];
  /** Especialidades. */
  especialidades: Especializacion[] = [];
  /** Indica que se está consultando. */
  cargando = false;

  /** Texto de búsqueda. */
  texto = '';
  /** Filtro de tipo. */
  filtroTipo = '';
  /** Filtro de estado: '', 'activos' o 'inactivos'. */
  filtroEstado = 'activos';

  /** Servicio en edición (null al crear). */
  editando: Servicio | null = null;
  /** Datos del formulario. */
  form: ServicioRq = this.vacio();
  /** Indica que se intentó guardar. */
  intento = false;
  /** Indica que se está guardando. */
  guardando = false;

  /** Servicio cuyo historial se muestra. */
  servicioHistorial: Servicio | null = null;
  /** Historial de la tarifa. */
  historial: TarifaLog[] = [];

  /** Modales. */
  private readonly modalForm = new ModalBootstrap('modalServicio');
  private readonly modalHistorial = new ModalBootstrap('modalHistorialTarifa');

  /**
   * @param facturacion servicio de tarifas.
   * @param especializacionService servicio de especialidades.
   */
  constructor(
    private readonly facturacion: FacturacionService,
    private readonly especializacionService: EspecializacionService
  ) { }

  /** Carga servicios y especialidades. */
  ngOnInit(): void {
    this.listar();
    this.especializacionService.listar().subscribe({
      next: (data) => (this.especialidades = data),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudieron cargar las especialidades')
    });
  }

  /** Cierra los modales. */
  ngOnDestroy(): void {
    this.modalForm.destruir();
    this.modalHistorial.destruir();
  }

  /** Servicios que cumplen los filtros. */
  get visibles(): Servicio[] {
    const t = this.texto.trim().toLowerCase();
    return this.servicios.filter((s) =>
      (!t || `${s.codigo} ${s.nombre} ${s.especializacionNombre ?? ''}`.toLowerCase().includes(t)) &&
      (!this.filtroTipo || s.tipo === this.filtroTipo) &&
      (this.filtroEstado === '' || (this.filtroEstado === 'activos') === s.activo));
  }

  /** Consulta los servicios. */
  listar(): void {
    this.cargando = true;
    this.facturacion.servicios(false).subscribe({
      next: (data) => {
        this.servicios = data;
        this.cargando = false;
      },
      error: (e: HttpErrorResponse) => {
        this.cargando = false;
        mostrarError(e, 'No se pudieron cargar los servicios');
      }
    });
  }

  /** Texto de un tipo. */
  textoTipo(tipo: string): string {
    return TIPOS_SERVICIO.find((t) => t.valor === tipo)?.texto ?? tipo;
  }

  // ===================== Formulario =====================

  /** Abre el formulario vacío. */
  abrirNuevo(): void {
    this.editando = null;
    this.form = this.vacio();
    this.intento = false;
    this.modalForm.abrir();
  }

  /** Abre el formulario con los datos del servicio. */
  abrirEdicion(s: Servicio): void {
    this.editando = s;
    this.form = {
      codigo: s.codigo, nombre: s.nombre, descripcion: s.descripcion ?? '', tipo: s.tipo,
      especializacionId: s.especializacionId, valor: s.valor, ivaPorcentaje: s.ivaPorcentaje, observacion: ''
    };
    this.intento = false;
    this.modalForm.abrir();
  }

  /** Indica si en la edición cambió el valor o el IVA. */
  get cambiaTarifa(): boolean {
    return !!this.editando && (Number(this.form.valor) !== Number(this.editando.valor)
      || Number(this.form.ivaPorcentaje) !== Number(this.editando.ivaPorcentaje));
  }

  /** Valor del IVA y total que se están configurando. */
  get vistaValor(): { iva: number; total: number } {
    const valor = Number(this.form.valor) || 0;
    const iva = Math.round(valor * (Number(this.form.ivaPorcentaje) || 0)) / 100;
    return { iva, total: valor + iva };
  }

  /** Errores del formulario. */
  get errores(): string[] {
    const f = this.form;
    const e: string[] = [];
    if (!/^[A-Za-z0-9-]{3,20}$/.test(f.codigo.trim())) e.push('El código debe tener de 3 a 20 letras, números o guiones.');
    if (!f.nombre.trim()) e.push('Escriba el nombre.');
    if (f.tipo === 'CONSULTA' && !f.especializacionId) e.push('Una consulta debe indicar la especialidad.');
    if (f.valor === null || f.valor === undefined || Number(f.valor) < 0 || String(f.valor) === '') e.push('Indique un valor mayor o igual a 0.');
    const iva = Number(f.ivaPorcentaje);
    if (isNaN(iva) || iva < 0 || iva > 100) e.push('El IVA debe estar entre 0 y 100 %.');
    if (this.cambiaTarifa && !f.observacion.trim()) e.push('Indique el motivo del cambio de tarifa.');
    return e;
  }

  /** Guarda el servicio. */
  guardar(): void {
    this.intento = true;
    if (this.errores.length || this.guardando) {
      return;
    }
    const rq: ServicioRq = {
      ...this.form,
      codigo: this.form.codigo.trim().toUpperCase(),
      nombre: this.form.nombre.trim(),
      descripcion: this.form.descripcion.trim(),
      valor: Number(this.form.valor),
      ivaPorcentaje: Number(this.form.ivaPorcentaje),
      observacion: this.form.observacion.trim()
    };
    this.guardando = true;
    (this.editando ? this.facturacion.actualizarServicio(this.editando.servicioId, rq) : this.facturacion.guardarServicio(rq))
      .subscribe({
        next: (r) => {
          this.guardando = false;
          this.modalForm.cerrar();
          notificarExito(r.message);
          this.listar();
        },
        error: (e: HttpErrorResponse) => {
          this.guardando = false;
          mostrarError(e, 'No se pudo guardar el servicio');
        }
      });
  }

  // ===================== Estado e historial =====================

  /** Activa o inactiva un servicio. */
  async cambiarActivo(s: Servicio): Promise<void> {
    const activar = !s.activo;
    const ok = await confirmar(activar ? '¿Activar el servicio?' : '¿Inactivar el servicio?',
      activar ? 'Se podrá registrar en las atenciones.' : 'No se podrá agregar a nuevas atenciones; lo ya facturado no cambia.',
      activar ? 'Sí, activar' : 'Sí, inactivar');
    if (!ok) {
      return;
    }
    this.facturacion.cambiarActivoServicio(s.servicioId, activar).subscribe({
      next: (r) => {
        notificarExito(r.message);
        this.listar();
      },
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo cambiar el estado')
    });
  }

  /** Muestra el historial de la tarifa. */
  verHistorial(s: Servicio): void {
    this.servicioHistorial = s;
    this.historial = [];
    this.modalHistorial.abrir();
    this.facturacion.historialTarifa(s.servicioId).subscribe({
      next: (data) => (this.historial = data),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo consultar el historial')
    });
  }

  /** Formulario vacío. */
  private vacio(): ServicioRq {
    return { codigo: '', nombre: '', descripcion: '', tipo: 'PROCEDIMIENTO' as TipoServicio, especializacionId: null,
      valor: 0, ivaPorcentaje: 0, observacion: '' };
  }
}
