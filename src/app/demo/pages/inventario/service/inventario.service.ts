import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CargaLog, CargaResultado, LoteRq, Movimiento, ProductoInventario } from 'src/app/models/inventario';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio del modulo de inventario: productos, lotes, movimientos y carga masiva.
 */
@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly url = environment.apiUrlAuth;

  constructor(private readonly backend: BackendService) { }

  /** @returns inventario con existencias, precios y alertas. */
  listar(): Observable<ProductoInventario[]> {
    return this.backend.get(this.url, 'medicamento', 'inventario');
  }

  /** @returns detalle de un producto con lotes. */
  consultar(medicamentoId: number): Observable<ProductoInventario> {
    return this.backend.get(this.url, 'medicamento', 'consultar', new HttpParams().set('medicamentoId', medicamentoId));
  }

  /** @returns historial de entradas y salidas. */
  movimientos(medicamentoId: number): Observable<Movimiento[]> {
    return this.backend.get(this.url, 'medicamento', 'movimientos', new HttpParams().set('medicamentoId', medicamentoId));
  }

  /** @returns respuesta al registrar un producto. */
  guardar(producto: ProductoInventario & { lote?: LoteRq }): Observable<MiRespuesta> {
    return this.backend.post(this.url, 'medicamento', 'guardar', producto);
  }

  /** @returns respuesta al editar un producto. */
  actualizar(producto: ProductoInventario): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'medicamento', 'actualizar', producto);
  }

  /** @returns respuesta al ingresar un lote. */
  agregarLote(lote: LoteRq): Observable<MiRespuesta> {
    return this.backend.post(this.url, 'inventario', 'lote', lote);
  }

  /** @returns vista previa de la carga masiva. */
  previsualizarCarga(archivo: File): Observable<CargaResultado> {
    return this.backend.subirArchivo(this.url, 'inventario', 'carga/previsualizar', this.formData(archivo));
  }

  /** @returns resultado de la importacion. */
  confirmarCarga(archivo: File): Observable<CargaResultado> {
    return this.backend.subirArchivo(this.url, 'inventario', 'carga/confirmar', this.formData(archivo));
  }

  /** @returns log de cargas. */
  logsCarga(): Observable<CargaLog[]> {
    return this.backend.get(this.url, 'inventario', 'carga/logs');
  }

  /** @returns plantilla CSV. */
  plantilla(): Observable<Blob> {
    return this.backend.descargar(this.url, 'inventario', 'carga/plantilla');
  }

  private formData(archivo: File): FormData {
    const datos = new FormData();
    datos.append('archivo', archivo, archivo.name);
    return datos;
  }
}
