import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { BackendService } from 'src/app/services/backend.service';
import { Pagina } from 'src/app/models/pagina';
import { ModalBootstrap } from 'src/app/utils/modal';
import { descargarArchivo } from 'src/app/utils/archivos';
import { avisar, confirmar, mostrarError, notificarExito } from 'src/app/utils/mensajes';
import { environment } from 'src/environments/environment';

/** Fila de una carga con su resultado. */
interface FilaCarga {
  fila: number;
  codigo: string;
  nombre: string;
  tipo: string;
  precioVenta: string;
  numeroLote: string;
  cantidad: string;
  fechaVencimiento: string;
  estado: 'VALIDA' | 'ERROR' | 'IMPORTADA' | 'FALLIDA';
  mensaje: string;
}

/** Carga masiva (resumen y filas). */
interface Carga {
  cargaId: number;
  archivo: string;
  formato: string;
  usuario: string;
  fecha: string;
  estado: 'VALIDADA' | 'CONFIRMADA' | 'DESCARTADA';
  totalFilas: number;
  filasValidas: number;
  filasError: number;
  filasImportadas: number;
  fechaConfirmacion: string | null;
  filas: FilaCarga[] | null;
}

/**
 * Carga masiva de medicamentos y productos desde Excel (.xlsx) o CSV.
 *
 * Paso 1: se descarga la plantilla y se sube el archivo; el backend valida la
 * estructura y cada fila sin importar nada. Paso 2: se revisa la vista previa
 * (filas correctas y con error, con la fila y el motivo; se puede descargar el
 * informe de errores). Paso 3: se confirma y se importan solo las filas
 * válidas, cada una de forma independiente. El log de cargas muestra quién
 * subió cada archivo, cuándo y su resultado.
 */
@Component({
  selector: 'app-carga-masiva',
  imports: [CommonModule, FormsModule],
  templateUrl: './carga-masiva.component.html'
})
export class CargaMasivaComponent implements OnDestroy {
  /** Avisa al inventario que se importaron productos. */
  @Output() importado = new EventEmitter<void>();

  /** Archivo elegido. */
  archivo: File | null = null;
  /** Carga actual (vista previa o resultado). */
  carga: Carga | null = null;
  /** Mostrar solo las filas con error. */
  soloErrores = false;
  /** Indica que se está procesando. */
  procesando = false;
  /** Log de cargas. */
  historial: Carga[] = [];
  /** Pestaña: carga nueva o historial. */
  pestana: 'nueva' | 'historial' = 'nueva';

  /** Modal. */
  private readonly modal = new ModalBootstrap('modalCargaMasiva');
  /** Recurso del backend. */
  private readonly api = 'medicamento';
  /** URL base. */
  private readonly url = environment.apiUrlAuth;

  /**
   * @param backend servicio genérico de peticiones HTTP.
   */
  constructor(private readonly backend: BackendService) { }

  /** Cierra el modal. */
  ngOnDestroy(): void {
    this.modal.destruir();
  }

  /** Abre el modal en el paso inicial. */
  abrir(): void {
    this.archivo = null;
    this.carga = null;
    this.soloErrores = false;
    this.pestana = 'nueva';
    this.modal.abrir();
  }

  /** Filas visibles en la tabla. */
  get filas(): FilaCarga[] {
    const filas = this.carga?.filas ?? [];
    return this.soloErrores ? filas.filter((f) => f.estado === 'ERROR' || f.estado === 'FALLIDA') : filas;
  }

  /** Descarga la plantilla. */
  descargarPlantilla(): void {
    this.backend.getArchivo(this.url, this.api, 'carga/plantilla').subscribe({
      next: (a) => descargarArchivo(a, 'plantilla-carga-inventario.xlsx'),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo descargar la plantilla')
    });
  }

