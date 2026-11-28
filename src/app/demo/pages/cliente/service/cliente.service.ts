import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente } from 'src/app/models/cliente';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private api = `cliente`;

  constructor(private backendService: BackendService) {

  }

  listarClientes(): Observable<Cliente[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  guardar(cliente: Cliente): Observable<unknown> {
    return this.backendService.post<unknown>(environment.apiUrlAuth, this.api, 'guardar', cliente);
  }
}
