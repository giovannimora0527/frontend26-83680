import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

/** Estructura general: menú lateral según el perfil (viene del backend) y barra superior. */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="app-shell" [class.menu-cerrado]="!menuAbierto()">
    <aside class="sidebar">
      <div class="brand"><i class="fa-solid fa-shield-dog me-2"></i>Clínica Uniminuto</div>
      <nav class="nav flex-column">
        <a class="nav-link" routerLink="/inicio" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active">
          <i class="bi bi-house-door me-2"></i>Inicio</a>
        @for (m of menus(); track m.menuId) {
          <a class="nav-link" [routerLink]="m.url" routerLinkActive="active" (click)="cerrarEnMovil()">
            <i [class]="icono(m.icon)" class="me-2"></i>{{ m.title }}</a>
        }
      </nav>
      <div class="sidebar-pie small">Perfil: <strong>{{ auth.usuario()?.perfilNombre }}</strong></div>
    </aside>
    <div class="contenido">
      <header class="topbar">
        <button class="btn btn-sm btn-outline-secondary" (click)="menuAbierto.set(!menuAbierto())" aria-label="Menú">
          <i class="bi bi-list"></i></button>
        <div class="ms-auto d-flex align-items-center gap-3">
          <div class="text-end lh-sm d-none d-sm-block">
            <div class="fw-semibold">{{ auth.usuario()?.nombreCompleto }}</div>
            <small class="text-muted">{{ auth.usuario()?.perfilNombre }}{{ auth.usuario()?.medicoNombre ? ' · ' + auth.usuario()?.medicoNombre : '' }}</small>
          </div>
          <button class="btn btn-sm btn-outline-danger" (click)="salir()"><i class="bi bi-box-arrow-right me-1"></i>Salir</button>
        </div>
      </header>
      <main class="p-3 p-md-4"><router-outlet></router-outlet></main>
    </div>
  </div>
  `
})
export class LayoutComponent {
  auth = inject(AuthService);
  menus = computed(() => this.auth.menus());
  menuAbierto = signal(window.innerWidth > 992);

  /** "feather icon-users" (plantilla original) se traduce a Bootstrap Icons. */
  icono(icon: string): string {
    if (icon?.startsWith('feather')) { return 'bi bi-people'; }
    return icon;
  }

  cerrarEnMovil(): void {
    if (window.innerWidth <= 992) { this.menuAbierto.set(false); }
  }

  salir(): void {
    this.auth.logout();
  }
}
