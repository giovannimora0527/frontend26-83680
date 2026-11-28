import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { Historia } from 'src/app/models/historia';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { HistoriaRq } from 'src/app/models/historia-rq';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistoriaService {
  private api = 'historia-clinica';

  constructor(private readonly backendService: BackendService) { }

  listar(): Observable<HistoriaMedica[]> {
    return this.backendService.get<HistoriaMedica[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  listarPorMedico(medicoId: number): Observable<HistoriaMedica[]> {
    const params = new HttpParams().set('medicoId', medicoId);
    return this.backendService.get<HistoriaMedica[]>(environment.apiUrlAuth, this.api, 'listar-por-medico', params);
  }

  crearHistoria(historia: HistoriaRq): Observable<Historia> {
    return this.backendService.post<Historia>(environment.apiUrlAuth, this.api, 'guardar', historia);
  }

  actualizarHistoria(historia: HistoriaRq & { id: number }): Observable<Historia> {
    return this.backendService.post<Historia>(environment.apiUrlAuth, this.api, 'actualizar', historia);
  }
}
