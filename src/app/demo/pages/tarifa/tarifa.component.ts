import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { TarifaService } from './service/tarifa.service';
import { Especialidad, Tarifa, TarifaLog } from 'src/app/models/clinica';
import { normalizarTexto, obtenerMensajeError, pesos } from 'src/app/utils/utilidades';

/**
 * Modulo administrativo de especialidades y tarifas (con IVA y log de cambios).
 */
@Component({
  selector: 'app-tarifa',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './tarifa.component.html'
})
export class TarifaComponent {
  readonly pesos = pesos;
  pestana: 'tarifas' | 'especialidades';

  tarifas: Tarifa[] = [];
  especialidades: Especialidad[] = [];
  buscar = '';
  filtroTipo = '';
  formTarifa: FormGroup;
  formEspecialidad: FormGroup;
  tarifaEditando: Tarifa | null = null;
  especialidadEditando: Especialidad | null = null;
  logs: TarifaLog[] = [];
  tarifaLog: Tarifa | null = null;
  enviando = false;
  private modales: Record<string, Modal> = {};

  constructor(private readonly tarifaService: TarifaService, route: ActivatedRoute, fb: FormBuilder) {
    this.pestana = route.snapshot.data['pestana'] ?? 'tarifas';
    this.formTarifa = fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{2,20}$/)]],
      nombre: ['', Validators.required],
      tipo: ['CONSULTA', Validators.required],
      especializacionId: [null],
      valor: [null, [Validators.required, Validators.min(1)]],
      ivaPorcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
    this.formEspecialidad = fb.group({
      codigoEspecializacion: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{2,10}$/)]],
      nombre: ['', Validators.required],
      descripcion: ['']
    });
    this.cargar();
  }

  cargar() {
    this.tarifaService.listar().subscribe({ next: (t) => this.tarifas = t, error: (e: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(e), 'error') });
    this.tarifaService.especialidades().subscribe({ next: (e) => this.especialidades = e });
  }

  get tarifasFiltradas(): Tarifa[] {
    const t = normalizarTexto(this.buscar);
    return this.tarifas.filter((x) => (!this.filtroTipo || x.tipo === this.filtroTipo)
      && (!t || normalizarTexto(`${x.codigo} ${x.nombre} ${x.especializacion?.nombre ?? ''}`).includes(t)));
  }

  get especialidadesFiltradas(): Especialidad[] {
    const t = normalizarTexto(this.buscar);
    return this.especialidades.filter((e) => !t || normalizarTexto(`${e.codigoEspecializacion} ${e.nombre}`).includes(t));
  }

  total(t: Tarifa): number {
    return t.valor + t.valor * t.ivaPorcentaje / 100;
  }

  // ------------------------------------------------------------------ tarifas

  nuevaTarifa() {
    this.tarifaEditando = null;
    this.formTarifa.reset({ tipo: 'CONSULTA', ivaPorcentaje: 0, especializacionId: null });
    this.abrir('modalTarifa');
  }

  editarTarifa(t: Tarifa) {
    this.tarifaEditando = t;
    this.formTarifa.reset({ ...t, especializacionId: t.especializacion?.id ?? null });
    this.abrir('modalTarifa');
  }

  guardarTarifa() {
    if (this.formTarifa.invalid || this.enviando) { this.formTarifa.markAllAsTouched(); return; }
    const v = this.formTarifa.getRawValue();
    const tarifa: Tarifa = { ...v, id: this.tarifaEditando?.id, valor: Number(v.valor), ivaPorcentaje: Number(v.ivaPorcentaje) };
    this.enviando = true;
    (this.tarifaEditando ? this.tarifaService.actualizar(tarifa) : this.tarifaService.guardar(tarifa)).subscribe({
      next: (r) => { this.enviando = false; this.modales['modalTarifa']?.hide(); this.cargar(); Swal.fire('Listo', r.message, 'success'); },
      error: (e: HttpErrorResponse) => { this.enviando = false; Swal.fire('No se pudo guardar', obtenerMensajeError(e), 'error'); }
    });
  }

  estadoTarifa(t: Tarifa) {
    this.tarifaService.cambiarEstado(t.id!, !t.activo).subscribe({
      next: (r) => { this.cargar(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: r.message, timer: 2000, showConfirmButton: false }); },
      error: (e: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(e), 'error')
    });
  }

  verLog(t: Tarifa) {
    this.tarifaLog = t;
    this.logs = [];
    this.tarifaService.log(t.id!).subscribe({ next: (l) => this.logs = l });
    this.abrir('modalLogTarifa');
  }

  // ------------------------------------------------------------------ especialidades

  nuevaEspecialidad() {
    this.especialidadEditando = null;
    this.formEspecialidad.reset();
    this.abrir('modalEspecialidad');
  }

  editarEspecialidad(e: Especialidad) {
    this.especialidadEditando = e;
    this.formEspecialidad.reset(e);
    this.abrir('modalEspecialidad');
  }

  guardarEspecialidad() {
    if (this.formEspecialidad.invalid || this.enviando) { this.formEspecialidad.markAllAsTouched(); return; }
    const e: Especialidad = { ...this.formEspecialidad.getRawValue(), id: this.especialidadEditando?.id };
    this.enviando = true;
    (this.especialidadEditando ? this.tarifaService.actualizarEspecialidad(e) : this.tarifaService.guardarEspecialidad(e)).subscribe({
      next: (r) => { this.enviando = false; this.modales['modalEspecialidad']?.hide(); this.cargar(); Swal.fire('Listo', r.message, 'success'); },
      error: (err: HttpErrorResponse) => { this.enviando = false; Swal.fire('No se pudo guardar', obtenerMensajeError(err), 'error'); }
    });
  }

  estadoEspecialidad(e: Especialidad) {
    this.tarifaService.estadoEspecialidad(e.id!, !e.activo).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => Swal.fire('Error', obtenerMensajeError(err), 'error')
    });
  }

  private abrir(id: string) {
    const el = document.getElementById(id);
    if (el) {
      this.modales[id] ??= new Modal(el);
      this.modales[id].show();
    }
  }
}
