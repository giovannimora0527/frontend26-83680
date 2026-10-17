import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClinicApiService } from '../../services/clinic-api.service';
import { CitaApi, FormulaApi, FormulaRequestApi, MedicamentoApi } from '../../models/clinic-workflows';

type CampoOrden = 'id' | 'citaId' | 'medicamentoNombre' | 'dosis' | 'fechaEmision';
type DireccionOrden = 'asc' | 'desc';
interface FormulaForm { citaId: number | null; medicamentoId: number | null; fechaEmision: string; dosis: string; frecuencia: string; duracionTratamiento: string; indicaciones: string; }

/** Gestiona el listado y el formulario de fórmulas médicas conectados a Spring Boot. */
@Component({
  selector: 'app-formulas-medicas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulas-medicas.component.html',
  styleUrl: './formulas-medicas.component.scss'
})
export class FormulasMedicasComponent implements OnInit {
  formulas: FormulaApi[] = [];
  citas: CitaApi[] = [];
  medicamentos: MedicamentoApi[] = [];
  filtro = '';
  fechaDesde = '';
  fechaHasta = '';
  paginaActual = 1;
  tamanoPagina = 5;
  campoOrden: CampoOrden = 'fechaEmision';
  direccionOrden: DireccionOrden = 'desc';
  modalFormularioAbierto = false;
  modalDetalleAbierto = false;
  modoEdicion = false;
  cargando = false;
  guardando = false;
  mensaje = '';
  errorGeneral = '';
  errorFormulario = '';
  formulaDetalle: FormulaApi | null = null;
  idEnEdicion: number | undefined;
  formulario: FormulaForm = this.formularioVacio();

  /** Recibe el cliente API compartido. */
  constructor(public readonly api: ClinicApiService) {}

  /** Carga las fórmulas y los catálogos requeridos por el formulario. */
  ngOnInit(): void { this.recargar(); this.cargarCatalogos(); }

  /** Consulta las fórmulas reales almacenadas en MySQL a través del backend. */
  recargar(): void {
    this.cargando = true;
    this.errorGeneral = '';
    this.api.listarFormulas().subscribe({
      next: (data) => { this.formulas = data ?? []; this.cargando = false; this.ajustarPagina(); },
      error: (error: unknown) => { this.errorGeneral = this.api.mensajeError(error, 'consultar las fórmulas'); this.cargando = false; }
    });
  }

  /** Descarga citas y medicamentos que alimentan los combos. */
  private cargarCatalogos(): void {
    this.api.listarCitas().subscribe({ next: (data) => this.citas = data ?? [], error: (error: unknown) => this.errorGeneral = this.api.mensajeError(error, 'cargar las citas') });
    this.api.listarMedicamentos().subscribe({ next: (data) => this.medicamentos = data ?? [], error: (error: unknown) => this.errorGeneral = this.api.mensajeError(error, 'cargar los medicamentos') });
  }

  /** Filtra por texto y fechas y ordena el resultado antes de paginarlo. */
  get formulasFiltradas(): FormulaApi[] {
    const criterio = this.filtro.trim().toLocaleLowerCase('es-CO');
    return this.formulas.filter((formula) => {
      const texto = [formula.id, formula.citaId, formula.medicamentoId, formula.medicamentoNombre, formula.mascotaNombre, formula.clienteNombre, formula.medicoNombre, formula.dosis, formula.frecuencia, formula.indicaciones].join(' ').toLocaleLowerCase('es-CO');
      const fecha = (formula.fechaEmision || formula.fechaCreacionRegistro || '').slice(0, 10);
      return (!criterio || texto.includes(criterio)) && (!this.fechaDesde || fecha >= this.fechaDesde) && (!this.fechaHasta || fecha <= this.fechaHasta);
    }).sort((a, b) => {
      const first = a[this.campoOrden] ?? '';
      const second = b[this.campoOrden] ?? '';
      const cmp = typeof first === 'number' && typeof second === 'number' ? first - second : String(first).localeCompare(String(second), 'es', { numeric: true, sensitivity: 'base' });
      return this.direccionOrden === 'asc' ? cmp : -cmp;
    });
  }

  /** Número total de páginas después de filtrar. */
  get totalPaginas(): number { return Math.max(1, Math.ceil(this.formulasFiltradas.length / this.tamanoPagina)); }
  /** Elementos de la página actual. */
  get formulasPagina(): FormulaApi[] { const start = (this.paginaActual - 1) * this.tamanoPagina; return this.formulasFiltradas.slice(start, start + this.tamanoPagina); }
  /** Índice inicial del rango visible. */
  get inicioResultados(): number { return this.formulasFiltradas.length ? (this.paginaActual - 1) * this.tamanoPagina + 1 : 0; }
  /** Índice final del rango visible. */
  get finResultados(): number { return Math.min(this.paginaActual * this.tamanoPagina, this.formulasFiltradas.length); }

  /** Ordena por una columna y vuelve a la primera página. */
  ordenarPor(campo: CampoOrden): void {
    if (this.campoOrden === campo) this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    else { this.campoOrden = campo; this.direccionOrden = campo === 'fechaEmision' ? 'desc' : 'asc'; }
    this.paginaActual = 1;
  }
  /** Reinicia la paginación al cambiar un filtro. */
  cambiarFiltro(): void { this.paginaActual = 1; }
  /** Navega a una página válida. */
  irAPagina(pagina: number): void { if (pagina >= 1 && pagina <= this.totalPaginas) this.paginaActual = pagina; }

