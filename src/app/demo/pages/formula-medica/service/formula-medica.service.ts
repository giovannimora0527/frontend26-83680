import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FormulaMedicaService {
  private api = `formula-medica`;

  constructor(private readonly backendService: BackendService) { }

  listar(): Observable<FormulaMedica[]> {
    return this.backendService.get<FormulaMedica[]>(environment.apiUrlAuth, this.api, 'listar');
  }
}
