import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Raza } from 'src/app/models/raza';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RazaService {

  private api = 'raza';

  constructor(private readonly backendService: BackendService) { }

  listar(): Observable<Raza[]> {
    return this.backendService.get<Raza[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  guardar(raza: Raza): Observable<unknown> {
    return this.backendService.post<unknown>(environment.apiUrlAuth, this.api, 'guardar', raza);
  }
}
