import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AtencionMedica } from 'src/app/models/atencion-medica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AtencionService {
  private api = 'atencion-medica';

  constructor(private backendService: BackendService) {}

  listar(): Observable<AtencionMedica[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  buscarPorCita(citaId: number): Observable<AtencionMedica> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `por-cita/${citaId}`);
  }

  guardar(rq: any): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', rq);
  }

  actualizar(rq: any): Observable<any> {
    return this.backendService.put(environment.apiUrlAuth, this.api, 'actualizar', rq);
  }
}
