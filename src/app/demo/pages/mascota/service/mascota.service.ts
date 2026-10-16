import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mascota } from 'src/app/models/mascota';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MascotaService {
  private api = `mascota`;

  constructor(private readonly backendService: BackendService) { }


  listar(): Observable<Mascota[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  /**
   * Lista solo las mascotas del cliente seleccionado (combos dependientes).
   * @param clienteId Identificador del cliente.
   * @returns Observable con las mascotas del cliente.
   */
  listarPorCliente(clienteId: number): Observable<Mascota[]> {
    const params = new HttpParams().set('clienteId', clienteId);
    return this.backendService.get<Mascota[]>(environment.apiUrlAuth, this.api, 'listar-by-cliente', params);
  }

  /**
   * Consulta una mascota por su identificador.
   * @param mascotaId Identificador de la mascota.
   * @returns Observable con la mascota.
   */
  consultar(mascotaId: number): Observable<Mascota> {
    const params = new HttpParams().set('mascotaId', mascotaId);
    return this.backendService.get<Mascota>(environment.apiUrlAuth, this.api, 'consultar', params);
  }

}
