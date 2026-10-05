import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Raza } from 'src/app/models/raza';
import { RazaService } from 'src/app/services/raza.service';

@Component({
  selector: 'app-raza',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './raza.component.html',
  styleUrls: ['./raza.component.scss']
})
export class RazaComponent implements OnInit {

  razas: Raza[] = [];
  razasFiltradas: Raza[] = [];

  razaFormulario: Raza = {};

  modoEdicion = false;

  terminoBusqueda = '';

  mensaje = '';
  error = '';

  constructor(
    private readonly razaService: RazaService
  ) {}

  ngOnInit(): void {
    this.cargarRazas();
  }

  cargarRazas(): void {

    this.razaService.listar().subscribe({
      next: (respuesta) => {

        this.razas = respuesta;
        this.razasFiltradas = respuesta;

      },
      error: (error) => {

        console.error(
          'Error al cargar razas:',
          error
        );

        this.error =
          error?.error?.message ||
          'No fue posible cargar las razas.';
      }
    });
  }

  guardarRaza(): void {

    this.mensaje = '';
    this.error = '';

    if (
      !this.razaFormulario.nombre ||
      this.razaFormulario.nombre.trim() === ''
    ) {

      this.error =
        'El nombre de la raza es obligatorio.';

      return;
    }

    if (
      !this.razaFormulario.especie ||
      this.razaFormulario.especie.trim() === ''
    ) {

      this.error =
        'La especie es obligatoria.';

      return;
    }

    if (
      this.modoEdicion &&
      this.razaFormulario.razaId
    ) {

      this.razaService.actualizar(
        this.razaFormulario.razaId,
        this.razaFormulario
      ).subscribe({

        next: () => {

          this.mensaje =
            'Raza actualizada correctamente.';

          this.limpiarFormulario();
          this.cargarRazas();

        },

        error: (error) => {

          console.error(
            'Error al actualizar raza:',
            error
          );

          this.error =
            error?.error?.message ||
            'No fue posible actualizar la raza.';
        }
      });

    } else {

      this.razaService.crear(
        this.razaFormulario
      ).subscribe({

        next: () => {

          this.mensaje =
            'Raza creada correctamente.';

          this.limpiarFormulario();
          this.cargarRazas();

        },

        error: (error) => {

          console.error(
            'Error al crear raza:',
            error
          );

          this.error =
            error?.error?.message ||
            'No fue posible crear la raza.';
        }
      });
    }
  }

  editarRaza(raza: Raza): void {

    this.modoEdicion = true;

    this.razaFormulario = {
      razaId: raza.razaId,
      nombre: raza.nombre,
      especie: raza.especie,
      fechaCreacion: raza.fechaCreacion,
      fechaModificacion: raza.fechaModificacion
    };
  }

  limpiarFormulario(): void {

    this.razaFormulario = {};

    this.modoEdicion = false;

    this.mensaje = '';
    this.error = '';
  }

  buscarRazas(): void {

    const texto =
      this.terminoBusqueda.trim().toLowerCase();

    if (!texto) {

      this.razasFiltradas = this.razas;

      return;
    }

    this.razasFiltradas =
      this.razas.filter(raza => {

        const nombre =
          raza.nombre?.toLowerCase() || '';

        const especie =
          raza.especie?.toLowerCase() || '';

        return (
          nombre.includes(texto) ||
          especie.includes(texto)
        );
      });
  }
}