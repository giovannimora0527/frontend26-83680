import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { mensajeDeError } from 'src/app/utils/mensajes';

/** Pantalla de inicio de sesión. */
@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  /** Formulario de credenciales. */
  form!: FormGroup;
  /** Indica que se está validando el acceso. */
  ingresando = false;
  /** Mensaje de error del último intento. */
  error = '';
  /** Indica que se llegó aquí porque la sesión venció. */
  sesionExpirada = false;
  /** Muestra la contraseña en texto plano. */
  verClave = false;

  /**
   * @param authService servicio de sesión.
   * @param formBuilder constructor de formularios reactivos.
   * @param router enrutador.
   * @param route ruta activa, para saber si la sesión expiró.
   */
  constructor(
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) { }

  /** Crea el formulario; si ya hay sesión va directo al inicio. */
  ngOnInit(): void {
    if (this.authService.autenticado) {
      this.router.navigate(['/inicio']);
      return;
    }
    this.sesionExpirada = this.route.snapshot.queryParamMap.has('expirada');
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  /**
   * Indica si un campo debe mostrarse como inválido.
   *
   * @param campo nombre del control.
   * @returns true si es inválido y el usuario ya interactuó con él.
   */
  invalido(campo: string): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  /** Envía las credenciales y, si son válidas, abre el sistema. */
  ingresar(): void {
    if (this.ingresando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.ingresando = true;
    this.error = '';
    this.sesionExpirada = false;

    this.authService.iniciarSesion(this.form.getRawValue()).subscribe({
      next: () => {
        this.ingresando = false;
        this.router.navigate(['/inicio']);
      },
      error: (error: HttpErrorResponse) => {
        this.ingresando = false;
        this.error = mensajeDeError(error);
      }
    });
  }
}
