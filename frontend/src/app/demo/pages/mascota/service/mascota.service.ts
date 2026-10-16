import { Injectable } from '@angular/core';
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

}