  /** Toma el archivo elegido. */
  elegirArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    if (f && !/\.(xlsx|csv)$/i.test(f.name)) {
      avisar('Formato no admitido', 'Seleccione un archivo .xlsx o .csv.', 'warning');
      input.value = '';
      this.archivo = null;
      return;
    }
    if (f && f.size > 5 * 1024 * 1024) {
      avisar('Archivo muy grande', 'El archivo no puede superar 5 MB.', 'warning');
      input.value = '';
      this.archivo = null;
      return;
    }
    this.archivo = f;
    this.carga = null;
  }

  /** Sube y valida el archivo (no importa nada). */
  validar(): void {
    if (!this.archivo || this.procesando) {
      return;
    }
    const datos = new FormData();
    datos.append('archivo', this.archivo, this.archivo.name);
    this.procesando = true;
    this.backend.postFile<Carga>(this.url, this.api, 'carga/validar', datos).subscribe({
      next: (c) => {
        this.procesando = false;
        this.carga = c;
        this.soloErrores = c.filasError > 0;
      },
      error: (e: HttpErrorResponse) => {
        this.procesando = false;
        mostrarError(e, 'No se pudo validar el archivo');
      }
    });
  }

  /** Importa las filas válidas. */
  async confirmar(): Promise<void> {
    const c = this.carga;
    if (!c || this.procesando) {
      return;
    }
    const ok = await confirmar(`¿Importar ${c.filasValidas} registros?`,
      c.filasError ? `Las ${c.filasError} filas con error no se importarán.` : 'Todas las filas son válidas.', 'Sí, importar');
    if (!ok) {
      return;
    }
    this.procesando = true;
    this.backend.put<Carga>(this.url, this.api, `carga/${c.cargaId}/confirmar`, {}).subscribe({
      next: (r) => {
        this.procesando = false;
        this.carga = r;
        this.soloErrores = false;
        notificarExito(`Se importaron ${r.filasImportadas} de ${r.filasValidas} registros válidos`);
        this.importado.emit();
      },
      error: (e: HttpErrorResponse) => {
        this.procesando = false;
        mostrarError(e, 'No se pudo completar la importación');
      }
    });
  }

  /** Descarta la carga validada. */
  descartar(): void {
    const c = this.carga;
    if (!c) {
      return;
    }
    this.backend.put(this.url, this.api, `carga/${c.cargaId}/descartar`, {}).subscribe({
      next: () => {
        this.carga = null;
        this.archivo = null;
      },
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo descartar la carga')
    });
  }

  /** Descarga el informe de errores de una carga. */
  descargarErrores(cargaId: number): void {
    this.backend.getArchivo(this.url, this.api, `carga/${cargaId}/errores`).subscribe({
      next: (a) => descargarArchivo(a, `errores-carga-${cargaId}.xlsx`),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo generar el informe de errores')
    });
  }

  /** Muestra el log de cargas. */
  verHistorial(): void {
    this.pestana = 'historial';
    this.backend.get<Pagina<Carga>>(this.url, this.api, 'carga/listar').subscribe({
      next: (p) => (this.historial = p.content),
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo consultar el historial de cargas')
    });
  }

  /** Abre el detalle de una carga del historial. */
  abrirCarga(id: number): void {
    this.backend.get<Carga>(this.url, this.api, `carga/${id}`).subscribe({
      next: (c) => {
        this.carga = c;
        this.soloErrores = false;
        this.pestana = 'nueva';
      },
      error: (e: HttpErrorResponse) => mostrarError(e, 'No se pudo consultar la carga')
    });
  }

  /** Clase y texto del estado de una fila. */
  estadoFila(e: string): { texto: string; clase: string } {
    switch (e) {
      case 'VALIDA':
        return { texto: 'Válida', clase: 'bg-success' };
      case 'IMPORTADA':
        return { texto: 'Importada', clase: 'bg-primary' };
      case 'FALLIDA':
        return { texto: 'Falló', clase: 'bg-danger' };
      default:
        return { texto: 'Error', clase: 'bg-danger' };
    }
  }
}
