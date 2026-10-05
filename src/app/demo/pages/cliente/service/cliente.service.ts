import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente } from 'src/app/models/cliente';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private readonly api = `cliente`;

  constructor(private readonly backendService: BackendService) { }

  listar(): Observable<Cliente[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }
}
