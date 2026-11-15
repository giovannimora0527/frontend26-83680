import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { ReporteService } from 'src/app/services/reporte.service';
import { CatalogoService } from 'src/app/services/catalogo.service';
import { EspecializacionService } from '../especializacion/service/especializacion.service';
import { FiltroReporte, Reporte, ReporteColumna, ReporteDef } from 'src/app/models/reporte';
import { MedicamentoOpcion, MedicoOpcion } from 'src/app/models/catalogo';
import { Especializacion } from 'src/app/models/especializacion';
import { descargarArchivo } from 'src/app/utils/archivos';
import { hoyIso } from 'src/app/utils/fechas';
import { avisar, mostrarError } from 'src/app/utils/mensajes';

/**
 * Módulo de reportes: el usuario elige un reporte de los que permite su
 * perfil, ajusta los filtros que ese reporte admite, ve los resultados con
 * sus totales y los descarga en PDF o Excel (el archivo contiene exactamente
 * lo que se ve en la vista previa).
 */
@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent implements OnInit {
  /** Reportes disponibles. */
  catalogo: ReporteDef[] = [];
  /** Reporte elegido. */
  seleccionado: ReporteDef | null = null;
  /** Resultado de la vista previa. */
  resultado: Reporte | null = null;
  /** Indica que se está consultando. */
  cargando = false;
  /** Formato que se está descargando. */
  descargando: 'pdf' | 'excel' | null = null;

  /** Filtros. */
  filtro: FiltroReporte = this.filtroInicial();

  /** Catálogos para los filtros. */
  medicos: MedicoOpcion[] = [];
  medicamentos: MedicamentoOpcion[] = [];
  especialidades: Especializacion[] = [];

  /**
   * @param reportes servicio de reportes.
   * @param catalogoService catálogos de veterinarios y medicamentos.
   * @param especializacionService especialidades.
   */
  constructor(
    private readonly reportes: ReporteService,
    private readonly catalogoService: CatalogoService,
    private readonly especializacionService: EspecializacionService
  ) { }

  /** Carga el catálogo de reportes y las listas de los filtros. */
  ngOnInit(): void {
    this.reportes.catalogo().subscribe({
      next: (data) => {
        this.catalogo = data;
        if (data.length) {
          this.elegir(data[0]);
        }
      },
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudieron cargar los reportes')
    });
    this.catalogoService.listarMedicos().subscribe({ next: (m) => (this.medicos = m) });
    this.catalogoService.listarMedicamentos().subscribe({ next: (m) => (this.medicamentos = m), error: () => undefined });
    this.especializacionService.listar().subscribe({ next: (e) => (this.especialidades = e), error: () => undefined });
  }

  /** Categorías con sus reportes, en orden. */
  get categorias(): { nombre: string; reportes: ReporteDef[] }[] {
    const nombres = [...new Set(this.catalogo.map((r) => r.categoria))];
    return nombres.map((nombre) => ({ nombre, reportes: this.catalogo.filter((r) => r.categoria === nombre) }));
  }

  /** Indica si el reporte elegido admite un filtro. */
  admite(filtro: string): boolean {
    return !!this.seleccionado?.filtros.includes(filtro);
  }

  /** Elige un reporte y genera su vista previa. */
  elegir(r: ReporteDef): void {
    this.seleccionado = r;
    this.resultado = null;
    this.filtro.estado = '';
    this.consultar();
  }

  /** Filtros que aplican al reporte elegido (los demás no se envían). */
  private filtrosAplicables(): FiltroReporte {
    const f = this.filtro;
    return {
      desde: this.admite('fechas') ? f.desde : '',
      hasta: this.admite('fechas') ? f.hasta : '',
      agrupacion: this.admite('agrupacion') ? f.agrupacion : '',
      medicoId: this.admite('medico') ? f.medicoId : null,
      especializacionId: this.admite('especialidad') ? f.especializacionId : null,
      medicamentoId: this.admite('medicamento') ? f.medicamentoId : null,
      estado: this.admite('estadoFactura') || this.admite('estadoCita') ? f.estado : '',
      dias: this.admite('dias') ? f.dias : null
    };
  }

  /** Valida los filtros. */
  private validos(): boolean {
    if (this.admite('fechas') && (!this.filtro.desde || !this.filtro.hasta || this.filtro.desde > this.filtro.hasta)) {
      avisar('Rango de fechas inválido', 'Indique una fecha inicial y una final válidas.', 'warning');
      return false;
    }
    if (this.admite('dias') && (!this.filtro.dias || this.filtro.dias < 1 || this.filtro.dias > 365)) {
      avisar('Días inválidos', 'Indique entre 1 y 365 días.', 'warning');
      return false;
    }
    return true;
  }

  /** Genera la vista previa. */
  consultar(): void {
    if (!this.seleccionado || !this.validos()) {
      return;
    }
    this.cargando = true;
    this.reportes.generar(this.seleccionado.codigo, this.filtrosAplicables()).subscribe({
      next: (r) => {
        this.resultado = r;
        this.cargando = false;
      },
      error: (e: HttpErrorResponse) => {
        this.cargando = false;
        mostrarError(e, 'No se pudo generar el reporte');
      }
    });
  }

  /** Descarga el reporte en PDF o Excel con los mismos filtros. */
  descargar(formato: 'pdf' | 'excel'): void {
    if (!this.seleccionado || !this.validos()) {
      return;
    }
    const codigo = this.seleccionado.codigo;
    this.descargando = formato;
    this.reportes.descargar(codigo, formato, this.filtrosAplicables()).subscribe({
      next: (archivo) => {
        this.descargando = null;
        descargarArchivo(archivo, `reporte-${codigo}-${hoyIso()}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`);
      },
      error: (e: HttpErrorResponse) => {
        this.descargando = null;
        mostrarError(e, 'No se pudo descargar el reporte');
      }
    });
  }

  /** Indica si una columna es numérica (se alinea a la derecha). */
  numerica(c: ReporteColumna): boolean {
    return c.tipo === 'MONEDA' || c.tipo === 'ENTERO' || c.tipo === 'PORCENTAJE';
  }

  /** Indica si un valor del resumen es monetario. */
  esMoneda(clave: string): boolean {
    return /valor|total|facturado/i.test(clave);
  }

  /** Filtros iniciales: el mes en curso. */
  private filtroInicial(): FiltroReporte {
    const hoy = hoyIso();
    return {
      desde: hoy.slice(0, 8) + '01', hasta: hoy, agrupacion: 'DIA', medicoId: null, especializacionId: null,
      medicamentoId: null, estado: '', dias: 60
    };
  }
}
