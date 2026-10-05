import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { Medico } from 'src/app/models/medico';

import { AnotacionHistoriaService } from 'src/app/services/anotacion-historica.service';
import { HistoriaMedicaService } from 'src/app/services/historia-medica.service';
import { MedicoService } from 'src/app/services/medico.service';

@Component({
  selector: 'app-anotacion-historia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './anotacion-historia.component.html',
  styleUrls: ['./anotacion-historia.component.scss']
})
export class AnotacionHistoriaComponent implements OnInit {

  anotaciones: AnotacionHistoria[] = [];

  historias: HistoriaMedica[] = [];

  medicos: Medico[] = [];

  anotacion: AnotacionHistoria = {};

  editando = false;

  busqueda = '';

  mensaje = '';

  error = '';

  constructor(
    private readonly anotacionHistoriaService: AnotacionHistoriaService,
    private readonly historiaMedicaService: HistoriaMedicaService,
    private readonly medicoService: MedicoService
  ) {}

  ngOnInit(): void {
    this.listarAnotaciones();
    this.listarHistorias();
    this.listarMedicos();
  }

  listarAnotaciones(): void {
    this.mensaje = '';
    this.error = '';

    this.anotacionHistoriaService.listar().subscribe({
      next: (data) => {
        this.anotaciones = data;
      },
      error: (error) => {
        console.error(
          'Error al listar anotaciones de historia:',
          error
        );

        this.error =
          'No fue posible cargar las anotaciones de historia.';
      }
    });
  }

  listarHistorias(): void {

    this.historiaMedicaService.listar().subscribe({
      next: (data) => {
        this.historias = data;
      },
      error: (error) => {
        console.error(
          'Error al listar historias médicas:',
          error
        );

        this.error =
          'No fue posible cargar las historias médicas.';
      }
    });
  }

  listarMedicos(): void {

    this.medicoService.listar().subscribe({
      next: (data) => {
        this.medicos = data;
      },
      error: (error) => {
        console.error(
          'Error al listar médicos:',
          error
        );

        this.error =
          'No fue posible cargar los médicos.';
      }
    });
  }

  guardar(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.anotacion.historiaId) {
      this.error =
        'Debe seleccionar una historia médica.';
      return;
    }

    if (!this.anotacion.medicoId) {
      this.error =
        'Debe seleccionar un médico.';
      return;
    }

    if (
      !this.anotacion.descripcion ||
      this.anotacion.descripcion.trim() === ''
    ) {
      this.error =
        'Debe ingresar una descripción.';
      return;
    }

    if (
      this.editando &&
      this.anotacion.id
    ) {

      this.anotacionHistoriaService
        .actualizar(
          this.anotacion.id,
          this.anotacion
        )
        .subscribe({

          next: () => {

            this.mensaje =
              'Anotación actualizada correctamente.';

            this.listarAnotaciones();

            this.limpiar();
          },

          error: (error) => {

            console.error(
              'Error al actualizar anotación:',
              error
            );

            this.error =
              'No fue posible actualizar la anotación.';
          }

        });

    } else {

      this.anotacionHistoriaService
        .crear(this.anotacion)
        .subscribe({

          next: () => {

            this.mensaje =
              'Anotación creada correctamente.';

            this.listarAnotaciones();

            this.limpiar();
          },

          error: (error) => {

            console.error(
              'Error al crear anotación:',
              error
            );

            this.error =
              'No fue posible crear la anotación.';
          }

        });
    }
  }

  editar(anotacion: AnotacionHistoria): void {

    this.anotacion = {

      id: anotacion.id,

      historiaId: anotacion.historiaId,

      medicoId: anotacion.medicoId,

      fecha: anotacion.fecha,

      descripcion: anotacion.descripcion

    };

    this.editando = true;

    this.mensaje = '';

    this.error = '';
  }

  limpiar(): void {

    this.anotacion = {};

    this.editando = false;
  }

  obtenerHistoria(anotacion: AnotacionHistoria): string {

    if (!anotacion.historiaId) {
      return 'Sin historia';
    }

    return `Historia #${anotacion.historiaId}`;
  }

  obtenerNombreMedico(medicoId?: number): string {

    if (!medicoId) {
      return 'Sin médico';
    }

    const medico = this.medicos.find(
      (item) => item.id === medicoId
    );

    if (!medico) {
      return `Médico ID: ${medicoId}`;
    }

    const nombreCompleto =
      `${medico.nombres ?? ''} ${medico.apellidos ?? ''}`.trim();

    return nombreCompleto ||
      `Médico ID: ${medicoId}`;
  }

  get anotacionesFiltradas(): AnotacionHistoria[] {

    const texto =
      this.busqueda.trim().toLowerCase();

    if (!texto) {
      return this.anotaciones;
    }

    return this.anotaciones.filter(
      (anotacion) => {

        const medico =
          this.obtenerNombreMedico(
            anotacion.medicoId
          ).toLowerCase();

        const historia =
          this.obtenerHistoria(
            anotacion
          ).toLowerCase();

        const descripcion =
          (
            anotacion.descripcion ?? ''
          ).toLowerCase();

        return (
          medico.includes(texto) ||
          historia.includes(texto) ||
          descripcion.includes(texto) ||
          String(
            anotacion.id ?? ''
          ).includes(texto)
        );
      }
    );
  }
}