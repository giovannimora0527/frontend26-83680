import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Medicamento } from 'src/app/models/medicamentos';
import { MedicamentoService } from 'src/app/services/medicamento.service';

@Component({
  selector: 'app-medicamento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './medicamento.component.html',
  styleUrls: ['./medicamento.component.scss']
})
export class MedicamentoComponent implements OnInit {

  medicamentos: Medicamento[] = [];
  medicamentosFiltrados: Medicamento[] = [];

  medicamentoFormulario: Medicamento = {};

  modoEdicion = false;

  terminoBusqueda = '';

  mensaje = '';
  error = '';

  constructor(
    private readonly medicamentoService: MedicamentoService
  ) {}

  ngOnInit(): void {
    this.cargarMedicamentos();
  }

  cargarMedicamentos(): void {

    this.medicamentoService.listar().subscribe({
      next: (respuesta) => {

        this.medicamentos = respuesta;
        this.medicamentosFiltrados = respuesta;

      },

      error: (error) => {

        console.error(
          'Error al cargar medicamentos:',
          error
        );

        this.error =
          error?.error?.message ||
          'No fue posible cargar los medicamentos.';
      }
    });
  }

  guardarMedicamento(): void {

    this.mensaje = '';
    this.error = '';

    if (
      !this.medicamentoFormulario.nombre ||
      this.medicamentoFormulario.nombre.trim() === ''
    ) {

      this.error =
        'El nombre del medicamento es obligatorio.';

      return;
    }

    if (
      this.medicamentoFormulario.fechaCompra &&
      this.medicamentoFormulario.fechaVence
    ) {

      const fechaCompra =
        new Date(
          this.medicamentoFormulario.fechaCompra
        );

      const fechaVence =
        new Date(
          this.medicamentoFormulario.fechaVence
        );

      if (fechaVence < fechaCompra) {

        this.error =
          'La fecha de vencimiento no puede ser anterior a la fecha de compra.';

        return;
      }
    }

    if (
      this.modoEdicion &&
      this.medicamentoFormulario.id
    ) {

      this.medicamentoService
        .actualizar(
          this.medicamentoFormulario.id,
          this.medicamentoFormulario
        )
        .subscribe({

          next: () => {

            this.mensaje =
              'Medicamento actualizado correctamente.';

            this.limpiarFormulario();
            this.cargarMedicamentos();
          },

          error: (error) => {

            console.error(
              'Error al actualizar medicamento:',
              error
            );

            this.error =
              error?.error?.message ||
              'No fue posible actualizar el medicamento.';
          }
        });

    } else {

      this.medicamentoService
        .crear(this.medicamentoFormulario)
        .subscribe({

          next: () => {

            this.mensaje =
              'Medicamento creado correctamente.';

            this.limpiarFormulario();
            this.cargarMedicamentos();
          },

          error: (error) => {

            console.error(
              'Error al crear medicamento:',
              error
            );

            this.error =
              error?.error?.message ||
              'No fue posible crear el medicamento.';
          }
        });
    }
  }

  editarMedicamento(
    medicamento: Medicamento
  ): void {

    this.modoEdicion = true;

    this.medicamentoFormulario = {

      id: medicamento.id,

      nombre: medicamento.nombre,

      descripcion: medicamento.descripcion,

      presentacion: medicamento.presentacion,

      fechaCompra: medicamento.fechaCompra,

      fechaVence: medicamento.fechaVence,

      fechaCreacionRegistro:
        medicamento.fechaCreacionRegistro,

      fechaModificacionRegistro:
        medicamento.fechaModificacionRegistro
    };
  }

  limpiarFormulario(): void {

    this.medicamentoFormulario = {};

    this.modoEdicion = false;

    this.mensaje = '';
    this.error = '';
  }

  buscarMedicamentos(): void {

    const texto =
      this.terminoBusqueda
        .trim()
        .toLowerCase();

    if (!texto) {

      this.medicamentosFiltrados =
        this.medicamentos;

      return;
    }

    this.medicamentosFiltrados =
      this.medicamentos.filter(
        (medicamento) => {

          const nombre =
            medicamento.nombre?.toLowerCase() || '';

          const descripcion =
            medicamento.descripcion?.toLowerCase() || '';

          const presentacion =
            medicamento.presentacion?.toLowerCase() || '';

          return (
            nombre.includes(texto) ||
            descripcion.includes(texto) ||
            presentacion.includes(texto)
          );
        }
      );
  }
}