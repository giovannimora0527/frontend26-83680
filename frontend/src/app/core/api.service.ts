import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/** Base del backend. En Docker nginx redirige /clinica/v1 al contenedor del backend. */
export const API = '/clinica/v1';

/** Cliente HTTP genérico para la API REST. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private params(p?: Record<string, any>): HttpParams {
    let hp = new HttpParams();
    Object.entries(p ?? {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') { hp = hp.set(k, String(v)); }
    });
    return hp;
  }

  get<T>(url: string, p?: Record<string, any>): Observable<T> {
    return this.http.get<T>(API + url, { params: this.params(p) });
  }
  post<T>(url: string, body: any = {}, p?: Record<string, any>): Observable<T> {
    return this.http.post<T>(API + url, body, { params: this.params(p) });
  }
  put<T>(url: string, body: any, p?: Record<string, any>): Observable<T> {
    return this.http.put<T>(API + url, body, { params: this.params(p) });
  }
  patch<T>(url: string, body: any = {}, p?: Record<string, any>): Observable<T> {
    return this.http.patch<T>(API + url, body, { params: this.params(p) });
  }
  delete<T>(url: string, p?: Record<string, any>): Observable<T> {
    return this.http.delete<T>(API + url, { params: this.params(p) });
  }

  /** Descarga un archivo (PDF / Excel) respetando el nombre enviado por el backend. */
  descargar(url: string, p?: Record<string, any>, nombrePorDefecto = 'archivo'): Observable<void> {
    return this.http.get(API + url, { params: this.params(p), responseType: 'blob', observe: 'response' })
      .pipe(map((r: HttpResponse<Blob>) => guardarBlob(r, nombrePorDefecto)));
  }
}

export function guardarBlob(r: HttpResponse<Blob>, nombrePorDefecto: string): void {
  const cd = r.headers.get('Content-Disposition') ?? '';
  const m = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
  const nombre = m ? decodeURIComponent(m[1] ?? m[2]) : nombrePorDefecto;
  const url = URL.createObjectURL(r.body as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
