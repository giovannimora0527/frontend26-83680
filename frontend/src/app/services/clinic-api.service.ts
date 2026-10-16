import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AnotacionApi, AnotacionRequestApi, CitaApi, CitaRequestApi, ClienteApi, FormulaApi, FormulaRequestApi, HistoriaApi, HistoriaRequestApi, MascotaApi, MedicamentoApi, MedicoApi, ErrorApi } from '../models/clinic-workflows';

/** Centraliza las llamadas HTTP usadas por los módulos transaccionales del parcial. */
@Injectable({ providedIn: 'root' })
export class ClinicApiService {
  private readonly baseUrl = environment.apiUrlAuth;
  /** Recibe el cliente HTTP administrado por Angular. */
  constructor(private readonly http: HttpClient) {}

  /** Lista fórmulas médicas activas. */
  listarFormulas(): Observable<FormulaApi[]> { return this.http.get<FormulaApi[]>(`${this.baseUrl}/formulas-medicas`); }
  /** Consulta una fórmula por identificador. */
  obtenerFormula(id: number): Observable<FormulaApi> { return this.http.get<FormulaApi>(`${this.baseUrl}/formulas-medicas/${id}`); }
  /** Registra una fórmula médica. */
  crearFormula(data: FormulaRequestApi): Observable<FormulaApi> { return this.http.post<FormulaApi>(`${this.baseUrl}/formulas-medicas`, data); }
  /** Actualiza una fórmula médica. */
  actualizarFormula(id: number, data: FormulaRequestApi): Observable<FormulaApi> { return this.http.put<FormulaApi>(`${this.baseUrl}/formulas-medicas/${id}`, data); }
  /** Inactiva una fórmula de forma lógica. */
  inactivarFormula(id: number): Observable<void> { return this.http.patch<void>(`${this.baseUrl}/formulas-medicas/${id}/inactivar`, {}); }

  /** Lista citas, con rango opcional de fechas. */
  listarCitas(fechaInicial?: string, fechaFinal?: string): Observable<CitaApi[]> {
    let params = new HttpParams();
    if (fechaInicial && fechaFinal) params = params.set('fechaInicial', fechaInicial).set('fechaFinal', fechaFinal);
    return this.http.get<CitaApi[]>(`${this.baseUrl}/citas`, { params });
  }
  /** Consulta una cita por identificador. */
  obtenerCita(id: number): Observable<CitaApi> { return this.http.get<CitaApi>(`${this.baseUrl}/citas/${id}`); }
  /** Crea una cita. */
  crearCita(data: CitaRequestApi): Observable<CitaApi> { return this.http.post<CitaApi>(`${this.baseUrl}/citas`, data); }
  /** Actualiza una cita. */
  actualizarCita(id: number, data: CitaRequestApi): Observable<CitaApi> { return this.http.put<CitaApi>(`${this.baseUrl}/citas/${id}`, data); }

  /** Lista historias clínicas, con rango opcional de fechas. */
  listarHistorias(fechaInicial?: string, fechaFinal?: string): Observable<HistoriaApi[]> {
    let params = new HttpParams();
    if (fechaInicial && fechaFinal) params = params.set('fechaInicial', fechaInicial).set('fechaFinal', fechaFinal);
    return this.http.get<HistoriaApi[]>(`${this.baseUrl}/historias-clinicas`, { params });
  }
  /** Obtiene el detalle de una historia clínica. */
  obtenerHistoria(id: number): Observable<HistoriaApi> { return this.http.get<HistoriaApi>(`${this.baseUrl}/historias-clinicas/${id}`); }
  /** Registra una historia clínica vinculada a una cita atendida. */
  crearHistoria(data: HistoriaRequestApi): Observable<HistoriaApi> { return this.http.post<HistoriaApi>(`${this.baseUrl}/historias-clinicas`, data); }
  /** Consulta el histórico de anotaciones de una historia. */
  listarAnotaciones(historiaId: number): Observable<AnotacionApi[]> { return this.http.get<AnotacionApi[]>(`${this.baseUrl}/historias-clinicas/${historiaId}/anotaciones`); }
  /** Registra una anotación en el histórico. */
  crearAnotacion(historiaId: number, data: AnotacionRequestApi): Observable<AnotacionApi> { return this.http.post<AnotacionApi>(`${this.baseUrl}/historias-clinicas/${historiaId}/anotaciones`, data); }
  /** Actualiza una anotación. */
  actualizarAnotacion(id: number, data: AnotacionRequestApi): Observable<AnotacionApi> { return this.http.put<AnotacionApi>(`${this.baseUrl}/anotaciones-historia/${id}`, data); }
  /** Lista anotaciones con filtro opcional por fecha. */
  listarTodasAnotaciones(fechaInicial?: string, fechaFinal?: string): Observable<AnotacionApi[]> {
    let params = new HttpParams();
    if (fechaInicial && fechaFinal) params = params.set('fechaInicial', fechaInicial).set('fechaFinal', fechaFinal);
    return this.http.get<AnotacionApi[]>(`${this.baseUrl}/anotaciones-historia`, { params });
  }

  /** Lista los clientes activos para formularios. */
  listarClientes(): Observable<ClienteApi[]> { return this.http.get<ClienteApi[]>(`${this.baseUrl}/clientes`); }
  /** Lista mascotas de un cliente y permite construir combos dependientes. */
  listarMascotas(clienteId?: number): Observable<MascotaApi[]> {
    let params = new HttpParams(); if (clienteId !== undefined) params = params.set('clienteId', clienteId);
    return this.http.get<MascotaApi[]>(`${this.baseUrl}/mascotas`, { params });
  }
  /** Lista veterinarios existentes. */
  listarMedicos(): Observable<MedicoApi[]> { return this.http.get<MedicoApi[]>(`${this.baseUrl}/medicos`); }
  /** Lista medicamentos disponibles. */
  listarMedicamentos(): Observable<MedicamentoApi[]> { return this.http.get<MedicamentoApi[]>(`${this.baseUrl}/medicamentos`); }

  /** Traduce errores HTTP a mensajes legibles para usuarios de la clínica. */
  mensajeError(error: unknown, accion: string): string {
    const httpError = error as { status?: number; error?: ErrorApi; message?: string };
    if (httpError?.status === 0) return 'No se pudo conectar con el backend. Verifique que Spring Boot esté ejecutándose y que la base de datos esté disponible.';
    if (httpError?.error?.message) return httpError.error.message;
    if (httpError?.status === 404) return 'El registro solicitado ya no existe o no está disponible.';
    if (httpError?.status === 409) return `No se pudo ${accion} por una restricción de negocio o integridad de datos.`;
    if (httpError?.status === 400) return 'Revise los campos obligatorios y las fechas ingresadas.';
    return `No fue posible ${accion}. Intente nuevamente.`;
  }
}
