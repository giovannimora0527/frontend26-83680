import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

const COLOR = '#0d47a1';

/** Texto por defecto según el código HTTP, para cuando el backend no envía mensaje. */
const POR_CODIGO: Record<number, string> = {
  0: 'No hay conexión con el servidor. Verifique que el backend esté en ejecución.',
  400: 'Los datos enviados no son válidos.',
  401: 'La sesión no es válida. Ingrese de nuevo.',
  403: 'Su perfil no tiene permiso para esta operación.',
  404: 'El registro no existe o ya no está disponible.',
  409: 'La operación entra en conflicto con el estado actual del registro.',
  413: 'El archivo supera el tamaño permitido.',
  502: 'El servidor de la aplicación no responde. Puede estar iniciando o detenido; espere un momento e intente de nuevo.',
  503: 'El servidor de la aplicación no está disponible en este momento.',
  504: 'El servidor de la aplicación tardó demasiado en responder.'
};

/** Alertas reutilizables (SweetAlert2). */
export class Mensajes {
  /**
   * Sin título: aviso corto en la esquina que se cierra solo (guardados, cambios de estado).
   * Con título: ventana que hay que cerrar, para resultados que conviene leer con calma.
   */
  static exito(texto: string, titulo?: string): void {
    if (titulo) {
      Swal.fire({ icon: 'success', title: titulo, text: texto, confirmButtonColor: COLOR });
    } else {
      Mensajes.toast(texto);
    }
  }

  static toast(texto: string, icono: 'success' | 'info' | 'warning' = 'success'): void {
    Swal.fire({
      toast: true, position: 'top-end', icon: icono, title: texto, showConfirmButton: false,
      timer: 2500, timerProgressBar: true
    });
  }

  static aviso(titulo: string, texto: string): void {
    Swal.fire({ icon: 'warning', title: titulo, text: texto, confirmButtonColor: COLOR });
  }

  static error(err: unknown, titulo = 'No fue posible completar la operación'): void {
    if (err instanceof HttpErrorResponse && err.error instanceof Blob) {
      // Descargas (PDF/Excel): el cuerpo del error llega como Blob.
      err.error.text().then(t => {
        let texto = t;
        try { texto = JSON.parse(t).message ?? t; } catch { /* no era JSON */ }
        Mensajes.mostrarError(titulo, texto || Mensajes.porCodigo(err.status));
      });
      return;
    }
    Mensajes.mostrarError(titulo, Mensajes.texto(err));
  }

  /** Mensaje legible para cualquier error: el del backend si lo hay, o uno según el código HTTP. */
  static texto(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      // Un texto HTML (página de error de nginx) no se muestra: se usa el mensaje según el código.
      const crudo = typeof err.error === 'string' ? err.error : err.error?.message;
      const delBackend = typeof crudo === 'string' && !crudo.trimStart().startsWith('<') ? crudo : '';
      return err.status === 0 ? POR_CODIGO[0] : (delBackend || Mensajes.porCodigo(err.status));
    }
    return typeof err === 'string' ? err : 'Error inesperado.';
  }

  static async confirmar(texto: string, titulo = '¿Está seguro?', boton = 'Sí, continuar'): Promise<boolean> {
    const r = await Swal.fire({
      icon: 'question', title: titulo, text: texto, showCancelButton: true,
      confirmButtonText: boton, cancelButtonText: 'Cancelar', confirmButtonColor: COLOR, reverseButtons: true
    });
    return r.isConfirmed;
  }

  /** Pide un texto obligatorio (motivos de cancelación, anulación, reversión). */
  static async pedirTexto(titulo: string, etiqueta: string, minimo = 5, maximo = 500): Promise<string | null> {
    const r = await Swal.fire({
      title: titulo, input: 'textarea', inputLabel: etiqueta, showCancelButton: true,
      inputAttributes: { maxlength: String(maximo) },
      confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar', confirmButtonColor: COLOR, reverseButtons: true,
      inputValidator: v => (!v || v.trim().length < minimo) ? `Escriba al menos ${minimo} caracteres.` : null
    });
    return r.isConfirmed ? (r.value as string).trim() : null;
  }

  private static porCodigo(status: number): string {
    if (POR_CODIGO[status]) { return POR_CODIGO[status]; }
    if (status >= 500) { return 'Error interno del servidor. Intente de nuevo; si continúa, revise el log del backend.'; }
    return POR_CODIGO[status] ?? `Error ${status}.`;
  }

  private static mostrarError(titulo: string, texto: string): void {
    Swal.fire({ icon: 'error', title: titulo, text: texto, confirmButtonColor: COLOR });
  }
}
