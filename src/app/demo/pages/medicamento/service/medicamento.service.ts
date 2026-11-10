import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medicamento } from 'src/app/models/medicamento';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {
  private api = 'medicamento';

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

  importarMasivo(formData: FormData): Observable<{ registrosValidos?: number; registrosInvalidos?: number; errores?: Array<{ fila: number; mensaje: string }>; importados?: Medicamento[] }> {
    return this.backendService.postFile<{ registrosValidos?: number; registrosInvalidos?: number; errores?: Array<{ fila: number; mensaje: string }>; importados?: Medicamento[] }>(environment.apiUrlAuth, this.api, 'carga-masiva', formData);
  }
}
