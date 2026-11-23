import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Perfil, UsuarioSistema } from 'src/app/models/clinica';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio de usuarios y perfiles (solo administrador).
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly url = environment.apiUrlAuth;

  constructor(private readonly backend: BackendService) { }

  /** @returns usuarios. */
  listar(): Observable<UsuarioSistema[]> {
    return this.backend.get(this.url, 'usuario', 'listar');
  }

  /** @returns perfiles. */
  perfiles(): Observable<Perfil[]> {
    return this.backend.get(this.url, 'usuario', 'perfiles');
  }

  /** @returns respuesta al crear. */
  guardar(u: UsuarioSistema): Observable<MiRespuesta> {
    return this.backend.post(this.url, 'usuario', 'guardar', u);
  }

  /** @returns respuesta al editar. */
  actualizar(u: UsuarioSistema): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'usuario', 'actualizar', u);
  }
}
