import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { FormulaService } from './service/formula.service';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { PaginacionComponent } from 'src/app/shared/paginacion/paginacion.component';
import { abrirPdf, compararValores, normalizarTexto, obtenerMensajeError } from 'src/app/utils/utilidades';

type ColumnaOrden = 'id' | 'fecha' | 'mascota' | 'cliente' | 'medico' | 'estado';

/**
 * Consulta de fórmulas médicas. Las fórmulas se crean al finalizar la atención de la cita.
 */
@Component({
  selector: 'app-formula',
  imports: [CommonModule, FormsModule, NgbTooltipModule, PaginacionComponent],
  templateUrl: './formula.component.html',
  styleUrl: './formula.component.scss'
})
export class FormulaComponent {
  readonly nombresEstado: Record<string, string> = {
    PENDIENTE_DESPACHO: 'Pendiente de despacho', EN_PREPARACION: 'En preparación', DESPACHO_PARCIAL: 'Despacho parcial',
    DESPACHADO: 'Despachado', PENDIENTE_DISPONIBILIDAD: 'Sin disponibilidad', CANCELADO: 'Cancelado'
  };
  readonly claseEstado: Record<string, string> = {
    PENDIENTE_DESPACHO: 'estado-pendiente', EN_PREPARACION: 'estado-confirmada', DESPACHO_PARCIAL: 'estado-programada',
    DESPACHADO: 'estado-activa', PENDIENTE_DISPONIBILIDAD: 'estado-cancelada', CANCELADO: 'estado-inactiva'
  };

  formulas: FormulaMedica[] = [];
  cargando = false;
  buscar = '';
  filtroEstado = '';
  pagina = 1;
  readonly porPagina = 8;
  columna: ColumnaOrden = 'id';
  direccion: 'asc' | 'desc' = 'desc';

  detalle: FormulaMedica | null = null;
  private modal: Modal | null = null;

  constructor(private readonly formulaService: FormulaService) {
    this.listar();
  }

  listar() {
    this.cargando = true;
    this.formulaService.listarFormulas().subscribe({
      next: (f) => { this.formulas = f; this.cargando = false; },
      error: (e: HttpErrorResponse) => { this.cargando = false; Swal.fire('Error', obtenerMensajeError(e), 'error'); }
    });
  }

  get filtradas(): FormulaMedica[] {
    const t = normalizarTexto(this.buscar.trim());
    return this.formulas
      .filter((f) => !this.filtroEstado || f.estadoDespacho === this.filtroEstado)
      .filter((f) => !t || [String(f.id), f.mascotaNombre, f.clienteNombre, f.medicoNombre, f.medicamentosResumen]
        .some((v) => normalizarTexto(v ?? '').includes(t)))
      .sort((a, b) => compararValores(this.valor(a), this.valor(b), this.direccion));
  }

  private valor(f: FormulaMedica): string | number {
    switch (this.columna) {
      case 'fecha': return f.fechaCreacionRegistro ?? '';
      case 'mascota': return f.mascotaNombre ?? '';
      case 'cliente': return f.clienteNombre ?? '';
      case 'medico': return f.medicoNombre ?? '';
      case 'estado': return f.estadoDespacho ?? '';
      default: return f.id ?? 0;
    }
  }

  get paginadas(): FormulaMedica[] {
    const i = (this.pagina - 1) * this.porPagina;
    return this.filtradas.slice(i, i + this.porPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.filtradas.length / this.porPagina);
  }

  ordenar(c: ColumnaOrden) {
    this.direccion = this.columna === c && this.direccion === 'asc' ? 'desc' : 'asc';
    this.columna = c;
  }

  icono(c: ColumnaOrden): string {
    return this.columna !== c ? 'fa-sort' : this.direccion === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  verDetalle(f: FormulaMedica) {
    this.formulaService.consultarFormula(f.id!).subscribe({
      next: (d) => {
        this.detalle = d;
        const el = document.getElementById('modalDetalleFormula');
        if (el) {
          this.modal ??= new Modal(el);
          this.modal.show();
        }
      },
      error: (e: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(e), 'error')
    });
  }

  pdf(f: FormulaMedica) {
    this.formulaService.pdf(f.id!).subscribe({
      next: (b) => abrirPdf(b),
      error: () => Swal.fire('Error', 'No se pudo generar el PDF', 'error')
    });
  }

  inactivar(f: FormulaMedica) {
    Swal.fire({ title: `¿Inactivar la fórmula #${f.id}?`, text: 'Solo es posible si aún no se ha despachado nada.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Inactivar', cancelButtonText: 'Cancelar'
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.formulaService.inactivarFormula(f.id!).subscribe({
        next: (rta) => { this.listar(); Swal.fire('Listo', rta.message, 'success'); },
        error: (e: HttpErrorResponse) => Swal.fire('No se pudo', obtenerMensajeError(e), 'error')
      });
    });
  }
}
