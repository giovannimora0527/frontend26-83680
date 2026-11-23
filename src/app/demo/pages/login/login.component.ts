import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { obtenerMensajeError } from 'src/app/utils/utilidades';

/**
 * Pantalla de inicio de sesion.
 */
@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  form: FormGroup;
  enviando = false;
  error = '';
  verPassword = false;

  constructor(private readonly auth: AuthService, private readonly router: Router, formBuilder: FormBuilder) {
    this.form = formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    if (this.auth.estaAutenticado()) {
      this.router.navigate(['/inicio']);
    }
  }

  /** Envia las credenciales. */
  ingresar() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando = true;
    this.error = '';
    const { username, password } = this.form.getRawValue();
    this.auth.login(username.trim(), password).subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate(['/inicio']);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando = false;
        this.error = obtenerMensajeError(e);
      }
    });
  }
}
