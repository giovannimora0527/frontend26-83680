import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  constructor(private http: HttpClient) { }

  construirHeader() {
    // Aqui obtenemos el token desde el local storage
    const tokenRecuperado = localStorage.getItem('token');
    if (tokenRecuperado != '') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        Authorization: 'Bearer ' + tokenRecuperado,
      });
      return headers;
    } else {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      });
      return headers;
    }
  }

  // Servicio generico para realizar peticiones GET al backend.
  get<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    routerParams?: HttpParams
  ) {
    const tokenRecuperado = localStorage.getItem('token') || ''; // Evita `null`
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: tokenRecuperado ? `Bearer ${tokenRecuperado}` : '',
    });
    return this.http.get<T>(`${urlApi}/${endpoint}/${service}`, {
      params: routerParams,
      headers: headers,
    });
  }


  // Servicio generico para realizar peticiones POST al backend.
  post<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Observable<T> {
    const tokenRecuperado = localStorage.getItem('token') || ''; // Evita `null`
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: tokenRecuperado ? `Bearer ${tokenRecuperado}` : '',
    });
    return this.http.post<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers: headers,
    });
  }

  // Servicio generico para realizar peticiones PUT al backend.
  put<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Observable<T> {
    const tokenRecuperado = localStorage.getItem('token') || ''; // Evita `null`
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: tokenRecuperado ? `Bearer ${tokenRecuperado}` : '',
    });
    return this.http.put<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers: headers,
    });
  }

  // Servicio generico para realizar peticiones DELETE al backend.
  delete<T>(urlApi: string, endpoint: string, service: string): Observable<T> {
    const tokenRecuperado = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: tokenRecuperado ? `Bearer ${tokenRecuperado}` : '' });
    return this.http.delete<T>(`${urlApi}/${endpoint}/${service}`, { headers });
  }

  // Servicio generico para realizar peticiones POST al backend con archivos.
  postFile<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Observable<T> {
    const tokenRecuperado = localStorage.getItem('token') || ''; // Evita `null`
    // Solo el token: el navegador pone el Content-Type multipart con su separador
    // (una cabecera adicional haría que el backend rechazara la petición por CORS).
    const headers = new HttpHeaders({
      Authorization: tokenRecuperado ? `Bearer ${tokenRecuperado}` : '',
    });
    return this.http.post<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers: headers,
    });
  }

  /**
   * Descarga un archivo (PDF, Excel...) del backend. Si el backend responde
   * con error, convierte el cuerpo JSON para que el mensaje se pueda mostrar.
   */
  getArchivo(urlApi: string, endpoint: string, service: string, routerParams?: HttpParams): Observable<Blob> {
    const tokenRecuperado = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: tokenRecuperado ? `Bearer ${tokenRecuperado}` : '' });
    return this.http.get(`${urlApi}/${endpoint}/${service}`, { params: routerParams, headers, responseType: 'blob' }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!(error.error instanceof Blob)) {
          return throwError(() => error);
        }
        return from(error.error.text()).pipe(
          switchMap((texto) => {
            let cuerpo: unknown = null;
            try { cuerpo = JSON.parse(texto); } catch { cuerpo = null; }
            return throwError(() => new HttpErrorResponse({ error: cuerpo, status: error.status, statusText: error.statusText, url: error.url ?? undefined }));
          })
        );
      })
    );
  }
}
