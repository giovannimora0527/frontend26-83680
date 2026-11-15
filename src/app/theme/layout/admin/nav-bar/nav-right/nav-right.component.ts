// angular import
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

// bootstrap import
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss'],
  providers: [NgbDropdownConfig]
})
export class NavRightComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Nombre que se muestra del usuario autenticado. */
  get nombreUsuario(): string {
    return this.auth.perfil?.medicoNombre ?? this.auth.perfil?.username ?? '';
  }

  /** Nombre legible del rol del usuario autenticado. */
  get nombreRol(): string {
    return this.auth.perfil?.perfilNombre ?? '';
  }

  /** Cierra la sesión y vuelve a la pantalla de login. */
  cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // constructor
  constructor() {
    const config = inject(NgbDropdownConfig);

    config.placement = 'bottom-right';
  }
}
