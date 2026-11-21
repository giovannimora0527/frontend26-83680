import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Mensajes } from '../../core/mensajes';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="min-vh-100 d-flex align-items-center justify-content-center" style="background: linear-gradient(135deg,#0b2545,#13315c 60%,#1e88e5)">
    <div class="card shadow-lg" style="width: 380px">
      <div class="card-body p-4">
        <div class="text-center mb-4">
          <i class="fa-solid fa-shield-dog fa-3x text-primary"></i>
          <h4 class="mt-2 mb-0 fw-bold">Clínica Veterinaria</h4>
          <small class="text-muted">Uniminuto · Sistema de gestión</small>
        </div>
        @if (expirada) {
          <div class="alert alert-warning py-2 small d-flex align-items-center" role="alert">
            <i class="bi bi-clock-history me-2"></i>Su sesión expiró o fue cerrada. Ingrese de nuevo.</div>
        }
        <form #f="ngForm" (ngSubmit)="ingresar(f.valid)" novalidate>
          <div class="mb-3">
            <label class="form-label requerido" for="u">Usuario</label>
            <input id="u" name="u" class="form-control" [(ngModel)]="username" required minlength="4" autocomplete="username"
                   #u="ngModel" [class.is-invalid]="u.invalid && (u.touched || enviado)">
            <div class="invalid-feedback">Ingrese su usuario.</div>
          </div>
          <div class="mb-3">
            <label class="form-label requerido" for="p">Contraseña</label>
            <input id="p" name="p" type="password" class="form-control" [(ngModel)]="password" required autocomplete="current-password"
                   #p="ngModel" [class.is-invalid]="p.invalid && (p.touched || enviado)">
            <div class="invalid-feedback">Ingrese su contraseña.</div>
          </div>
          <button class="btn btn-primary w-100" [disabled]="cargando">
            @if (cargando) { <span class="spinner-border spinner-border-sm me-2"></span> }Ingresar
          </button>
        </form>
      </div>
    </div>
  </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  expirada = inject(ActivatedRoute).snapshot.queryParamMap.has('expirada');
  username = '';
  password = '';
  cargando = false;
  enviado = false;

  ingresar(valido: boolean | null): void {
    this.enviado = true;
    if (!valido) { return; }
    this.cargando = true;
    this.expirada = false;
    this.auth.login(this.username.trim().toLowerCase(), this.password).subscribe({
      next: () => { this.cargando = false; this.router.navigate(['/inicio']); },
      error: e => { this.cargando = false; Mensajes.error(e, 'No fue posible iniciar sesión'); }
    });
  }
}
