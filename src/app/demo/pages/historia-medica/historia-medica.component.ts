import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HistoriaMedica } from 'src/app/models/historia-medica';
import { HistoriaMedicaService } from 'src/app/services/historia-medica.service';

import { Mascota } from 'src/app/models/mascota';
import { MascotaService } from 'src/app/services/mascota.service';

@Component({
  selector: 'app-historia-medica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './historia-medica.component.html',
  styleUrls: ['./historia-medica.component.scss']
})
export class HistoriaMedicaComponent implements OnInit {

  historias: HistoriaMedica[] = [];
  mascotas: Mascota[] = [];

  historia: HistoriaMedica = {};

  editando = false;
  busqueda = '';

  mensaje = '';
  error = '';

  constructor(
    private readonly historiaMedicaService: HistoriaMedicaService,
    private readonly mascotaService: MascotaService
  ) {}

  ngOnInit(): void {
    this.listarHistorias();
    this.listarMascotas();
  }

  listarHistorias(): void {
    this.historiaMedicaService.listar().subscribe({
      next: (data) => {
        this.historias = data;
      },
      error: (error) => {
        console.error('Error al listar historias médicas:', error);
        this.error = 'No fue posible cargar las historias médicas.';
      }
    });
  }

  listarMascotas(): void {
    this.mascotaService.listar().subscribe({
      next: (data) => {
        this.mascotas = data;
      },
      error: (error) => {
        console.error('Error al listar mascotas:', error);
        this.error = 'No fue posible cargar las mascotas.';
      }
    });
  }

  guardar(): void {
    this.mensaje = '';
    this.error = '';

    if (!this.historia.pacienteId) {
      this.error = 'Debe seleccionar una mascota.';
      return;
    }

    if (this.editando && this.historia.id) {
      this.historiaMedicaService
        .actualizar(this.historia.id, this.historia)
        .subscribe({
          next: () => {
            this.mensaje = 'Historia médica actualizada correctamente.';
            this.listarHistorias();
            this.limpiar();
          },
          error: (error) => {
            console.error('Error al actualizar historia médica:', error);
            this.error = 'No fue posible actualizar la historia médica.';
          }
        });

    } else {
      this.historiaMedicaService
        .crear(this.historia)
        .subscribe({
          next: () => {
            this.mensaje = 'Historia médica creada correctamente.';
            this.listarHistorias();
            this.limpiar();
          },
          error: (error) => {
            console.error('Error al crear historia médica:', error);
            this.error = 'No fue posible crear la historia médica.';
          }
        });
    }
  }

  editar(historia: HistoriaMedica): void {
    this.historia = {
      id: historia.id,
      pacienteId: historia.pacienteId,
      fechaCreacion: historia.fechaCreacion
    };

    this.editando = true;
    this.mensaje = '';
    this.error = '';
  }

  limpiar(): void {
    this.historia = {};
    this.editando = false;
  }

  obtenerNombreMascota(pacienteId?: number): string {
    if (!pacienteId) {
      return 'Sin mascota';
    }

    const mascota = this.mascotas.find(
      (item) => item.mascotaId === pacienteId
    );

    if (!mascota) {
      return `Mascota ID: ${pacienteId}`;
    }

    return mascota.nombreMascota || `Mascota ID: ${pacienteId}`;
  }

  get historiasFiltradas(): HistoriaMedica[] {
    const texto = this.busqueda.trim().toLowerCase();

    if (!texto) {
      return this.historias;
    }

    return this.historias.filter((historia) => {
      const nombreMascota = this.obtenerNombreMascota(
        historia.pacienteId
      ).toLowerCase();

      return (
        nombreMascota.includes(texto) ||
        String(historia.pacienteId ?? '').includes(texto) ||
        String(historia.id ?? '').includes(texto)
      );
    });
  }
}