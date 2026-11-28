import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cita } from 'src/app/models/cita';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitaService {

  private api = `cita`;
  
    constructor(private backendService: BackendService) {
  
    }
  
    listarCitas(): Observable<Cita[]> {
      return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
    }    

    listarCitasPorMascota(mascotaId: number): Observable<Cita[]> {
      const params = new HttpParams().set('mascotaId', mascotaId);
      return this.backendService.get(environment.apiUrlAuth, this.api, "listar-por-mascota", params);
    }

    listarCitasRango(fechaInicio: string, fechaFin: string): Observable<Cita[]> {
      const params = new HttpParams()
        .set('fechaInicio', fechaInicio)
        .set('fechaFin', fechaFin);
      return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-rango', params);
    }

    listarCitasPorMedico(medicoId: number): Observable<Cita[]> {
      const params = new HttpParams().set('medicoId', medicoId);
      return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-por-medico', params);
    }

    listarCitasPorMedicoYRango(medicoId: number, fechaInicio: string, fechaFin: string): Observable<Cita[]> {
      const params = new HttpParams()
        .set('medicoId', medicoId)
        .set('fechaInicio', fechaInicio)
        .set('fechaFin', fechaFin);
      return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-por-medico-rango', params);
    }

    guardarCita(cita: Cita): Observable<Cita> {
      return this.backendService.post(environment.apiUrlAuth, this.api, "crear", cita);
    }

    actualizarCita(cita: Cita): Observable<Cita> {
      return this.backendService.post(environment.apiUrlAuth, this.api, "actualizar", cita);
    }

    finalizarCita(citaId: number): Observable<{ message: string }> {
      const params = new HttpParams().set('citaId', citaId);
      return this.backendService.get(environment.apiUrlAuth, this.api, "finalizar", params);
    }


  }