import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FormulaMedica } from 'src/app/models/formula-medica';
import { Cita } from 'src/app/models/cita';
import { Medicamento } from 'src/app/models/medicamentos';
import { FormulaMedicaService } from 'src/app/services/formula-medica-.service';
import { CitaService } from 'src/app/services/cita.service';
import { MedicamentoService } from 'src/app/services/medicamento.service';

@Component({
  selector: 'app-formula-medica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './formula-medica.component.html',
  styleUrls: ['./formula-medica.component.scss']
})
export class FormulaMedicaComponent implements OnInit {

  formulas: FormulaMedica[] = [];

  citas: Cita[] = [];

  medicamentos: Medicamento[] = [];

  formula: FormulaMedica = {};

  editando = false;

  busqueda = '';

  mensaje = '';

  error = '';

  constructor(
    private readonly formulaMedicaService: FormulaMedicaService,
    private readonly citaService: CitaService,
    private readonly medicamentoService: MedicamentoService
  ) {}

  ngOnInit(): void {
    this.listarFormulas();
    this.listarCitas();
    this.listarMedicamentos();
  }

  listarFormulas(): void {

    this.mensaje = '';
    this.error = '';

    this.formulaMedicaService.listar().subscribe({

      next: (data) => {
        this.formulas = data;
      },

      error: (error) => {

        console.error(
          'Error al listar fórmulas médicas:',
          error
        );

        this.error =
          'No fue posible cargar las fórmulas médicas.';
      }

    });
  }

  listarCitas(): void {

    this.citaService.listar().subscribe({

      next: (data) => {
        this.citas = data;
      },

      error: (error) => {

        console.error(
          'Error al listar citas:',
          error
        );

        this.error =
          'No fue posible cargar las citas.';
      }

    });
  }

  listarMedicamentos(): void {

    this.medicamentoService.listar().subscribe({

      next: (data) => {
        this.medicamentos = data;
      },

      error: (error) => {

        console.error(
          'Error al listar medicamentos:',
          error
        );

        this.error =
          'No fue posible cargar los medicamentos.';
      }

    });
  }

  guardar(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.formula.citaId) {

      this.error =
        'Debe seleccionar una cita.';

      return;
    }

    if (!this.formula.medicamentoId) {

      this.error =
        'Debe seleccionar un medicamento.';

      return;
    }

    if (
      !this.formula.dosis ||
      this.formula.dosis.trim() === ''
    ) {

      this.error =
        'Debe ingresar la dosis.';

      return;
    }

    if (
      !this.formula.indicaciones ||
      this.formula.indicaciones.trim() === ''
    ) {

      this.error =
        'Debe ingresar las indicaciones.';

      return;
    }

    if (
      this.editando &&
      this.formula.id
    ) {

      this.formulaMedicaService
        .actualizar(
          this.formula.id,
          this.formula
        )
        .subscribe({

          next: () => {

            this.mensaje =
              'Fórmula médica actualizada correctamente.';

            this.listarFormulas();

            this.limpiar();
          },

          error: (error) => {

            console.error(
              'Error al actualizar fórmula médica:',
              error
            );

            this.error =
              'No fue posible actualizar la fórmula médica.';
          }

        });

    } else {

      this.formulaMedicaService
        .crear(this.formula)
        .subscribe({

          next: () => {

            this.mensaje =
              'Fórmula médica creada correctamente.';

            this.listarFormulas();

            this.limpiar();
          },

          error: (error) => {

            console.error(
              'Error al crear fórmula médica:',
              error
            );

            this.error =
              'No fue posible crear la fórmula médica.';
          }

        });
    }
  }

  editar(formula: FormulaMedica): void {

    this.formula = {

      id: formula.id,

      citaId: formula.citaId,

      medicamentoId: formula.medicamentoId,

      dosis: formula.dosis,

      indicaciones: formula.indicaciones,

      fechaCreacionRegistro:
        formula.fechaCreacionRegistro,

      fechaActualizacionRegistro:
        formula.fechaActualizacionRegistro

    };

    this.editando = true;

    this.mensaje = '';

    this.error = '';
  }

  limpiar(): void {

    this.formula = {};

    this.editando = false;
  }

  obtenerNombreMedicamento(
    medicamentoId?: number
  ): string {

    if (!medicamentoId) {
      return 'Sin medicamento';
    }

    const medicamento =
      this.medicamentos.find(
        (item) => item.id === medicamentoId
      );

    if (!medicamento) {
      return `Medicamento ID: ${medicamentoId}`;
    }

    return medicamento.nombre ||
      `Medicamento ID: ${medicamentoId}`;
  }

  obtenerDescripcionCita(
    citaId?: number
  ): string {

    if (!citaId) {
      return 'Sin cita';
    }

    const cita =
      this.citas.find(
        (item) => item.id === citaId
      );

    if (!cita) {
      return `Cita ID: ${citaId}`;
    }

    const fecha =
      cita.fechaHora
        ? this.formatearFecha(cita.fechaHora)
        : '';

    const estado =
      cita.estado || '';

    return `Cita #${cita.id}${fecha ? ' - ' + fecha : ''}${estado ? ' - ' + estado : ''}`;
  }

  formatearFecha(
    fecha: string | Date
  ): string {

    const fechaConvertida =
      new Date(fecha);

    if (
      isNaN(
        fechaConvertida.getTime()
      )
    ) {
      return String(fecha);
    }

    return fechaConvertida.toLocaleString(
      'es-CO',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  }

  get formulasFiltradas(): FormulaMedica[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    if (!texto) {
      return this.formulas;
    }

    return this.formulas.filter(
      (formula) => {

        const medicamento =
          this.obtenerNombreMedicamento(
            formula.medicamentoId
          ).toLowerCase();

        const cita =
          this.obtenerDescripcionCita(
            formula.citaId
          ).toLowerCase();

        const dosis =
          (
            formula.dosis ?? ''
          ).toLowerCase();

        const indicaciones =
          (
            formula.indicaciones ?? ''
          ).toLowerCase();

        return (
          medicamento.includes(texto) ||
          cita.includes(texto) ||
          dosis.includes(texto) ||
          indicaciones.includes(texto) ||
          String(
            formula.id ?? ''
          ).includes(texto)
        );
      }
    );
  }
}