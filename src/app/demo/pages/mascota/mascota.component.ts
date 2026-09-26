import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-mascota',
  imports: [CommonModule],
  templateUrl: './mascota.component.html',
  styleUrl: './mascota.component.scss'
})
export class MascotaComponent {

  titulo: string = "Titulo perzonalizado de mascotas";
  cantCiclos: number = 3;
  ciclos: number[] = Array.from({ length: this.cantCiclos }, (_, index) => index + 1);

  saludar() {
    Swal.fire({
      title: '¡Hola!',
      text: 'Saludando a mascotas',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });
  }

}
