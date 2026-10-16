import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from 'src/app/models/cliente';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio para consumir los endpoints de clientes.
 */
@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  /** Ruta base del backend para los clientes. */
  private api = `cliente`;

  constructor(private backendService: BackendService) {

  }

  /**
   * Lista todos los clientes.
   * @returns lista de clientes.
   */
  listarClientes(): Observable<Cliente[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  /**
   * Consulta un cliente por id.
   * @param clienteId id del cliente.
   * @returns el cliente.
   */
  consultarCliente(clienteId: number): Observable<Cliente> {
    const params = new HttpParams().set('clienteId', clienteId);
    return this.backendService.get(environment.apiUrlAuth, this.api, 'consultar', params);
  }

  /**
   * Crea un cliente (POST).
   * @param cliente datos del cliente.
   * @returns respuesta del backend.
   */
  crearCliente(cliente: Cliente): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', cliente);
  }

  /**
   * Actualiza un cliente (PUT).
   * @param cliente datos del cliente con su clienteId.
   * @returns respuesta del backend.
   */
  actualizarCliente(cliente: Cliente): Observable<MiRespuesta> {
    return this.backendService.put(environment.apiUrlAuth, this.api, 'actualizar', cliente);
  }
}
