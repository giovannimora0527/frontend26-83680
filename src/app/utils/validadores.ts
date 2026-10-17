import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { hoyIso } from './fechas';

/**
 * Validadores reutilizables de los formularios reactivos. Guían al usuario;
 * el backend vuelve a validar los mismos datos.
 */

/** Texto obligatorio que no sea solo espacios. */
export const TEXTO_OBLIGATORIO: ValidatorFn[] = [Validators.required, Validators.pattern(/\S/)];

/** Solo letras (con tildes y ñ), espacios, apóstrofo y guion. */
export const SOLO_LETRAS = Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/);

/** Teléfono: dígitos, espacios y "+" (entre 7 y 20 caracteres). */
export const TELEFONO = Validators.pattern(/^\+?[0-9 ]{7,20}$/);

/**
 * La fecha (yyyy-MM-dd) no puede ser posterior a hoy.
 *
 * @param control control con la fecha.
 * @returns error "fechaFutura" o null.
 */
export function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  return valor && valor > hoyIso() ? { fechaFutura: true } : null;
}

/**
 * Contraseña de al menos 8 caracteres con letras y números.
 *
 * @param control control con la contraseña.
 * @returns error "contrasenaDebil" o null (si está vacía no valida: eso lo decide "required").
 */
export function contrasenaSegura(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '');
  if (!valor) {
    return null;
  }
  return valor.length >= 8 && /[A-Za-z]/.test(valor) && /\d/.test(valor) ? null : { contrasenaDebil: true };
}

/**
 * Validador de grupo: dos campos deben tener el mismo valor (por ejemplo,
 * contraseña y confirmación).
 *
 * @param campo nombre del primer control.
 * @param confirmacion nombre del control que debe coincidir.
 * @returns validador que marca "noCoincide" en el grupo.
 */
export function camposIguales(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const a = grupo.get(campo)?.value ?? '';
    const b = grupo.get(confirmacion)?.value ?? '';
    return a === b ? null : { noCoincide: true };
  };
}
