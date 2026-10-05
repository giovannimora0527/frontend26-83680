import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Mascota } from 'src/app/models/mascota';
import { Cliente } from 'src/app/models/cliente';
import { Raza } from 'src/app/models/raza';

import { MascotaService } from 'src/app/services/mascota.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { RazaService } from 'src/app/services/raza.service';

@Component({
  selector: 'app-mascota',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './mascota.component.html',
  styleUrls: ['./mascota.component.scss']
})
export class MascotaComponent implements OnInit {

  mascotas: Mascota[] = [];
  mascotasFiltradas: Mascota[] = [];

  clientes: Cliente[] = [];
  razas: Raza[] = [];

  mascotaFormulario: Mascota = {};

  modoEdicion = false;

  terminoBusqueda = '';

  mensaje = '';
  error = '';

  constructor(
    private readonly mascotaService: MascotaService,
    private readonly clienteService: ClienteService,
    private readonly razaService: RazaService
  ) {}

  ngOnInit(): void {
    this.cargarMascotas();
    this.cargarClientes();
    this.cargarRazas();
  }

  cargarMascotas(): void {
    this.mascotaService.listar().subscribe({
      next: (respuesta) => {
        this.mascotas = respuesta;
        this.mascotasFiltradas = respuesta;
      },
      error: (error) => {
        console.error('Error al cargar mascotas:', error);
        this.error = 'No fue posible cargar las mascotas.';
      }
    });
  }

  cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: (respuesta) => {
        this.clientes = respuesta;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        this.error = 'No fue posible cargar los clientes.';
      }
    });
  }

  cargarRazas(): void {
    this.razaService.listar().subscribe({
      next: (respuesta) => {
        this.razas = respuesta;
      },
      error: (error) => {
        console.error('Error al cargar razas:', error);
        this.error = 'No fue posible cargar las razas.';
      }
    });
  }

  seleccionarCliente(clienteId: number): void {
    const cliente = this.clientes.find(
      c => c.clienteId === clienteId
    );

    if (cliente) {
      this.mascotaFormulario.cliente = cliente;
    }
  }

  seleccionarRaza(razaId: number): void {
    const raza = this.razas.find(
      r => r.razaId === razaId
    );

    if (raza) {
      this.mascotaFormulario.raza = raza;
    }
  }

  guardarMascota(): void {

    this.mensaje = '';
    this.error = '';

    if (
      !this.mascotaFormulario.nombreMascota ||
      this.mascotaFormulario.nombreMascota.trim() === ''
    ) {
      this.error = 'El nombre de la mascota es obligatorio.';
      return;
    }

    if (
      this.mascotaFormulario.edad === undefined ||
      this.mascotaFormulario.edad === null ||
      this.mascotaFormulario.edad < 0
    ) {
      this.error = 'La edad de la mascota no es válida.';
      return;
    }

    if (!this.mascotaFormulario.cliente?.clienteId) {
      this.error = 'Debe seleccionar un cliente.';
      return;
    }

    if (!this.mascotaFormulario.raza?.razaId) {
      this.error = 'Debe seleccionar una raza.';
      return;
    }

    if (
      this.modoEdicion &&
      this.mascotaFormulario.mascotaId
    ) {

      this.mascotaService.actualizar(
        this.mascotaFormulario.mascotaId,
        this.mascotaFormulario
      ).subscribe({
        next: () => {
          this.mensaje =
            'Mascota actualizada correctamente.';

          this.limpiarFormulario();
          this.cargarMascotas();
        },
        error: (error) => {
          console.error(
            'Error al actualizar mascota:',
            error
          );

          this.error =
            error?.error?.message ||
            'No fue posible actualizar la mascota.';
        }
      });

    } else {

      this.mascotaService.crear(
        this.mascotaFormulario
      ).subscribe({
        next: () => {
          this.mensaje =
            'Mascota creada correctamente.';

          this.limpiarFormulario();
          this.cargarMascotas();
        },
        error: (error) => {
          console.error(
            'Error al crear mascota:',
            error
          );

          this.error =
            error?.error?.message ||
            'No fue posible crear la mascota.';
        }
      });
    }
  }

  editarMascota(mascota: Mascota): void {

    this.modoEdicion = true;

    this.mascotaFormulario = {
      mascotaId: mascota.mascotaId,
      nombreMascota: mascota.nombreMascota,
      edad: mascota.edad,
      fechaRegistro: mascota.fechaRegistro,
      fechaModificacion: mascota.fechaModificacion,
      cliente: mascota.cliente,
      raza: mascota.raza
    };
  }

  limpiarFormulario(): void {

    this.mascotaFormulario = {};

    this.modoEdicion = false;

    this.mensaje = '';
    this.error = '';
  }

  buscarMascotas(): void {

    const texto =
      this.terminoBusqueda.trim().toLowerCase();

    if (!texto) {
      this.mascotasFiltradas = this.mascotas;
      return;
    }

    this.mascotasFiltradas =
      this.mascotas.filter(mascota => {

        const nombreMascota =
          mascota.nombreMascota?.toLowerCase() || '';

        const nombresCliente =
          mascota.cliente?.nombres?.toLowerCase() || '';

        const apellidosCliente =
          mascota.cliente?.apellidos?.toLowerCase() || '';

        const nombreRaza =
          mascota.raza?.nombre?.toLowerCase() || '';

        const especie =
          mascota.raza?.especie?.toLowerCase() || '';

        return (
          nombreMascota.includes(texto) ||
          nombresCliente.includes(texto) ||
          apellidosCliente.includes(texto) ||
          nombreRaza.includes(texto) ||
          especie.includes(texto)
        );
      });
  }
}