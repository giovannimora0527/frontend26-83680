import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http'; // HttpHeaders needed for carga masiva
import { Observable } from 'rxjs';
import { Medicamento } from 'src/app/models/medicamento';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {

  private api = 'medicamento';

  constructor(private readonly backendService: BackendService) {}

  listarMedicamentos(): Observable<Medicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  guardar(medicamento: Medicamento): Observable<unknown> {
    return this.backendService.post<unknown>(environment.apiUrlAuth, this.api, 'guardar', medicamento);
  }

  previsualizarCargaMasiva(archivo: File): Observable<unknown> {
    const token = sessionStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' });
    const formData = new FormData();
    formData.append('archivo', archivo);
    // Use HttpClient directly since BackendService.post sets Content-Type: application/json
    return (this.backendService as any).http.post(
      `${environment.apiUrlAuth}/${this.api}/carga-masiva/previsualizar`,
      formData,
      { headers }
    );
  }

  confirmarCargaMasiva(registros: Medicamento[]): Observable<unknown> {
    return this.backendService.post<unknown>(environment.apiUrlAuth, this.api, 'carga-masiva/confirmar', registros);
  }

  listarLotes(medicamentoId: number): Observable<unknown[]> {
    const params = new HttpParams().set('medicamentoId', medicamentoId);
    return this.backendService.get(environment.apiUrlAuth, this.api, 'lotes', params);
  }
}
