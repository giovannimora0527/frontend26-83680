import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Modal } from 'bootstrap';
import { Especializacion } from 'src/app/models/especializacion';
import { Medicamento } from 'src/app/models/medicamento';
import { Medico } from 'src/app/models/medico';
import {
  ItemExistenciaValorizada,
  ItemMovimientoKardex,
  ReporteFinancieroRS,
  ReporteGestionMedicaRS,
  ReporteInventarioRS,
  ResumenPeriodoFinanciero
} from 'src/app/models/reporte';
import { mostrarAdvertencia, mostrarError, mostrarExito } from 'src/app/utils/mensajes-utils';
import { fechaHoy, nombreCompleto, normalizarTexto } from 'src/app/utils/tabla-utils';
import { MedicamentoService } from '../medicamento/service/medicamento.service';
import { MedicoService } from '../medico/service/medico.service';
import { ParametrosExportacionReporte, ReporteService } from './service/reporte.service';
import { AuthService } from 'src/app/services/auth.service';

export type ModuloReporte = 'FINANCIERO' | 'INVENTARIO' | 'MEDICO';
export type AgrupacionTemporal = 'DIA' | 'MES' | 'ANIO';
export type RolUsuarioReporte = 'ADMINISTRADOR' | 'SECRETARIA' | 'VETERINARIO' | 'DESPACHO_MEDICO';

@Component({
  selector: 'app-reporte',
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte.component.html',
  styleUrl: './reporte.component.scss'
})
export class ReporteComponent {
  // Roles y matriz de permisos sobre reportes (Secciones 4.4 y 5.1)
  readonly rolesDisponibles: Array<{
    codigo: RolUsuarioReporte;
    etiqueta: string;
    icono: string;
    modulos: ModuloReporte[];
    descripcionPermisos: string;
  }> = [
    {
      codigo: 'ADMINISTRADOR',
      etiqueta: 'Administrador General',
      icono: 'fa-user-shield',
      modulos: ['FINANCIERO', 'INVENTARIO', 'MEDICO'],
      descripcionPermisos: 'Acceso total y exportación PDF/Excel en Financiero (4.1), Inventario (4.2) y Gestión Médica (4.3)'
    },
    {
      codigo: 'SECRETARIA',
      etiqueta: 'Secretaría / Facturación',
      icono: 'fa-headset',
      modulos: ['FINANCIERO', 'MEDICO'],
      descripcionPermisos: 'Acceso y exportación PDF/Excel en Financiero (4.1) y Gestión Médica (4.3). Restringido Inventario (4.2)'
    },
    {
      codigo: 'VETERINARIO',
      etiqueta: 'Médico Veterinario',
      icono: 'fa-user-md',
      modulos: ['MEDICO'],
      descripcionPermisos: 'Acceso y exportación PDF/Excel exclusivamente en Gestión Médica (4.3). Restringidos Financiero e Inventario'
    },
    {
      codigo: 'DESPACHO_MEDICO',
      etiqueta: 'Despacho / Farmacia',
      icono: 'fa-capsules',
      modulos: ['INVENTARIO'],
      descripcionPermisos: 'Acceso y exportación exclusivamente en Inventario y Kardex (4.2). Bloqueados reportes financieros y médicos'
    }
  ];

  rolActual!: RolUsuarioReporte;

  // Pestaña activa: 4.1 FINANCIERO, 4.2 INVENTARIO, 4.3 MEDICO
  moduloActivo: ModuloReporte = 'FINANCIERO';
  agrupacionTemporal: AgrupacionTemporal = 'MES';

  // Filtros globales y contextuales
  fechaInicial = '';
  fechaFinal = '';
  filtroMedicoId: number | null = null;
  filtroEspecializacionId: number | null = null;
  filtroMedicamentoId: number | null = null;
  diasProximoVencer = 30;

  // Subfiltros locales de la pestaña de Inventario
  terminoBusquedaInventario = '';
  filtroAlertaInventario = '';
  filtroTipoMovimientoKardex = '';

