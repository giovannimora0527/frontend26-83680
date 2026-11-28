import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AtencionMedica } from 'src/app/models/atencion-medica';
import { Cita } from 'src/app/models/cita';
import { Medicamento } from 'src/app/models/medicamento';
import { AtencionService } from './service/atencion.service';
import { CitaService } from '../cita/service/cita.service';
import { MedicamentoService } from '../medicamento/service/medicamento.service';

type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (el: Element) => ModalBootstrap } };

@Component({
  selector: 'app-atencion',
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './atencion.component.html',
  styleUrl: './atencion.component.scss'
})
export class AtencionComponent implements OnInit {
  listCitas: Cita[] = [];
  listMedicamentos: Medicamento[] = [];
  atencionActual: AtencionMedica | null = null;
  citaSeleccionada: Cita | null = null;
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 8;
  form!: FormGroup;
  formulaForm!: FormGroup;
  enviando = false;
  respuestaError = '';
  modalInstance: ModalBootstrap | null = null;
  modalFormulaInstance: ModalBootstrap | null = null;

  constructor(
    private atencionService: AtencionService,
    private citaService: CitaService,
    private medicamentoService: MedicamentoService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.inicializarForm();
    this.inicializarFormulaForm();
    this.cargarCitas();
    this.medicamentoService.listarMedicamentos().subscribe({ next: d => this.listMedicamentos = d });
  }

  inicializarForm() {
    this.form = this.fb.group({
      motivoConsulta: ['', Validators.required],
      sintomas: [''],
      diagnostico: ['', Validators.required],
      observaciones: [''],
      recomendaciones: [''],
      estado: ['EN_CURSO', Validators.required]
    });
  }

  inicializarFormulaForm() {
    this.formulaForm = this.fb.group({
      medicamentoId: [null, Validators.required],
      dosis: ['', Validators.required],
      frecuencia: ['', Validators.required],
      duracion: ['', Validators.required],
      cantidad: [''],
      viaAdministracion: [''],
      indicaciones: ['']
    });
  }

  cargarCitas() {
    this.citaService.listarCitas().subscribe({
      next: d => {
        this.listCitas = d.filter(c =>
          c.estado === 'programada' || c.estado === 'confirmada' || c.estado === 'atendida'
        );
      }
    });
  }

  get f() { return this.form.controls; }
  get ff() { return this.formulaForm.controls; }

  get citasFiltradas(): Cita[] {
    const t = this.terminoBusqueda.trim().toLowerCase();
    return this.listCitas.filter(c =>
      !t ||
      (c.mascota?.nombreMascota ?? '').toLowerCase().includes(t) ||
      (c.medico?.nombres ?? '').toLowerCase().includes(t) ||
      (c.cliente?.nombres ?? '').toLowerCase().includes(t)
    );
  }

  get citasPaginadas(): Cita[] {
    const i = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.citasFiltradas.slice(i, i + this.registrosPorPagina);
  }

  get totalPaginas() { return Math.ceil(this.citasFiltradas.length / this.registrosPorPagina); }
  get paginas() { return Array.from({ length: this.totalPaginas }, (_, i) => i + 1); }
  cambiarPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.paginaActual = p; }
  actualizarBusqueda(e: Event) { this.terminoBusqueda = (e.target as HTMLInputElement).value; this.paginaActual = 1; }

  atender(cita: Cita) {
    this.citaSeleccionada = cita;
    this.atencionActual = null;
    this.form.reset({ estado: 'EN_CURSO' });
    this.respuestaError = '';
    // Buscar atencion existente
    this.atencionService.buscarPorCita(cita.id!).subscribe({
      next: a => {
        this.atencionActual = a;
        this.form.patchValue({
          motivoConsulta: a.motivoConsulta,
          sintomas: a.sintomas,
          diagnostico: a.diagnostico,
          observaciones: a.observaciones,
          recomendaciones: a.recomendaciones,
          estado: a.estado
        });
      },
      error: () => {}
    });
    const el = document.getElementById('modalAtencion');
    if (el) {
      this.modalInstance = new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
      this.modalInstance.show();
    }
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.enviando = true;
    const rq = {
      ...this.form.value,
      id: this.atencionActual?.id,
      citaId: this.citaSeleccionada?.id
    };
    const obs = this.atencionActual
      ? this.atencionService.actualizar(rq)
      : this.atencionService.guardar(rq);

    obs.subscribe({
      next: (res: any) => {
        this.enviando = false;
        this.modalInstance?.hide();
        Swal.fire('Éxito', res.message, 'success');
        this.cargarCitas();
      },
      error: (err: any) => {
        this.enviando = false;
        this.respuestaError = err?.error?.message ?? 'Error al guardar atención.';
      }
    });
  }

  abrirFormula(cita: Cita) {
    this.citaSeleccionada = cita;
    this.formulaForm.reset();
    this.respuestaError = '';
    const el = document.getElementById('modalFormula');
    if (el) {
      this.modalFormulaInstance = new (window as unknown as WindowBootstrap).bootstrap.Modal(el);
      this.modalFormulaInstance.show();
    }
  }

  guardarFormula() {
    this.modalFormulaInstance?.hide();
    Swal.fire('Info', 'Use el módulo de Fórmulas Médicas para agregar fórmulas a esta cita.', 'info');
  }

  badgeEstado(estado: string | undefined): string {
    switch (estado) {
      case 'programada': return 'badge bg-warning text-dark';
      case 'confirmada': return 'badge bg-info text-dark';
      case 'atendida': return 'badge bg-success';
      case 'cancelada': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
}
