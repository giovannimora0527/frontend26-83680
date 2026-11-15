import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AjusteRq, LoteRq, Movimiento, Producto, ProductoRq } from 'src/app/models/inventario';
import { Pagina } from 'src/app/models/pagina';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Servicio de Angular que consume la API REST del inventario. */
@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  /** Recurso del backend para el inventario. */
  private readonly api = 'medicamento';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista los productos con sus existencias y alertas.
   *
   * @returns lista de productos.
   */
  listar(): Observable<Producto[]> {
    return this.backendService.get<Producto[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta un producto con sus lotes.
   *
   * @param id identificador del producto.
   * @returns detalle del producto.
   */
  consultar(id: number): Observable<Producto> {
    return this.backendService.get<Producto>(environment.apiUrlAuth, this.api, String(id));
  }

  /**
   * Registra un producto.
   *
   * @param rq datos del producto.
   * @returns mensaje de éxito.
   */
  guardar(rq: ProductoRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, 'guardar', rq);
  }

  /**
   * Modifica un producto (PUT).
   *
   * @param id identificador del producto.
   * @param rq nuevos datos.
   * @returns mensaje de éxito.
   */
  actualizar(id: number, rq: ProductoRq): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, String(id), rq);
  }

  /**
   * Activa o inactiva un producto.
   *
   * @param id identificador del producto.
   * @param activar true para activar, false para inactivar.
   * @returns mensaje de éxito.
   */
  cambiarEstado(id: number, activar: boolean): Observable<RespuestaApi> {
    const accion = activar ? 'activar' : 'inactivar';
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${id}/${accion}`, {});
  }

  /**
   * Registra la entrada de un lote.
   *
   * @param id identificador del producto.
   * @param rq datos del lote.
   * @returns mensaje de éxito.
   */
  registrarLote(id: number, rq: LoteRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, `${id}/lotes`, rq);
  }

  /**
   * Corrige la existencia de un lote.
   *
   * @param loteId identificador del lote.
   * @param rq sentido, cantidad y motivo.
   * @returns mensaje de éxito.
   */
  ajustarLote(loteId: number, rq: AjusteRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, `lote/${loteId}/ajuste`, rq);
  }

  /**
   * Consulta el historial de entradas y salidas de un producto.
   *
   * @param id identificador del producto.
   * @param page página (empieza en 0).
   * @param size registros por página.
   * @returns página de movimientos.
   */
  listarMovimientos(id: number, page: number, size: number): Observable<Pagina<Movimiento>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.backendService.get<Pagina<Movimiento>>(environment.apiUrlAuth, this.api, `${id}/movimientos`, params);
  }
}
