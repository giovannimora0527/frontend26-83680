import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LogTarifa, Tarifa } from 'src/app/models/tarifa';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class TarifaService {
  private api = 'tarifa';

  constructor(private backendService: BackendService) {}

  listar(): Observable<Tarifa[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  listarActivas(): Observable<Tarifa[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-activas');
  }

  listarHistorial(tarifaId: number): Observable<LogTarifa[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `historial/${tarifaId}`);
  }

  crear(rq: any): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', rq);
  }

  actualizar(rq: any): Observable<any> {
    return this.backendService.put(environment.apiUrlAuth, this.api, 'actualizar', rq);
  }
}
