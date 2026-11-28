import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from 'src/app/models/usuario';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface PerfilRs {
  perfilId: number;
  nombre: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private api = `usuario`;

  constructor(private backendService: BackendService) { }

  getUsuarios(): Observable<Usuario[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-ordenado');
  }

  crear(rq: Usuario): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', rq);
  }

  actualizar(rq: Usuario): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'actualizar', rq);
  }

  getPerfiles(): Observable<PerfilRs[]> {
    return this.backendService.get(environment.apiUrlAuth, 'perfil', 'listar');
  }
}
