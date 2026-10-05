import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Medico } from 'src/app/models/medico';
import { Especializacion } from 'src/app/models/especializacion';

import { MedicoService } from 'src/app/services/medico.service';
import { EspecializacionService } from 'src/app/services/especializacion.service';

@Component({
  selector: 'app-medico',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './medico.component.html',
  styleUrls: ['./medico.component.scss']
})
export class MedicoComponent implements OnInit {

  medicos: Medico[] = [];
  medicosFiltrados: Medico[] = [];

  especializaciones: Especializacion[] = [];

  medicoFormulario: Medico = {};

  modoEdicion = false;

  terminoBusqueda = '';

  mensaje = '';
  error = '';

  tiposDocumento = [
    'CC',
    'CE',
    'TI',
    'PAS'
  ];

  constructor(
    private readonly medicoService: MedicoService,
    private readonly especializacionService: EspecializacionService
  ) {}

  ngOnInit(): void {
    this.cargarMedicos();
    this.cargarEspecializaciones();
  }

  cargarMedicos(): void {

    this.medicoService.listar().subscribe({
      next: (respuesta) => {

        this.medicos = respuesta;
        this.medicosFiltrados = respuesta;

      },

      error: (error) => {

        console.error(
          'Error al cargar médicos:',
          error
        );

        this.error =
          error?.error?.message ||
          'No fue posible cargar los médicos.';
      }
    });
  }

  cargarEspecializaciones(): void {

    this.especializacionService.listar().subscribe({
      next: (respuesta) => {

        this.especializaciones = respuesta;

      },

      error: (error) => {

        console.error(
          'Error al cargar especializaciones:',
          error
        );

        this.error =
          'No fue posible cargar las especializaciones.';
      }
    });
  }

  seleccionarEspecializacion(
    especializacionId: number
  ): void {

    const especializacion =
      this.especializaciones.find(
        (item) => item.id === especializacionId
      );

    if (especializacion) {

      this.medicoFormulario.especializacion =
        especializacion;
    }
  }

  guardarMedico(): void {

    this.mensaje = '';
    this.error = '';

    if (
      !this.medicoFormulario.tipoDocumento ||
      this.medicoFormulario.tipoDocumento.trim() === ''
    ) {

      this.error =
        'El tipo de documento es obligatorio.';

      return;
    }

    if (
      !this.medicoFormulario.numeroDocumento ||
      this.medicoFormulario.numeroDocumento.trim() === ''
    ) {

      this.error =
        'El número de documento es obligatorio.';

      return;
    }

    if (
      !this.medicoFormulario.nombres ||
      this.medicoFormulario.nombres.trim() === ''
    ) {

      this.error =
        'Los nombres son obligatorios.';

      return;
    }

    if (
      !this.medicoFormulario.apellidos ||
      this.medicoFormulario.apellidos.trim() === ''
    ) {

      this.error =
        'Los apellidos son obligatorios.';

      return;
    }

    if (
      !this.medicoFormulario.registroProfesional ||
      this.medicoFormulario.registroProfesional.trim() === ''
    ) {

      this.error =
        'El registro profesional es obligatorio.';

      return;
    }

    if (
      !this.medicoFormulario.especializacion?.id
    ) {

      this.error =
        'Debe seleccionar una especialización.';

      return;
    }

    if (
      this.modoEdicion &&
      this.medicoFormulario.id
    ) {

      this.medicoService
        .actualizar(
          this.medicoFormulario.id,
          this.medicoFormulario
        )
        .subscribe({

          next: () => {

            this.mensaje =
              'Médico actualizado correctamente.';

            this.limpiarFormulario();
            this.cargarMedicos();
          },

          error: (error) => {

            console.error(
              'Error al actualizar médico:',
              error
            );

            this.error =
              error?.error?.message ||
              'No fue posible actualizar el médico.';
          }
        });

    } else {

      this.medicoService
        .crear(this.medicoFormulario)
        .subscribe({

          next: () => {

            this.mensaje =
              'Médico creado correctamente.';

            this.limpiarFormulario();
            this.cargarMedicos();
          },

          error: (error) => {

            console.error(
              'Error al crear médico:',
              error
            );

            this.error =
              error?.error?.message ||
              'No fue posible crear el médico.';
          }
        });
    }
  }

  editarMedico(
    medico: Medico
  ): void {

    this.modoEdicion = true;

    this.medicoFormulario = {

      id: medico.id,

      tipoDocumento: medico.tipoDocumento,

      numeroDocumento: medico.numeroDocumento,

      nombres: medico.nombres,

      apellidos: medico.apellidos,

      telefono: medico.telefono,

      registroProfesional:
        medico.registroProfesional,

      especializacion:
        medico.especializacion
    };
  }

  limpiarFormulario(): void {

    this.medicoFormulario = {};

    this.modoEdicion = false;

    this.mensaje = '';
    this.error = '';
  }

  buscarMedicos(): void {

    const texto =
      this.terminoBusqueda
        .trim()
        .toLowerCase();

    if (!texto) {

      this.medicosFiltrados =
        this.medicos;

      return;
    }

    this.medicosFiltrados =
      this.medicos.filter((medico) => {

        const tipoDocumento =
          medico.tipoDocumento?.toLowerCase() || '';

        const numeroDocumento =
          medico.numeroDocumento?.toLowerCase() || '';

        const nombres =
          medico.nombres?.toLowerCase() || '';

        const apellidos =
          medico.apellidos?.toLowerCase() || '';

        const telefono =
          medico.telefono?.toLowerCase() || '';

        const registro =
          medico.registroProfesional?.toLowerCase() || '';

        const especializacion =
          medico.especializacion?.nombre?.toLowerCase() || '';

        return (
          tipoDocumento.includes(texto) ||
          numeroDocumento.includes(texto) ||
          nombres.includes(texto) ||
          apellidos.includes(texto) ||
          telefono.includes(texto) ||
          registro.includes(texto) ||
          especializacion.includes(texto)
        );
      });
  }

  obtenerNombreEspecializacion(
    especializacion?: Especializacion
  ): string {

    if (!especializacion) {
      return 'Sin especialización';
    }

    return especializacion.nombre ||
      `Especialización #${especializacion.id}`;
  }
}