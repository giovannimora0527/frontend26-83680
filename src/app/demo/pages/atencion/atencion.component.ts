import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { AtencionService } from './atencion.service';
import { InventarioService } from '../inventario/service/inventario.service';
import { AtencionInfo, AtencionRq, AtencionRs } from 'src/app/models/clinica';
import { ProductoInventario } from 'src/app/models/inventario';
import { abrirPdf, claseEstado, obtenerMensajeError, pesos } from 'src/app/utils/utilidades';

/**
 * Atencion de una cita por el medico: consulta antecedentes, registra la consulta,
 * genera la formula y la prefactura.
 */
@Component({
  selector: 'app-atencion',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './atencion.component.html',
  styleUrl: './atencion.component.scss'
})
export class AtencionComponent {
  readonly claseEstado = claseEstado;
  readonly pesos = pesos;
  readonly vias = ['Oral', 'Tópica', 'Oftálmica', 'Ótica', 'Subcutánea', 'Intramuscular', 'Intravenosa', 'Inhalada', 'Rectal', 'Otra'];

  citaId: number;
  info: AtencionInfo | null = null;
  cargando = true;
  medicamentos: ProductoInventario[] = [];
  form: FormGroup;
  enviando = false;
  resultado: AtencionRs | null = null;

  constructor(route: ActivatedRoute,
    private readonly router: Router,
    private readonly atencionService: AtencionService,
    private readonly inventarioService: InventarioService,
    private readonly fb: FormBuilder) {
    this.citaId = Number(route.snapshot.paramMap.get('id'));
    this.form = this.fb.group({
      tarifaId: [null, Validators.required],
      motivo: ['', Validators.required],
      sintomas: ['', Validators.required],
      diagnostico: ['', Validators.required],
      observaciones: [''],
      recomendaciones: [''],
      indicacionesFormula: [''],
      medicamentos: this.fb.array([])
    });
    this.cargar();
    this.inventarioService.listar().subscribe({
      next: (data) => this.medicamentos = data.filter((m) => m.activo !== false)
    });
  }

  /** Lista de medicamentos formulados. */
  get lineas(): FormArray {
    return this.form.get('medicamentos') as FormArray;
  }

  /** Carga los datos de la cita. */
  cargar() {
    this.cargando = true;
    this.atencionService.consultar(this.citaId).subscribe({
      next: (info) => {
        this.info = info;
        this.cargando = false;
        this.form.patchValue({ motivo: info.cita.motivo });
        // Si solo hay un servicio de la especialidad, se preselecciona
        const deEspecialidad = info.servicios.filter((s) => s.especializacion);
        if (deEspecialidad.length === 1) {
          this.form.patchValue({ tarifaId: deEspecialidad[0].id });
        }
      },
      error: (e: HttpErrorResponse) => {
        this.cargando = false;
        Swal.fire('Error', obtenerMensajeError(e), 'error');
        this.router.navigate(['/inicio/agenda']);
      }
    });
  }

  /** Agrega un medicamento a la formula. */
  agregarMedicamento() {
    this.lineas.push(this.fb.group({
      medicamentoId: [null, Validators.required],
      dosis: ['', Validators.required],
      frecuencia: ['', Validators.required],
      duracionDias: [null, [Validators.required, Validators.min(1), Validators.max(365)]],
      cantidad: [null, [Validators.required, Validators.min(1), Validators.max(1000)]],
      viaAdministracion: ['Oral', Validators.required],
      indicaciones: ['']
    }));
  }

  /** Quita un medicamento de la formula. */
  quitarMedicamento(i: number) {
    this.lineas.removeAt(i);
  }

  /**
   * Producto elegido en una linea (para mostrar disponibilidad).
   * @param i posicion.
   */
  producto(i: number): ProductoInventario | undefined {
    const id = this.lineas.at(i).get('medicamentoId')?.value;
    return this.medicamentos.find((m) => m.id === id);
  }

  /** Envia la atencion al backend. */
  finalizar() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      Swal.fire('Faltan datos', 'Revise los campos obligatorios de la consulta y de la fórmula', 'warning');
      return;
    }
    Swal.fire({
      title: '¿Finalizar la atención?',
      text: 'La información queda en la historia clínica y la cita pasa a atendida. Después no se puede modificar.',
      icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, finalizar', cancelButtonText: 'Revisar'
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      const v = this.form.getRawValue();
      const rq: AtencionRq = { citaId: this.citaId, ...v, tarifaId: Number(v.tarifaId) };
      this.enviando = true;
      this.atencionService.finalizar(rq).subscribe({
        next: (rs) => {
          this.enviando = false;
          this.resultado = rs;
          Swal.fire({ title: 'Atención finalizada', html: rs.message + (rs.advertencias.length
            ? '<br><br><b>Avisos:</b><br>' + rs.advertencias.join('<br>') : ''), icon: rs.advertencias.length ? 'warning' : 'success' });
          this.cargar();
        },
        error: (e: HttpErrorResponse) => { this.enviando = false; Swal.fire('No se pudo finalizar', obtenerMensajeError(e), 'error'); }
      });
    });
  }

  /** Abre la prefactura en PDF. */
  prefactura() {
    this.atencionService.prefactura(this.citaId).subscribe({
      next: (pdf) => abrirPdf(pdf),
      error: () => Swal.fire('Error', 'No se pudo generar la prefactura', 'error')
    });
  }

  /** Abre la formula en PDF. */
  formulaPdf(formulaId: number) {
    this.atencionService.formulaPdf(formulaId).subscribe({
      next: (pdf) => abrirPdf(pdf),
      error: () => Swal.fire('Error', 'No se pudo generar la fórmula', 'error')
    });
  }
}
