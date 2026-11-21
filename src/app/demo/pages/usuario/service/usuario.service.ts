import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from 'src/app/models/usuario';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private api = `usuario`;

  constructor(private readonly backendService: BackendService) {}

  getUsuarios(): Observable<Usuario[]> {
    return this.backendService.get<Usuario[]>(environment.apiUrlAuth, this.api, "listar");
  }

  crear(usuario: { username: string; password: string; rol: string; activo: boolean; clienteId?: number; medicoId?: number }): Observable<Usuario> {
    return this.backendService.post<Usuario>(environment.apiUrlAuth, this.api, 'guardar', usuario);
  }

  actualizar(id: number, usuario: { username: string; password?: string; rol: string; activo: boolean; clienteId?: number; medicoId?: number }): Observable<Usuario> {
    return this.backendService.put<Usuario>(environment.apiUrlAuth, this.api, String(id), usuario);
  }
}
