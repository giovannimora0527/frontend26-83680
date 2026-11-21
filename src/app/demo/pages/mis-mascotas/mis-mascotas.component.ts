import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Mascota } from 'src/app/models/mascota';
import { AuthService } from 'src/app/services/auth.service';
import { MascotaService } from '../mascota/service/mascota.service';

@Component({
  selector: 'app-mis-mascotas',
  imports: [CommonModule],
  templateUrl: './mis-mascotas.component.html'
})
export class MisMascotasComponent {
  mascotas: Mascota[] = [];
  error = '';

  constructor(auth: AuthService, mascotaService: MascotaService) {
    const clienteId = auth.session()?.usuario.clienteId;
    if (!clienteId) {
      this.error = 'La cuenta no tiene un propietario asociado. Contacta al administrador.';
      return;
    }
    mascotaService.listarPorCliente(clienteId).subscribe({
      next: (mascotas) => this.mascotas = mascotas,
      error: (error: HttpErrorResponse) => this.error = error.error?.message ?? 'No se pudieron cargar tus mascotas.'
    });
  }
}
