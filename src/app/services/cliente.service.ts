import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from 'src/app/models/cliente';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio para consultar los clientes, se usa en los combos de citas, historias y fórmulas.
 */
@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private api = `cliente`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista los clientes activos.
   * @returns Observable con la lista de clientes.
   */
  listar(): Observable<Cliente[]> {
    return this.backendService.get<Cliente[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta un cliente por su identificador.
   * @param clienteId Identificador del cliente.
   * @returns Observable con el cliente.
   */
  consultar(clienteId: number): Observable<Cliente> {
    const params = new HttpParams().set('clienteId', clienteId);
    return this.backendService.get<Cliente>(environment.apiUrlAuth, this.api, 'consultar', params);
  }
}