  // Catálogos para filtros
  listMedicos: Medico[] = [];
  listEspecializaciones: Especializacion[] = [];
  listMedicamentos: Medicamento[] = [];

  // Resultados de los reportes
  reporteFinanciero: ReporteFinancieroRS | null = null;
  reporteInventario: ReporteInventarioRS | null = null;
  reporteMedico: ReporteGestionMedicaRS | null = null;

  cargandoFinanciero = false;
  cargandoInventario = false;
  cargandoMedico = false;

  // Estados de exportación PDF / Excel y Modal de Vista Previa (Sección 4.4)
  exportandoPdf = false;
  exportandoExcel = false;
  modalVistaPreviaInstance: Modal | null = null;
  fechaVistaPrevia: Date = new Date();

  readonly nombreCompleto = nombreCompleto;

  constructor(
    private readonly reporteService: ReporteService,
    private readonly medicoService: MedicoService,
    private readonly medicamentoService: MedicamentoService,
    private readonly authService: AuthService
  ) {
    const rol = this.authService.role();
    if (!this.rolesDisponibles.some((opcion) => opcion.codigo === rol)) {
      throw new Error(`El perfil autenticado no tiene acceso a reportes: ${rol}`);
    }
    this.rolActual = rol as RolUsuarioReporte;
    this.ajustarModuloActivoSegunRol();
    this.cargarCatalogos();
    this.consultarTodosLosReportes();
  }

  private ajustarModuloActivoSegunRol() {
    if (!this.tienePermisoModulo(this.moduloActivo)) {
      const permitidos = this.infoRolActual.modulos;
      if (permitidos.length > 0) {
        this.moduloActivo = permitidos[0];
      }
    }
  }

  get infoRolActual() {
    return this.rolesDisponibles.find((r) => r.codigo === this.rolActual) ?? this.rolesDisponibles[0];
  }

  tienePermisoModulo(modulo: ModuloReporte): boolean {
    return this.infoRolActual.modulos.includes(modulo);
  }

  cargarCatalogos() {
    this.medicoService.listar().subscribe({
      next: (medicos) => {
        this.listMedicos = medicos ?? [];
        const mapEsp = new Map<number, Especializacion>();
        for (const m of this.listMedicos) {
          if (m.especializacion?.id) {
            mapEsp.set(m.especializacion.id, m.especializacion);
          }
        }
        this.listEspecializaciones = Array.from(mapEsp.values());
      },
      error: (err: HttpErrorResponse) => mostrarError(err)
    });

    this.medicamentoService.listar().subscribe({
      next: (meds) => (this.listMedicamentos = meds ?? []),
      error: (err: HttpErrorResponse) => mostrarError(err)
    });
  }

  cambiarModulo(modulo: ModuloReporte) {
    if (!this.tienePermisoModulo(modulo)) {
      mostrarAdvertencia(
        'Acceso restringido por rol',
        `El perfil '${this.infoRolActual.etiqueta}' no tiene permisos para consultar ni exportar el reporte ${this.tituloModulo(modulo)}.`
      );
      return;
    }
    this.moduloActivo = modulo;
  }

  cambiarAgrupacionTemporal(agrupacion: AgrupacionTemporal) {
    this.agrupacionTemporal = agrupacion;
  }

  // Atajos de rango de fechas
  aplicarRangoRapido(tipo: 'HOY' | 'MES' | 'ANIO' | 'TODO') {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');

    if (tipo === 'HOY') {
      this.fechaInicial = `${yyyy}-${mm}-${dd}`;
      this.fechaFinal = `${yyyy}-${mm}-${dd}`;
    } else if (tipo === 'MES') {
      this.fechaInicial = `${yyyy}-${mm}-01`;
      this.fechaFinal = `${yyyy}-${mm}-${dd}`;
    } else if (tipo === 'ANIO') {
      this.fechaInicial = `${yyyy}-01-01`;
      this.fechaFinal = `${yyyy}-12-31`;
    } else {
      this.fechaInicial = '';
      this.fechaFinal = '';
    }
    this.consultarTodosLosReportes();
  }

