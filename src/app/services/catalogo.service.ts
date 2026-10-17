import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ClienteOpcion, MascotaOpcion, MedicamentoOpcion, MedicoOpcion } from 'src/app/models/catalogo';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio compartido con las consultas de catálogos que usan los formularios
 * de citas, historias clínicas y fórmulas (clientes, mascotas, veterinarios
 * y medicamentos). Centralizarlas evita repetir los mismos endpoints en
 * cada módulo.
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista los clientes activos (un cliente inactivo no puede tener citas,
   * historias ni fórmulas nuevas).
   *
   * @returns lista de clientes activos.
   */
  listarClientes(): Observable<ClienteOpcion[]> {
    const params = new HttpParams().set('soloActivos', true);
    return this.backendService.get<ClienteOpcion[]>(environment.apiUrlAuth, 'cliente', 'listar', params);
  }

  /**
   * Consulta un cliente por su identificador.
   *
   * @param clienteId identificador del cliente.
   * @returns el cliente encontrado.
   */
  consultarCliente(clienteId: number): Observable<ClienteOpcion> {
    return this.backendService.get<ClienteOpcion>(environment.apiUrlAuth, 'cliente', String(clienteId));
  }

  /**
   * Lista únicamente las mascotas de un cliente (combo dependiente).
   *
   * @param clienteId identificador del cliente.
   * @returns mascotas del cliente.
   */
  listarMascotasPorCliente(clienteId: number): Observable<MascotaOpcion[]> {
    const params = new HttpParams().set('clienteId', clienteId);
    return this.backendService.get<MascotaOpcion[]>(environment.apiUrlAuth, 'mascota', 'listar-by-cliente', params);
  }

  /**
   * Consulta una mascota por su identificador.
   *
   * @param mascotaId identificador de la mascota.
   * @returns la mascota encontrada.
   */
  consultarMascota(mascotaId: number): Observable<MascotaOpcion> {
    return this.backendService.get<MascotaOpcion>(environment.apiUrlAuth, 'mascota', String(mascotaId));
  }

  /**
   * Lista los veterinarios registrados.
   *
   * @returns lista de veterinarios.
   */
  listarMedicos(): Observable<MedicoOpcion[]> {
    return this.backendService.get<MedicoOpcion[]>(environment.apiUrlAuth, 'medico', 'listar');
  }

  /**
   * Lista los medicamentos disponibles para formular.
   *
   * @returns lista de medicamentos.
   */
  listarMedicamentos(): Observable<MedicamentoOpcion[]> {
    return this.backendService.get<MedicamentoOpcion[]>(environment.apiUrlAuth, 'medicamento', 'listar');
  }
}
