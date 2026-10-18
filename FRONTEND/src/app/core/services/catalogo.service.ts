import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { Cliente, Mascota, Medicamento, Medico } from '../models/catalogos';

/** Consulta de catálogos (clientes, mascotas, veterinarios, medicamentos) usados en los combos. */
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);

  /** @returns Todos los clientes. */
  listarClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${API_URL}/cliente/listar`);
  }

  /**
   * @param id Identificador del cliente.
   * @returns El cliente consultado.
   */
  obtenerCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${API_URL}/cliente/obtener/${id}`);
  }

  /** @returns Todas las mascotas registradas. */
  listarMascotas(): Observable<Mascota[]> {
    return this.http.get<Mascota[]>(`${API_URL}/mascota/listar`);
  }

  /**
   * Lista únicamente las mascotas de un cliente (combo dependiente).
   * @param clienteId Identificador del cliente.
   * @returns Mascotas del cliente.
   */
  listarMascotasDeCliente(clienteId: number): Observable<Mascota[]> {
    return this.http.get<Mascota[]>(`${API_URL}/mascota/listar-by-cliente`, {
      params: new HttpParams().set('clienteId', clienteId),
    });
  }

  /**
   * @param id Identificador de la mascota.
   * @returns La mascota consultada.
   */
  obtenerMascota(id: number): Observable<Mascota> {
    return this.http.get<Mascota>(`${API_URL}/mascota/obtener/${id}`);
  }

  /** @returns Todos los veterinarios. */
  listarMedicos(): Observable<Medico[]> {
    return this.http.get<Medico[]>(`${API_URL}/medico/listar`);
  }

  /** @returns Catálogo de medicamentos. */
  listarMedicamentos(): Observable<Medicamento[]> {
    return this.http.get<Medicamento[]>(`${API_URL}/medicamento/listar`);
  }
}
