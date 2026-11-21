import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medicamento } from 'src/app/models/medicamento';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { LoteMedicamento } from 'src/app/models/lote-medicamento';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {
  private api = 'medicamento';
  private readonly cargaMasivaEndpoint = 'carga-masiva';

  constructor(private readonly backendService: BackendService) { }

  listar(): Observable<Medicamento[]> {
    return this.backendService.get<Medicamento[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  guardar(medicamento: Medicamento): Observable<MiRespuesta> {
    return this.backendService.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'guardar', medicamento);
  }

  actualizar(medicamento: Medicamento): Observable<MiRespuesta> {
    return this.backendService.put<MiRespuesta>(environment.apiUrlAuth, this.api, 'actualizar', medicamento);
  }

  importarMasivo(formData: FormData, confirmar = false): Observable<{ totalRegistros?: number; registrosValidos?: number; registrosInvalidos?: number; errores?: Array<{ fila: number; mensaje: string }>; importados?: Medicamento[] }> {
    const endpoint = confirmar ? `${this.cargaMasivaEndpoint}?confirmar=true` : this.cargaMasivaEndpoint;
    return this.backendService.postFile<{ totalRegistros?: number; registrosValidos?: number; registrosInvalidos?: number; errores?: Array<{ fila: number; mensaje: string }>; importados?: Medicamento[] }>(environment.apiUrlAuth, this.api, endpoint, formData);
  }

  listarLotes(medicamentoId: number): Observable<LoteMedicamento[]> {
    return this.backendService.get<LoteMedicamento[]>(environment.apiUrlAuth, this.api, `${medicamentoId}/lotes`);
  }

  registrarLote(medicamentoId: number, lote: LoteMedicamento): Observable<MiRespuesta> {
    return this.backendService.post<MiRespuesta>(environment.apiUrlAuth, this.api, `${medicamentoId}/lotes`, lote);
  }
}
