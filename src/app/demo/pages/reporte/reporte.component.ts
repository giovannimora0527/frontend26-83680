import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
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
import { mostrarAdvertencia, mostrarError } from 'src/app/utils/mensajes-utils';
import { fechaHoy, nombreCompleto, normalizarTexto } from 'src/app/utils/tabla-utils';
import { MedicamentoService } from '../medicamento/service/medicamento.service';
import { MedicoService } from '../medico/service/medico.service';
import { ReporteService } from './service/reporte.service';

export type ModuloReporte = 'FINANCIERO' | 'INVENTARIO' | 'MEDICO';
export type AgrupacionTemporal = 'DIA' | 'MES' | 'ANIO';

@Component({
  selector: 'app-reporte',
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte.component.html',
  styleUrl: './reporte.component.scss'
})
export class ReporteComponent {
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

  readonly nombreCompleto = nombreCompleto;

  constructor(
    private readonly reporteService: ReporteService,
    private readonly medicoService: MedicoService,
    private readonly medicamentoService: MedicamentoService
  ) {
    this.cargarCatalogos();
    this.consultarTodosLosReportes();
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
    this.consultarFinanciero();
    this.consultarInventario();
    this.consultarGestionMedica();
  }

  consultarFinanciero() {
    this.cargandoFinanciero = true;
    this.reporteService
      .obtenerReporteFinanciero({
        fechaInicial: this.fechaInicial || undefined,
        fechaFinal: this.fechaFinal || undefined,
        medicoId: this.filtroMedicoId,
        especializacionId: this.filtroEspecializacionId
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
        diasProximoVencer: this.diasProximoVencer
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
        especializacionId: this.filtroEspecializacionId
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
