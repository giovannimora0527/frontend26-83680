import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from 'src/app/models/cita';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private api = `cita`;

  constructor(private readonly backendService: BackendService) { }

  listar(): Observable<Cita[]> {
    const params = new HttpParams()
      .set('fechaInicial', '2020-01-01T00:00:00')
      .set('fechaFinal', '2030-01-01T00:00:00');

    return this.backendService.get<Cita[]>(environment.apiUrlAuth, this.api, 'listar', params);
  }
}
