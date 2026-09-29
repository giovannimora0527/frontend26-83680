import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { Mascota } from 'src/app/models/mascota';
import { MascotaService } from './service/mascota.service';



@Component({
  selector: 'app-mascota',
  imports: [CommonModule],
  templateUrl: './mascota.component.html',
  styleUrl: './mascota.component.scss'
})
export class MascotaComponent {
  titleComponent: string = "Aqui puedes gestionar la información de las mascotas registradas en el sistema";
  mascotas: Mascota[] = [];

  constructor(private readonly mascotaService: MascotaService) {
    this.listar();
  }


  listar(): void {
    this.mascotaService.listar().subscribe({
      next: (data) => {
        this.mascotas = data;
        console.log(this.mascotas);
      },
      error: (error) => {
        /* Swal.fire({
          title: 'Error',
          text: error.message,
          icon: 'error',
        }); */
      },
    });
  }



}
