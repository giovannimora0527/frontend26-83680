import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { FiltroReporte, ReporteService } from './service/reporte.service';
import { Reporte, TipoReporte } from 'src/app/models/clinica';
import { fechaHoy, guardarArchivo, obtenerMensajeError } from 'src/app/utils/utilidades';

/**
 * Reportes financieros, de inventario y de medicos con vista previa y exportacion a PDF y Excel.
 */
@Component({
  selector: 'app-reporte',
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte.component.html'
})
export class ReporteComponent {
  tipos: TipoReporte[] = [];
  categorias: string[] = [];
  filtro: FiltroReporte = { tipo: '', desde: fechaHoy().substring(0, 8) + '01', hasta: fechaHoy(), agrupacion: 'MES', filtro: '' };
  reporte: Reporte | null = null;
  cargando = false;

  constructor(private readonly reporteService: ReporteService) {
    this.reporteService.tipos().subscribe({
      next: (t) => {
        this.tipos = t;
        this.categorias = [...new Set(t.map((x) => x.categoria))];
        this.filtro.tipo = t[0]?.codigo ?? '';
      },
      error: (e: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(e), 'error')
    });
  }

  tiposDe(categoria: string): TipoReporte[] {
    return this.tipos.filter((t) => t.categoria === categoria);
  }

  /** Solo el reporte de ingresos por periodo se agrupa por dia, mes o año. */
  get usaAgrupacion(): boolean {
    return this.filtro.tipo === 'ingresos-periodo';
  }

  private valido(): boolean {
    if (!this.filtro.tipo || !this.filtro.desde || !this.filtro.hasta) {
      Swal.fire('Faltan filtros', 'Seleccione el reporte y el rango de fechas', 'info');
      return false;
    }
    if (this.filtro.desde > this.filtro.hasta) {
      Swal.fire('Rango no válido', 'La fecha inicial no puede ser mayor que la final', 'warning');
      return false;
    }
    return true;
  }

  consultar() {
    if (!this.valido()) { return; }
    this.cargando = true;
    this.reporteService.datos(this.filtro).subscribe({
      next: (r) => { this.reporte = r; this.cargando = false; },
      error: (e: HttpErrorResponse) => { this.cargando = false; Swal.fire('Error', obtenerMensajeError(e), 'error'); }
    });
  }

  excel() {
    if (!this.valido()) { return; }
    this.reporteService.excel(this.filtro).subscribe({
      next: (b) => guardarArchivo(b, `reporte_${this.filtro.tipo.toLowerCase()}.xlsx`),
      error: () => Swal.fire('Error', 'No se pudo generar el Excel', 'error')
    });
  }

  pdf() {
    if (!this.valido()) { return; }
    this.reporteService.pdf(this.filtro).subscribe({
      next: (b) => guardarArchivo(b, `reporte_${this.filtro.tipo.toLowerCase()}.pdf`),
      error: () => Swal.fire('Error', 'No se pudo generar el PDF', 'error')
    });
  }

  esNumero(v: string | number): boolean {
    return typeof v === 'number';
  }
}