  /** Abre el formulario vacío para registrar una fórmula. */
  abrirNueva(): void {
    this.modoEdicion = false; this.idEnEdicion = undefined; this.formulario = this.formularioVacio();
    this.errorFormulario = ''; this.modalFormularioAbierto = true; this.mensaje = '';
  }
  /** Carga los datos de la fórmula elegida en el formulario de edición. */
  abrirEdicion(formula: FormulaApi): void {
    this.modoEdicion = true; this.idEnEdicion = formula.id;
    this.formulario = { citaId: formula.citaId, medicamentoId: formula.medicamentoId, fechaEmision: this.paraInputFecha(formula.fechaEmision), dosis: formula.dosis, frecuencia: formula.frecuencia ?? '', duracionTratamiento: formula.duracionTratamiento ?? '', indicaciones: formula.indicaciones ?? '' };
    this.errorFormulario = ''; this.modalDetalleAbierto = false; this.modalFormularioAbierto = true; this.mensaje = '';
  }
  /** Abre el detalle completo del registro seleccionado. */
  abrirDetalle(formula: FormulaApi): void { this.formulaDetalle = formula; this.modalDetalleAbierto = true; this.mensaje = ''; }
  /** Cierra los modales abiertos. */
  cerrarModales(): void { this.modalFormularioAbierto = false; this.modalDetalleAbierto = false; this.formulaDetalle = null; this.errorFormulario = ''; }

  /** Valida el formulario y persiste el registro mediante POST o PUT. */
  guardarFormulario(): void {
    this.errorFormulario = '';
    if (!this.formulario.citaId || !this.formulario.medicamentoId || !this.formulario.fechaEmision || !this.formulario.dosis.trim() || !this.formulario.frecuencia.trim() || !this.formulario.duracionTratamiento.trim()) {
      this.errorFormulario = 'Completa la cita, medicamento, fecha de emisión, dosis, frecuencia y duración del tratamiento.'; return;
    }
    const request: FormulaRequestApi = {
      citaId: Number(this.formulario.citaId), medicamentoId: Number(this.formulario.medicamentoId),
      fechaEmision: this.paraApiFecha(this.formulario.fechaEmision), dosis: this.formulario.dosis.trim(),
      frecuencia: this.formulario.frecuencia.trim(), duracionTratamiento: this.formulario.duracionTratamiento.trim(),
      indicaciones: this.formulario.indicaciones.trim() || null
    };
    this.guardando = true;
    const accion = this.modoEdicion && this.idEnEdicion !== undefined
      ? this.api.actualizarFormula(this.idEnEdicion, request)
      : this.api.crearFormula(request);
    accion.subscribe({
      next: () => { this.guardando = false; this.cerrarModales(); this.mensaje = this.modoEdicion ? 'Fórmula médica actualizada correctamente.' : 'Fórmula médica registrada correctamente.'; this.recargar(); },
      error: (error: unknown) => { this.guardando = false; this.errorFormulario = this.api.mensajeError(error, 'guardar la fórmula médica'); }
    });
  }

  /** Inactiva la fórmula conservando el registro para trazabilidad clínica. */
  inactivar(formula: FormulaApi): void {
    if (!window.confirm(`¿Desea inactivar la fórmula FM-${formula.id}? El registro no se eliminará físicamente.`)) return;
    this.api.inactivarFormula(formula.id).subscribe({ next: () => { this.mensaje = 'Fórmula inactivada; se conservó el registro histórico.'; this.recargar(); }, error: (error: unknown) => this.errorGeneral = this.api.mensajeError(error, 'inactivar la fórmula') });
  }

  /** Elimina los filtros de búsqueda actuales. */
  limpiarFiltros(): void { this.filtro = ''; this.fechaDesde = ''; this.fechaHasta = ''; this.paginaActual = 1; }
  /** Retorna el marcador visual de orden. */
  etiquetaOrden(campo: CampoOrden): string { if (campo !== this.campoOrden) return '↕'; return this.direccionOrden === 'asc' ? '↑' : '↓'; }
  /** Formatea una fecha para lectura en español colombiano. */
  fechaLegible(fecha: string | null | undefined): string {
    if (!fecha) return '—'; const parsed = new Date(fecha);
    return Number.isNaN(parsed.getTime()) ? fecha : new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
  }
  /** Devuelve la etiqueta de una cita, aunque los datos de su catálogo no hayan cargado. */
  nombreCita(id: number): string { const cita = this.citas.find((item) => item.id === id); return cita ? `Cita #${id} · ${cita.mascotaNombre} · ${this.fechaLegible(cita.fechaHora)}` : `Cita #${id}`; }

  /** Devuelve la fecha mínima que permite la consulta seleccionada para evitar errores en el formulario. */
  get fechaMinimaEmision(): string { const cita = this.citas.find((item) => item.id === this.formulario.citaId); return cita ? cita.fechaHora.slice(0, 16) : ''; }

  /** Crea el formulario de fórmula con valores iniciales y fecha local actual. */
  private formularioVacio(): FormulaForm { return { citaId: null, medicamentoId: null, fechaEmision: this.fechaHoraActual(), dosis: '', frecuencia: '', duracionTratamiento: '', indicaciones: '' }; }
  /** Obtiene fecha y hora local en el formato requerido por datetime-local. */
  private fechaHoraActual(): string { const now = new Date(); const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 16); }
  /** Adapta una fecha devuelta por la API al control datetime-local. */
  private paraInputFecha(fecha: string | null): string { return fecha ? fecha.slice(0, 16) : this.fechaHoraActual(); }
  /** Completa los segundos para enviar una fecha que Spring pueda interpretar. */
  private paraApiFecha(fecha: string): string { return fecha.length === 16 ? `${fecha}:00` : fecha; }
  /** Ajusta la página activa cuando cambia el número de resultados. */
  private ajustarPagina(): void { if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas; }
}
