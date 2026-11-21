import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BackendService {
  constructor(private readonly http: HttpClient) {}

  private construirHeaders(contenidoJson = true): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    const headers: Record<string, string> = {};
    if (contenidoJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  get<T>(urlApi: string, endpoint: string, service: string, routerParams?: HttpParams): Observable<T> {
    return this.http.get<T>(`${urlApi}/${endpoint}/${service}`, {
      params: routerParams,
      headers: this.construirHeaders()
    });
  }

  post<T>(urlApi: string, endpoint: string, service: string, data: unknown): Observable<T> {
    return this.http.post<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers: this.construirHeaders()
    });
  }

  put<T>(urlApi: string, endpoint: string, service: string, data: unknown): Observable<T> {
    return this.http.put<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers: this.construirHeaders()
    });
  }

  patch<T>(urlApi: string, endpoint: string, service: string, data: unknown, routerParams?: HttpParams): Observable<T> {
    return this.http.patch<T>(`${urlApi}/${endpoint}/${service}`, data, {
      params: routerParams,
      headers: this.construirHeaders()
    });
  }

  postFile<T>(urlApi: string, endpoint: string, service: string, data: unknown): Observable<T> {
    return this.http.post<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers: this.construirHeaders(false)
    });
  }

  getBlob(urlApi: string, endpoint: string, service: string, routerParams?: HttpParams): Observable<Blob> {
    return this.http.get(`${urlApi}/${endpoint}/${service}`, {
      params: routerParams,
      headers: this.construirHeaders(false),
      responseType: 'blob'
    });
  }
}
