import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Cliente } from 'src/app/models/cliente';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private api = 'cliente';

  constructor(
    private readonly backendService: BackendService
  ) {}


  // ==========================================
  // LISTAR
  // ==========================================

  listar(): Observable<Cliente[]> {

    return this.backendService.get<Cliente[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }


  // ==========================================
  // CREAR
  // ==========================================

  crear(cliente: Cliente): Observable<Cliente> {

    return this.backendService.post<Cliente>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      cliente
    );
  }


  // ==========================================
  // ACTUALIZAR
  // ==========================================

  actualizar(
    clienteId: number,
    cliente: Cliente
  ): Observable<Cliente> {

    return this.backendService.put<Cliente>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${clienteId}`,
      cliente
    );
  }


  // ==========================================
  // CAMBIAR ESTADO
  // ==========================================

  cambiarEstado(
    clienteId: number,
    activo: boolean
  ): Observable<Cliente> {

    return this.backendService.put<Cliente>(
      environment.apiUrlAuth,
      this.api,
      `estado/${clienteId}`,
      activo
    );
  }
}