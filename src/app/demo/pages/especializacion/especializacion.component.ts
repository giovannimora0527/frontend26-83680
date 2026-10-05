import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Especializacion } from 'src/app/models/especializacion';
import { EspecializacionService } from 'src/app/services/especializacion.service';

@Component({
  selector: 'app-especializacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './especializacion.component.html',
  styleUrls: ['./especializacion.component.scss']
})
export class EspecializacionComponent implements OnInit {

  especializaciones: Especializacion[] = [];
  especializacionesFiltradas: Especializacion[] = [];

  especializacionFormulario: Especializacion = {};

  modoEdicion = false;

  terminoBusqueda = '';

  mensaje = '';
  error = '';

  constructor(
    private readonly especializacionService: EspecializacionService
  ) {}

  ngOnInit(): void {
    this.cargarEspecializaciones();
  }

  cargarEspecializaciones(): void {

    this.especializacionService.listar().subscribe({
      next: (respuesta) => {

        this.especializaciones = respuesta;
        this.especializacionesFiltradas = respuesta;

      },
      error: (error) => {

        console.error(
          'Error al cargar especializaciones:',
          error
        );

        this.error =
          error?.error?.message ||
          'No fue posible cargar las especializaciones.';
      }
    });
  }

  guardarEspecializacion(): void {

    this.mensaje = '';
    this.error = '';

    if (
      !this.especializacionFormulario.nombre ||
      this.especializacionFormulario.nombre.trim() === ''
    ) {

      this.error =
        'El nombre de la especialización es obligatorio.';

      return;
    }

    if (
      !this.especializacionFormulario.codigoEspecializacion ||
      this.especializacionFormulario.codigoEspecializacion
        .trim() === ''
    ) {

      this.error =
        'El código de especialización es obligatorio.';

      return;
    }

    if (
      this.modoEdicion &&
      this.especializacionFormulario.id
    ) {

      this.especializacionService
        .actualizar(
          this.especializacionFormulario.id,
          this.especializacionFormulario
        )
        .subscribe({

          next: () => {

            this.mensaje =
              'Especialización actualizada correctamente.';

            this.limpiarFormulario();
            this.cargarEspecializaciones();
          },

          error: (error) => {

            console.error(
              'Error al actualizar especialización:',
              error
            );

            this.error =
              error?.error?.message ||
              'No fue posible actualizar la especialización.';
          }
        });

    } else {

      this.especializacionService
        .crear(this.especializacionFormulario)
        .subscribe({

          next: () => {

            this.mensaje =
              'Especialización creada correctamente.';

            this.limpiarFormulario();
            this.cargarEspecializaciones();
          },

          error: (error) => {

            console.error(
              'Error al crear especialización:',
              error
            );

            this.error =
              error?.error?.message ||
              'No fue posible crear la especialización.';
          }
        });
    }
  }

  editarEspecializacion(
    especializacion: Especializacion
  ): void {

    this.modoEdicion = true;

    this.especializacionFormulario = {

      id: especializacion.id,

      nombre: especializacion.nombre,

      descripcion: especializacion.descripcion,

      codigoEspecializacion:
        especializacion.codigoEspecializacion
    };
  }

  limpiarFormulario(): void {

    this.especializacionFormulario = {};

    this.modoEdicion = false;

    this.mensaje = '';
    this.error = '';
  }

  buscarEspecializaciones(): void {

    const texto =
      this.terminoBusqueda
        .trim()
        .toLowerCase();

    if (!texto) {

      this.especializacionesFiltradas =
        this.especializaciones;

      return;
    }

    this.especializacionesFiltradas =
      this.especializaciones.filter(
        (especializacion) => {

          const nombre =
            especializacion.nombre
              ?.toLowerCase() || '';

          const descripcion =
            especializacion.descripcion
              ?.toLowerCase() || '';

          const codigo =
            especializacion.codigoEspecializacion
              ?.toLowerCase() || '';

          return (
            nombre.includes(texto) ||
            descripcion.includes(texto) ||
            codigo.includes(texto)
          );
        }
      );
  }
}