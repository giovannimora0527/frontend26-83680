import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnotacionHistoriaService {
  private api = `anotacion-historia`;

  constructor(private readonly backendService: BackendService) { }

  listar(): Observable<AnotacionHistoria[]> {
    const params = new HttpParams()
      .set('fechaInicial', '2020-01-01T00:00:00')
      .set('fechaFinal', '2030-01-01T00:00:00');

    return this.backendService.get<AnotacionHistoria[]>(environment.apiUrlAuth, this.api, 'listar', params);
  }
}
