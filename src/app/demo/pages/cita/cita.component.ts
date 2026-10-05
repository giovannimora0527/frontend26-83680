import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';

import { CitaService } from 'src/app/services/cita.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { MascotaService } from 'src/app/services/mascota.service';

@Component({
  selector: 'app-cita',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './cita.component.html',
  styleUrls: ['./cita.component.scss']
})
export class CitaComponent implements OnInit {

  citas: Cita[] = [];
  citasFiltradas: Cita[] = [];

  clientes: Cliente[] = [];
  mascotas: Mascota[] = [];

  citaFormulario: Cita = {};

  modoEdicion = false;

  terminoBusqueda = '';

  mensaje = '';
  error = '';

  estados = [
    'PENDIENTE',
    'CONFIRMADA',
    'ATENDIDA',
    'CANCELADA'
  ];

  constructor(
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService
  ) {}

  ngOnInit(): void {
    this.cargarCitas();
    this.cargarClientes();
    this.cargarMascotas();
  }

  cargarCitas(): void {

    this.citaService.listar().subscribe({
      next: (respuesta) => {

        this.citas = respuesta;
        this.citasFiltradas = respuesta;

      },

      error: (error) => {

        console.error(
          'Error al cargar citas:',
          error
        );

        this.error =
          error?.error?.message ||
          'No fue posible cargar las citas.';
      }
    });
  }

  cargarClientes(): void {

    this.clienteService.listar().subscribe({
      next: (respuesta) => {

        this.clientes = respuesta;

      },

      error: (error) => {

        console.error(
          'Error al cargar clientes:',
          error
        );

        this.error =
          'No fue posible cargar los clientes.';
      }
    });
  }

  cargarMascotas(): void {

    this.mascotaService.listar().subscribe({
      next: (respuesta) => {

        this.mascotas = respuesta;

      },

      error: (error) => {

        console.error(
          'Error al cargar mascotas:',
          error
        );

        this.error =
          'No fue posible cargar las mascotas.';
      }
    });
  }

  guardarCita(): void {

    this.mensaje = '';
    this.error = '';

    if (
      this.citaFormulario.clienteId === undefined ||
      this.citaFormulario.clienteId === null
    ) {

      this.error =
        'Debe seleccionar un cliente.';

      return;
    }

    if (
      this.citaFormulario.mascotaId === undefined ||
      this.citaFormulario.mascotaId === null
    ) {

      this.error =
        'Debe seleccionar una mascota.';

      return;
    }

    if (
      this.citaFormulario.medicoId === undefined ||
      this.citaFormulario.medicoId === null
    ) {

      this.error =
        'El ID del médico es obligatorio.';

      return;
    }

    if (
      !this.citaFormulario.fechaHora ||
      this.citaFormulario.fechaHora.trim() === ''
    ) {

      this.error =
        'La fecha y hora de la cita son obligatorias.';

      return;
    }

    if (
      !this.citaFormulario.estado ||
      this.citaFormulario.estado.trim() === ''
    ) {

      this.error =
        'El estado de la cita es obligatorio.';

      return;
    }

    if (
      !this.citaFormulario.motivo ||
      this.citaFormulario.motivo.trim() === ''
    ) {

      this.error =
        'El motivo de la cita es obligatorio.';

      return;
    }

    if (
      this.modoEdicion &&
      this.citaFormulario.id
    ) {

      this.citaService
        .actualizar(
          this.citaFormulario.id,
          this.citaFormulario
        )
        .subscribe({

          next: () => {

            this.mensaje =
              'Cita actualizada correctamente.';

            this.limpiarFormulario();
            this.cargarCitas();
          },

          error: (error) => {

            console.error(
              'Error al actualizar cita:',
              error
            );

            this.error =
              error?.error?.message ||
              'No fue posible actualizar la cita.';
          }
        });

    } else {

      this.citaService
        .crear(this.citaFormulario)
        .subscribe({

          next: () => {

            this.mensaje =
              'Cita creada correctamente.';

            this.limpiarFormulario();
            this.cargarCitas();
          },

          error: (error) => {

            console.error(
              'Error al crear cita:',
              error
            );

            this.error =
              error?.error?.message ||
              'No fue posible crear la cita.';
          }
        });
    }
  }

  editarCita(cita: Cita): void {

    this.modoEdicion = true;

    this.citaFormulario = {

      id: cita.id,

      clienteId: cita.clienteId,

      mascotaId: cita.mascotaId,

      medicoId: cita.medicoId,

      fechaHora: cita.fechaHora,

      estado: cita.estado,

      motivo: cita.motivo
    };
  }

  limpiarFormulario(): void {

    this.citaFormulario = {};

    this.modoEdicion = false;

    this.mensaje = '';
    this.error = '';
  }

  buscarCitas(): void {

    const texto =
      this.terminoBusqueda
        .trim()
        .toLowerCase();

    if (!texto) {

      this.citasFiltradas = this.citas;

      return;
    }

    this.citasFiltradas =
      this.citas.filter((cita) => {

        const estado =
          cita.estado?.toLowerCase() || '';

        const motivo =
          cita.motivo?.toLowerCase() || '';

        const cliente =
          this.obtenerNombreCliente(
            cita.clienteId
          ).toLowerCase();

        const mascota =
          this.obtenerNombreMascota(
            cita.mascotaId
          ).toLowerCase();

        const medico =
          cita.medicoId?.toString() || '';

        return (
          estado.includes(texto) ||
          motivo.includes(texto) ||
          cliente.includes(texto) ||
          mascota.includes(texto) ||
          medico.includes(texto)
        );
      });
  }

  obtenerNombreCliente(
    clienteId?: number
  ): string {

    if (!clienteId) {
      return 'Sin cliente';
    }

    const cliente =
      this.clientes.find(
        (item) => item.clienteId === clienteId
      );

    if (!cliente) {
      return `Cliente #${clienteId}`;
    }

    return `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
  }

  obtenerNombreMascota(
    mascotaId?: number
  ): string {

    if (!mascotaId) {
      return 'Sin mascota';
    }

    const mascota =
      this.mascotas.find(
        (item) => item.mascotaId === mascotaId
      );

    if (!mascota) {
      return `Mascota #${mascotaId}`;
    }

    return mascota.nombreMascota || `Mascota #${mascotaId}`;
  }

  cargarMascotasPorCliente(): void {

    if (
      this.citaFormulario.clienteId === undefined ||
      this.citaFormulario.clienteId === null
    ) {

      this.mascotas = [];

      this.citaFormulario.mascotaId =
        undefined;

      return;
    }

    this.mascotaService
      .listarPorCliente(
        this.citaFormulario.clienteId
      )
      .subscribe({

        next: (respuesta) => {

          this.mascotas = respuesta;

          const mascotaActual =
            this.mascotas.some(
              (mascota) =>
                mascota.mascotaId ===
                this.citaFormulario.mascotaId
            );

          if (!mascotaActual) {

            this.citaFormulario.mascotaId =
              undefined;
          }
        },

        error: (error) => {

          console.error(
            'Error al cargar mascotas del cliente:',
            error
          );

          this.error =
            'No fue posible cargar las mascotas del cliente.';
        }
      });
  }
}