import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  error = '';
  enviando = false;
  readonly form = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  iniciarSesion(): void {
    this.error = '';
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando = true;
    this.authService.login({
      username: this.form.controls.username.value ?? '',
      password: this.form.controls.password.value ?? ''
    }).subscribe({
      next: () => {
        this.enviando = false;
        void this.router.navigateByUrl(this.authService.homeRoute());
      },
      error: (error: { error?: { message?: string } }) => {
        this.enviando = false;
        this.error = error.error?.message ?? 'No fue posible iniciar sesión. Verifica tus credenciales.';
      }
    });
  }
}
