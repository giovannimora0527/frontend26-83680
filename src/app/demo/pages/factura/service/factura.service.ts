import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Factura } from 'src/app/models/factura';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private api = 'factura';

  constructor(private backendService: BackendService) {}

  listar(): Observable<Factura[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  buscarPorCita(citaId: number): Observable<Factura> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `por-cita/${citaId}`);
  }

  buscarPorId(id: number): Observable<Factura> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `por-id/${id}`);
  }

  generar(rq: any): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'generar', rq);
  }

  registrarPago(rq: any): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'pago', rq);
  }

  anular(id: number): Observable<any> {
    return this.backendService.put(environment.apiUrlAuth, this.api, `anular/${id}`, {});
  }
}