  limpiarFiltros() {
    this.fechaInicial = '';
    this.fechaFinal = '';
    this.filtroMedicoId = null;
    this.filtroEspecializacionId = null;
    this.filtroMedicamentoId = null;
    this.diasProximoVencer = 30;
    this.terminoBusquedaInventario = '';
    this.filtroAlertaInventario = '';
    this.filtroTipoMovimientoKardex = '';
    this.consultarTodosLosReportes();
  }

  consultarTodosLosReportes() {
    if (this.fechaInicial && this.fechaFinal && this.fechaInicial > this.fechaFinal) {
      mostrarAdvertencia('Rango de fechas no válido', 'La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    if (this.tienePermisoModulo('FINANCIERO')) {
      this.consultarFinanciero();
    } else {
      this.reporteFinanciero = null;
    }

    if (this.tienePermisoModulo('INVENTARIO')) {
      this.consultarInventario();
    } else {
      this.reporteInventario = null;
    }

    if (this.tienePermisoModulo('MEDICO')) {
      this.consultarGestionMedica();
    } else {
      this.reporteMedico = null;
    }
  }

  consultarFinanciero() {
    this.cargandoFinanciero = true;
    this.reporteService
      .obtenerReporteFinanciero({
        fechaInicial: this.fechaInicial || undefined,
        fechaFinal: this.fechaFinal || undefined,
        medicoId: this.filtroMedicoId,
        especializacionId: this.filtroEspecializacionId,
        rol: this.rolActual
      })
      .subscribe({
        next: (data) => {
          this.reporteFinanciero = data;
          this.cargandoFinanciero = false;
        },
        error: (err: HttpErrorResponse) => {
          this.cargandoFinanciero = false;
          mostrarError(err);
        }
      });
  }

  consultarInventario() {
    this.cargandoInventario = true;
    this.reporteService
      .obtenerReporteInventario({
        fechaInicial: this.fechaInicial || undefined,
        fechaFinal: this.fechaFinal || undefined,
        medicamentoId: this.filtroMedicamentoId,
        diasProximoVencer: this.diasProximoVencer,
        rol: this.rolActual
      })
      .subscribe({
        next: (data) => {
          this.reporteInventario = data;
          this.cargandoInventario = false;
        },
        error: (err: HttpErrorResponse) => {
          this.cargandoInventario = false;
          mostrarError(err);
        }
      });
  }

  consultarGestionMedica() {
    this.cargandoMedico = true;
    this.reporteService
      .obtenerReporteGestionMedica({
        fechaInicial: this.fechaInicial || undefined,
        fechaFinal: this.fechaFinal || undefined,
        medicoId: this.filtroMedicoId,
        especializacionId: this.filtroEspecializacionId,
        rol: this.rolActual
      })
      .subscribe({
        next: (data) => {
          this.reporteMedico = data;
          this.cargandoMedico = false;
        },
        error: (err: HttpErrorResponse) => {
          this.cargandoMedico = false;
          mostrarError(err);
        }
      });
  }

  // =========================================================================
  // 4.4 VISTA PREVIA OFICIAL, TOTALES CALCULADOS Y DESCARGA PDF / EXCEL
  // =========================================================================

  tituloModulo(modulo: ModuloReporte = this.moduloActivo): string {
    switch (modulo) {
      case 'FINANCIERO':
        return '4.1 Reporte Financiero y Contable';
      case 'INVENTARIO':
        return '4.2 Reporte de Valoración de Inventario, Alertas y Kardex';
      case 'MEDICO':
        return '4.3 Reporte de Gestión Médica y Atención de Pacientes';
    }
  }

  get descripcionFiltrosActivos(): string {
    const partes: string[] = [];
    if (this.fechaInicial && this.fechaFinal) {
      partes.push(`Rango: ${this.fechaInicial} a ${this.fechaFinal}`);
    } else if (this.fechaInicial) {
      partes.push(`Desde: ${this.fechaInicial}`);
    } else if (this.fechaFinal) {
      partes.push(`Hasta: ${this.fechaFinal}`);
    } else {
      partes.push('Período: Histórico completo');
    }

    if (this.moduloActivo !== 'INVENTARIO') {
      if (this.filtroMedicoId) {
        const med = this.listMedicos.find((m) => m.id === this.filtroMedicoId);
        partes.push(`Veterinario: ${med ? 'Dr(a). ' + nombreCompleto(med) : '#' + this.filtroMedicoId}`);
      }
      if (this.filtroEspecializacionId) {
        const esp = this.listEspecializaciones.find((e) => e.id === this.filtroEspecializacionId);
        partes.push(`Especialidad: ${esp ? esp.nombre : '#' + this.filtroEspecializacionId}`);
      }
      if (this.moduloActivo === 'FINANCIERO') {
        partes.push(`Agrupación: ${this.agrupacionTemporal}`);
      }
    } else {
      if (this.filtroMedicamentoId) {
        const m = this.listMedicamentos.find((x) => x.id === this.filtroMedicamentoId);
        partes.push(`Medicamento Kardex: ${m ? m.nombre : '#' + this.filtroMedicamentoId}`);
      }
      partes.push(`Umbral vencimiento: ${this.diasProximoVencer} días`);
    }
    return partes.join(' | ');
  }

  abrirVistaPreviaExportacion() {
    if (!this.tienePermisoModulo(this.moduloActivo)) {
      mostrarAdvertencia('Sin permisos', 'Su rol actual no tiene autorización para previsualizar ni exportar este reporte.');
      return;
    }
    this.fechaVistaPrevia = new Date();
    const modalEl = document.getElementById('modalVistaPreviaExportacion');
    if (modalEl) {
      this.modalVistaPreviaInstance = Modal.getOrCreateInstance(modalEl);
      this.modalVistaPreviaInstance.show();
    }
  }

  cerrarVistaPreviaExportacion() {
    this.modalVistaPreviaInstance?.hide();
  }

  private construirParametrosExportacion(): ParametrosExportacionReporte {
    return {
      tipoReporte: this.moduloActivo,
      fechaInicial: this.fechaInicial || undefined,
      fechaFinal: this.fechaFinal || undefined,
      medicoId: this.filtroMedicoId,
      especializacionId: this.filtroEspecializacionId,
      medicamentoId: this.filtroMedicamentoId,
      diasProximoVencer: this.diasProximoVencer,
      agrupacion: this.agrupacionTemporal,
      rol: this.rolActual
    };
  }

  descargarReporteExcel() {
    if (!this.tienePermisoModulo(this.moduloActivo)) {
      mostrarAdvertencia('Acceso restringido', 'Su rol no tiene permisos para exportar este reporte.');
      return;
    }
    this.exportandoExcel = true;
    const params = this.construirParametrosExportacion();
    this.reporteService.exportarExcel(params).subscribe({
      next: (blob) => {
        this.exportandoExcel = false;
        this.dispararDescargaArchivo(blob, `reporte_${this.moduloActivo.toLowerCase()}_${fechaHoy()}.xlsx`);
        mostrarExito(`Se descargó el archivo Excel de ${this.tituloModulo()} con encabezados y totales.`);
      },
      error: (err: HttpErrorResponse) => {
        this.exportandoExcel = false;
        mostrarError(err);
      }
    });
  }

  descargarReportePdf() {
    if (!this.tienePermisoModulo(this.moduloActivo)) {
      mostrarAdvertencia('Acceso restringido', 'Su rol no tiene permisos para exportar este reporte.');
      return;
    }
    this.exportandoPdf = true;
    const params = this.construirParametrosExportacion();
    this.reporteService.exportarPdf(params).subscribe({
      next: (blob) => {
        this.exportandoPdf = false;
        this.dispararDescargaArchivo(blob, `reporte_${this.moduloActivo.toLowerCase()}_${fechaHoy()}.pdf`);
        mostrarExito(`Se descargó el documento PDF de ${this.tituloModulo()} con encabezados y totales.`);
      },
      error: (err: HttpErrorResponse) => {
        this.exportandoPdf = false;
        mostrarError(err);
      }
    });
  }

  private dispararDescargaArchivo(blob: Blob, nombreArchivo: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Totales calculados para filas de <tfoot> en 4.1 Financiero
  get totalesEspecialidadFinanciero() {
    const lista = this.reporteFinanciero?.ingresosPorEspecialidad ?? [];
    return lista.reduce(
      (acc, i) => ({
        facturas: acc.facturas + (i.cantidadFacturas ?? 0),
        consultas: acc.consultas + (i.ingresosServicios ?? 0),
        medicamentos: acc.medicamentos + (i.ingresosMedicamentos ?? 0),
        facturado: acc.facturado + (i.totalFacturado ?? 0),
        recaudado: acc.recaudado + (i.totalRecaudado ?? 0)
      }),
      { facturas: 0, consultas: 0, medicamentos: 0, facturado: 0, recaudado: 0 }
    );
  }

  get totalesVeterinarioFinanciero() {
    const lista = this.reporteFinanciero?.ingresosPorVeterinario ?? [];
    return lista.reduce(
      (acc, i) => ({
        facturas: acc.facturas + (i.cantidadFacturas ?? 0),
        consultas: acc.consultas + (i.ingresosServicios ?? 0),
        medicamentos: acc.medicamentos + (i.ingresosMedicamentos ?? 0),
        facturado: acc.facturado + (i.totalFacturado ?? 0),
        recaudado: acc.recaudado + (i.totalRecaudado ?? 0)
      }),
      { facturas: 0, consultas: 0, medicamentos: 0, facturado: 0, recaudado: 0 }
    );
  }

  get totalesResumenTemporalFinanciero() {
    const lista = this.resumenTemporalFinancieroActivo;
    return lista.reduce(
      (acc, r) => ({
        facturas: acc.facturas + (r.cantidadFacturas ?? 0),
        consultas: acc.consultas + (r.ingresosServicios ?? 0),
        medicamentos: acc.medicamentos + (r.ingresosMedicamentos ?? 0),
        descuentos: acc.descuentos + (r.descuentos ?? 0),
        impuestos: acc.impuestos + (r.impuestos ?? 0),
        facturado: acc.facturado + (r.totalFacturado ?? 0),
        recaudado: acc.recaudado + (r.totalRecaudado ?? 0)
      }),
      { facturas: 0, consultas: 0, medicamentos: 0, descuentos: 0, impuestos: 0, facturado: 0, recaudado: 0 }
    );
  }

  // Totales calculados para filas de <tfoot> en 4.2 Inventario
  get totalesExistenciasFiltradas() {
    const lista = this.existenciasValorizadasFiltradas;
    return lista.reduce(
      (acc, i) => ({
        unidades: acc.unidades + (i.cantidadDisponible ?? 0),
        valorCosto: acc.valorCosto + (i.valorCostoTotal ?? 0),
        valorVenta: acc.valorVenta + (i.valorVentaTotal ?? 0),
        margen: acc.margen + (i.margenPotencial ?? 0)
      }),
      { unidades: 0, valorCosto: 0, valorVenta: 0, margen: 0 }
    );
  }

  get totalesKardexFiltrado() {
    const lista = this.movimientosKardexFiltrados;
    let entradas = 0;
    let salidas = 0;
    for (const m of lista) {
      if (m.tipo?.toUpperCase() === 'ENTRADA') {
        entradas += m.cantidad ?? 0;
      } else {
        salidas += m.cantidad ?? 0;
      }
    }
    return {
      totalMovimientos: lista.length,
      entradas,
      salidas,
      balanceNeto: entradas - salidas
    };
  }

  // Totales calculados para filas de <tfoot> en 4.3 Gestión Médica
  get totalesVeterinarioMedico() {
    const lista = this.reporteMedico?.consultasPorVeterinario ?? [];
    const res = lista.reduce(
      (acc, i) => ({
        totalCitas: acc.totalCitas + (i.totalCitas ?? 0),
        atendidas: acc.atendidas + (i.citasAtendidas ?? 0),
        pendientes: acc.pendientes + (i.citasPendientes ?? 0),
        canceladas: acc.canceladas + (i.citasCanceladas ?? 0)
      }),
      { totalCitas: 0, atendidas: 0, pendientes: 0, canceladas: 0 }
    );
    const porcentaje = res.totalCitas > 0 ? Number(((res.atendidas * 100) / res.totalCitas).toFixed(1)) : 0;
    return { ...res, porcentaje };
  }

  get totalesEspecialidadMedica() {
    const lista = this.reporteMedico?.consultasPorEspecialidad ?? [];
    const res = lista.reduce(
      (acc, i) => ({
        totalCitas: acc.totalCitas + (i.totalCitas ?? 0),
        atendidas: acc.atendidas + (i.citasAtendidas ?? 0),
        pendientes: acc.pendientes + (i.citasPendientes ?? 0),
        canceladas: acc.canceladas + (i.citasCanceladas ?? 0)
      }),
      { totalCitas: 0, atendidas: 0, pendientes: 0, canceladas: 0 }
    );
    const porcentaje = res.totalCitas > 0 ? Number(((res.atendidas * 100) / res.totalCitas).toFixed(1)) : 0;
    return { ...res, porcentaje };
  }

  get totalConsultasMascotasAtendidas(): number {
    const lista = this.reporteMedico?.mascotasAtendidasPeriodo ?? [];
    return lista.reduce((acc, m) => acc + (m.consultasAtendidas ?? 0), 0);
  }

  // Lista del resumen temporal activo en 4.1 (Día, Mes o Año)
  get resumenTemporalFinancieroActivo(): ResumenPeriodoFinanciero[] {
    if (!this.reporteFinanciero) {
      return [];
    }
    switch (this.agrupacionTemporal) {
      case 'DIA':
        return this.reporteFinanciero.resumenPorDia ?? [];
      case 'ANIO':
        return this.reporteFinanciero.resumenPorAnio ?? [];
      default:
        return this.reporteFinanciero.resumenPorMes ?? [];
    }
  }

  // Filtrado rápido en 4.2 Existencias de Inventario
  alternarFiltroAlertaInventario(alerta: string) {
    this.filtroAlertaInventario = this.filtroAlertaInventario === alerta ? '' : alerta;
  }

  verKardexMedicamento(medicamentoId: number) {
    this.filtroMedicamentoId = medicamentoId;
    this.consultarInventario();
  }

  get existenciasValorizadasFiltradas(): ItemExistenciaValorizada[] {
    const lista = this.reporteInventario?.existenciasActuales ?? [];
    const termino = normalizarTexto(this.terminoBusquedaInventario.trim());

    return lista.filter((item) => {
      if (this.filtroAlertaInventario && item.estadoAlerta !== this.filtroAlertaInventario) {
        return false;
      }
      if (!termino) {
        return true;
      }
      const valores = [item.codigo, item.nombre, item.presentacion, item.lote, item.registroInvima];
      return valores.some((v) => normalizarTexto(String(v ?? '')).includes(termino));
    });
  }

  get movimientosKardexFiltrados(): ItemMovimientoKardex[] {
    const lista = this.reporteInventario?.movimientosInventario ?? [];
    if (!this.filtroTipoMovimientoKardex) {
      return lista;
    }
    return lista.filter((m) => m.tipo?.toUpperCase() === this.filtroTipoMovimientoKardex);
  }

  etiquetaAlertaInventario(estado: string): string {
    switch (estado) {
      case 'VENCIDO':
        return 'Vencido';
      case 'AGOTADO':
        return 'Agotado (0)';
      case 'STOCK_MINIMO':
        return 'Stock Mínimo';
      case 'PROXIMO_VENCER':
        return 'Próximo a Vencer';
      default:
        return 'Normal';
    }
  }

  claseAlertaInventario(estado: string): string {
    switch (estado) {
      case 'VENCIDO':
      case 'AGOTADO':
        return 'bg-danger text-white';
      case 'STOCK_MINIMO':
      case 'PROXIMO_VENCER':
        return 'bg-warning text-dark';
      default:
        return 'bg-success text-white';
    }
  }

  get fechaHoyStr(): string {
    return fechaHoy();
  }
}
