
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(private http: HttpClient) {}

  construirHeader(): HttpHeaders {
    const tokenRecuperado = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(tokenRecuperado ? { Authorization: `Bearer ${tokenRecuperado}` } : {})
    });
    return headers;
  }

  get<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    routerParams?: HttpParams
  ): Observable<T> {
    const tokenRecuperado = localStorage.getItem('token') || '';
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (tokenRecuperado) {
      headers = headers.set('Authorization', `Bearer ${tokenRecuperado}`);
    }

    return this.http.get<T>(`${urlApi}/${endpoint}/${service}`, {
      params: routerParams,
      headers
    });
  }

  post<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    data: unknown
  ): Observable<T> {
    const tokenRecuperado = localStorage.getItem('token') || '';
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (tokenRecuperado) {
      headers = headers.set('Authorization', `Bearer ${tokenRecuperado}`);
    }

    return this.http.post<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers
    });
  }

  put<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    data: unknown
  ): Observable<T> {
    const tokenRecuperado = localStorage.getItem('token') || '';
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (tokenRecuperado) {
      headers = headers.set('Authorization', `Bearer ${tokenRecuperado}`);
    }

    return this.http.put<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers
    });
  }

  postFile<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    data: FormData
  ): Observable<T> {
    const tokenRecuperado = localStorage.getItem('token') || '';
    let headers = new HttpHeaders();

    if (tokenRecuperado) {
      headers = headers.set('Authorization', `Bearer ${tokenRecuperado}`);
    }

    return this.http.post<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers
    });
  }
}
