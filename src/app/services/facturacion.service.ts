import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AgendaAtencion,
  Atencion,
  AtencionRq,
  Factura,
  FiltroFacturas,
  Servicio,
  ServicioRq,
  TarifaLog
} from 'src/app/models/facturacion';
import { Pagina } from 'src/app/models/pagina';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { aParametros } from 'src/app/utils/parametros';
import { environment } from 'src/environments/environment';

/**
 * Servicio de Angular para tarifas, atención médica y facturación.
 */
@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  /** URL base del API. */
  private readonly url = environment.apiUrlAuth;

  /**
   * @param backend servicio genérico de peticiones HTTP.
   */
  constructor(private readonly backend: BackendService) { }

  // ----- Tarifas -----

  /** Lista los servicios (opcionalmente solo los activos). */
  servicios(soloActivos = false): Observable<Servicio[]> {
    return this.backend.get<Servicio[]>(this.url, 'servicio', 'listar', new HttpParams().set('soloActivos', soloActivos));
  }

  /** Registra un servicio. */
  guardarServicio(rq: ServicioRq): Observable<RespuestaApi> {
    return this.backend.post<RespuestaApi>(this.url, 'servicio', 'guardar', rq);
  }

  /** Modifica un servicio. */
  actualizarServicio(id: number, rq: ServicioRq): Observable<RespuestaApi> {
    return this.backend.put<RespuestaApi>(this.url, 'servicio', String(id), rq);
  }

  /** Activa o inactiva un servicio. */
  cambiarActivoServicio(id: number, activo: boolean): Observable<RespuestaApi> {
    return this.backend.put<RespuestaApi>(this.url, 'servicio', `${id}/${activo ? 'activar' : 'inactivar'}`, {});
  }

  /** Log de cambios de la tarifa. */
  historialTarifa(id: number): Observable<TarifaLog[]> {
    return this.backend.get<TarifaLog[]>(this.url, 'servicio', `${id}/historial`);
  }

  // ----- Atención -----

  /** Agenda del veterinario para un día. */
  agenda(fecha: string): Observable<AgendaAtencion[]> {
    return this.backend.get<AgendaAtencion[]>(this.url, 'atencion', 'agenda', aParametros({ fecha }));
  }

  /** Inicia (o retoma) la atención de una cita. */
  iniciarAtencion(citaId: number): Observable<Atencion> {
    return this.backend.post<Atencion>(this.url, 'atencion', `iniciar/${citaId}`, {});
  }

  /** Consulta una atención. */
  atencion(historiaId: number): Observable<Atencion> {
    return this.backend.get<Atencion>(this.url, 'atencion', String(historiaId));
  }

  /** Guarda los datos clínicos. */
  guardarAtencion(historiaId: number, rq: AtencionRq): Observable<RespuestaApi> {
    return this.backend.put<RespuestaApi>(this.url, 'atencion', String(historiaId), rq);
  }

  /** Agrega un servicio prestado. */
  agregarServicio(historiaId: number, servicioId: number, cantidad: number): Observable<RespuestaApi> {
    return this.backend.post<RespuestaApi>(this.url, 'atencion', `${historiaId}/servicios`, { servicioId, cantidad });
  }

  /** Quita un servicio prestado. */
  quitarServicio(historiaId: number, atencionServicioId: number): Observable<RespuestaApi> {
    return this.backend.delete<RespuestaApi>(this.url, 'atencion', `${historiaId}/servicios/${atencionServicioId}`);
  }

  /** Finaliza la atención. */
  finalizarAtencion(historiaId: number): Observable<RespuestaApi> {
    return this.backend.put<RespuestaApi>(this.url, 'atencion', `${historiaId}/finalizar`, {});
  }

  /** Prefactura en PDF. */
  prefactura(historiaId: number): Observable<Blob> {
    return this.backend.getArchivo(this.url, 'atencion', `${historiaId}/prefactura`);
  }

  // ----- Facturación -----

  /** Atenciones finalizadas sin factura. */
  porFacturar(): Observable<Factura[]> {
    return this.backend.get<Factura[]>(this.url, 'factura', 'por-facturar');
  }

  /** Genera la factura de una atención. */
  generarFactura(historiaId: number, descuento: number, motivoDescuento: string): Observable<Factura> {
    return this.backend.post<Factura>(this.url, 'factura', 'generar', { historiaId, descuento, motivoDescuento });
  }

  /** Lista facturas. */
  facturas(filtro: FiltroFacturas): Observable<Pagina<Factura>> {
    return this.backend.get<Pagina<Factura>>(this.url, 'factura', 'listar', aParametros(filtro));
  }

  /** Consulta una factura con líneas y pagos. */
  factura(id: number): Observable<Factura> {
    return this.backend.get<Factura>(this.url, 'factura', String(id));
  }

  /** Registra un pago. */
  registrarPago(id: number, valor: number, medio: string, referencia: string): Observable<RespuestaApi> {
    return this.backend.post<RespuestaApi>(this.url, 'factura', `${id}/pagos`, { valor, medio, referencia });
  }

  /** Anula una factura. */
  anularFactura(id: number, motivo: string): Observable<RespuestaApi> {
    return this.backend.put<RespuestaApi>(this.url, 'factura', `${id}/anular`, { motivo });
  }

  /** Factura en PDF. */
  facturaPdf(id: number): Observable<Blob> {
    return this.backend.getArchivo(this.url, 'factura', `${id}/pdf`);
  }
}
