import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Tarifa, LogTarifa } from 'src/app/models/tarifa';
import { Especializacion } from 'src/app/models/especializacion';
import { TarifaService } from './service/tarifa.service';
import { EspecializacionService } from '../especializacion/service/especializacion.service';

type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (el: Element) => ModalBootstrap } };

@Component({
  selector: 'app-tarifa',
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './tarifa.component.html',
  styleUrl: './tarifa.component.scss'
})
export class TarifaComponent {
  listTarifas: Tarifa[] = [];
  listEspecializaciones: Especializacion[] = [];
  listHistorial: LogTarifa[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 8;
  form!: FormGroup;
  tarifaSelected: Tarifa | null = null;
  modoFormulario = '';
  titleModal = '';
  enviando = false;
  respuestaError = '';
  modalInstance: ModalBootstrap | null = null;
  modalHistorialInstance: ModalBootstrap | null = null;

  readonly TIPOS_SERVICIO = ['CONSULTA', 'CIRUGIA', 'VACUNACION', 'GROOMING', 'EXAMEN', 'OTRO'];

  constructor(
    private tarifaService: TarifaService,
    private especializacionService: EspecializacionService,
    private fb: FormBuilder
  ) {
    this.inicializarFormulario();
    this.listar();
    this.especializacionService.listar().subscribe({ next: d => this.listEspecializaciones = d });
  }

  inicializarFormulario() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      tipoServicio: ['CONSULTA', Validators.required],
      valor: [null, [Validators.required, Validators.min(0)]],
      iva: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      activa: [true],
      especializacionId: [null],
      motivoCambio: ['']
    });
  }

  listar() {
    this.tarifaService.listar().subscribe({
      next: d => this.listTarifas = d,
      error: () => {}
    });
  }

  get f() { return this.form.controls; }

  get tarifasFiltradas(): Tarifa[] {
    const t = this.terminoBusqueda.trim().toLowerCase();
    return this.listTarifas.filter(x =>
      !t ||
      (x.nombre ?? '').toLowerCase().includes(t) ||
      (x.tipoServicio ?? '').toLowerCase().includes(t) ||
      (x.especializacion?.nombre ?? '').toLowerCase().includes(t)
    );
  }

  get tarifasPaginadas(): Tarifa[] {
    const i = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.tarifasFiltradas.slice(i, i + this.registrosPorPagina);
  }

  get totalPaginas() { return Math.ceil(this.tarifasFiltradas.length / this.registrosPorPagina); }
  get paginas() { return Array.from({ length: this.totalPaginas }, (_, i) => i + 1); }
  cambiarPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.paginaActual = p; }
  actualizarBusqueda(e: Event) { this.terminoBusqueda = (e.target as HTMLInputElement).value; this.paginaActual = 1; }

  openModal() {
    const el = document.getElementById('modalTarifa');
    if (el) {
      this.modalInstance = new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
      this.modalInstance.show();
    }
  }

  closeModal() { this.modalInstance?.hide(); }

  nueva() {
    this.tarifaSelected = null;
    this.modoFormulario = 'C';
    this.titleModal = 'Nueva Tarifa';
    this.form.reset({ tipoServicio: 'CONSULTA', iva: 0, activa: true });
    this.respuestaError = '';
    this.openModal();
  }

  editar(t: Tarifa) {
    this.tarifaSelected = t;
    this.modoFormulario = 'E';
    this.titleModal = 'Editar Tarifa';
    this.form.patchValue({
      nombre: t.nombre,
      descripcion: t.descripcion,
      tipoServicio: t.tipoServicio,
      valor: t.valor,
      iva: t.iva,
      activa: t.activa,
      especializacionId: t.especializacion?.id ?? null,
      motivoCambio: ''
    });
    this.respuestaError = '';
    this.openModal();
  }

  guardar() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.respuestaError = 'Completa los campos obligatorios: Nombre y Valor son requeridos.';
      return;
    }
    this.respuestaError = '';
    this.enviando = true;
    const rq = {
      ...this.form.value,
      id: this.tarifaSelected?.id
    };

    const obs = this.modoFormulario === 'C'
      ? this.tarifaService.crear(rq)
      : this.tarifaService.actualizar(rq);

    obs.subscribe({
      next: (res: any) => {
        this.enviando = false;
        this.closeModal();
        Swal.fire('Éxito', res.message, 'success');
        this.listar();
      },
      error: (err: any) => {
        this.enviando = false;
        this.respuestaError = err?.error?.message ?? 'Error al guardar.';
      }
    });
  }

  verHistorial(t: Tarifa) {
    this.tarifaSelected = t;
    this.tarifaService.listarHistorial(t.id!).subscribe({
      next: d => {
        this.listHistorial = d;
        const el = document.getElementById('modalHistorial');
        if (el) {
          this.modalHistorialInstance = new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
          this.modalHistorialInstance.show();
        }
      }
    });
  }
}
