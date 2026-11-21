import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Mensajes } from '../../core/mensajes';
import { Menu, Respuesta } from '../../core/models';

interface PerfilFila {
  perfilId: number; codigo: string; nombre: string; activo: boolean; usuariosActivos: number; menuIds: number[];
}

/**
 * Perfiles y permisos: qué menús ve cada perfil y qué perfiles o menús están activos.
 * El backend impide dejar al Administrador sin este módulo o inactivar su perfil.
 */
@Component({
  selector: 'app-perfiles',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="d-flex flex-wrap align-items-center mb-3 gap-2">
    <h4 class="titulo-pagina mb-0">Perfiles y permisos</h4>
  </div>
  <div class="alert alert-light border small">
    <i class="bi bi-info-circle me-1"></i>Los menús definen qué módulos aparecen y a cuáles puede entrar cada perfil.
    Las operaciones de cada módulo siguen validándose en el servidor según el perfil, por lo que asignar un menú
    no otorga permisos sobre servicios que el perfil no tiene.
  </div>

  <div class="row g-3">
    <div class="col-lg-4">
      <div class="card">
        <div class="card-header fw-semibold">Perfiles</div>
        <div class="list-group list-group-flush">
          @for (p of perfiles; track p.perfilId) {
            <button type="button" class="list-group-item list-group-item-action d-flex align-items-center gap-2"
                    [class.active]="sel?.perfilId === p.perfilId" (click)="seleccionar(p)">
              <div class="me-auto text-start">
                <div class="fw-semibold">{{ p.nombre }}</div>
                <small [class.text-white-50]="sel?.perfilId === p.perfilId" [class.text-muted]="sel?.perfilId !== p.perfilId">
                  {{ p.codigo }} · {{ p.usuariosActivos }} usuario(s) · {{ p.menuIds.length }} menú(s)</small>
              </div>
              <span class="badge" [class]="p.activo ? 'bg-success' : 'bg-secondary'">{{ p.activo ? 'Activo' : 'Inactivo' }}</span>
            </button>
          } @empty { <div class="list-group-item text-muted">Sin perfiles.</div> }
        </div>
      </div>
    </div>

    <div class="col-lg-8">
      @if (sel) {
        <div class="card">
          <div class="card-header d-flex flex-wrap align-items-center gap-2">
            <span class="fw-semibold me-auto">Menús de {{ sel.nombre }}</span>
            <button class="btn btn-sm btn-outline-secondary" (click)="marcarTodos(true)">Todos</button>
            <button class="btn btn-sm btn-outline-secondary" (click)="marcarTodos(false)">Ninguno</button>
            <button class="btn btn-sm" [class]="sel.activo ? 'btn-outline-danger' : 'btn-outline-success'"
                    [disabled]="sel.codigo === 'ADMIN'" (click)="estadoPerfil(sel)">
              <i class="bi bi-power me-1"></i>{{ sel.activo ? 'Inactivar perfil' : 'Activar perfil' }}</button>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead><tr><th style="width:48px"></th><th>Menú</th><th>Ruta</th><th class="text-center">Orden</th><th>Estado global</th><th></th></tr></thead>
              <tbody>
                @for (m of menus; track m.menuId) {
                  <tr [class.table-light]="!m.activo">
                    <td><input class="form-check-input" type="checkbox" [id]="'m' + m.menuId"
                               [checked]="marcados.has(m.menuId)" (change)="alternar(m.menuId)"
                               [disabled]="bloqueado(m)"></td>
                    <td><label class="mb-0" [for]="'m' + m.menuId"><i [class]="icono(m.icon)" class="me-2 text-muted"></i>{{ m.title }}</label></td>
                    <td><code class="small">{{ m.url }}</code></td>
                    <td class="text-center">{{ m.orden }}</td>
                    <td><span class="badge" [class]="m.activo ? 'bg-success' : 'bg-secondary'">{{ m.activo ? 'Activo' : 'Inactivo' }}</span></td>
                    <td class="text-end">
                      <button class="btn btn-sm" [class]="m.activo ? 'btn-outline-danger' : 'btn-outline-success'"
                              [disabled]="m.code === 'perfiles'" (click)="estadoMenu(m)"
                              [title]="m.activo ? 'Ocultar este menú a todos los perfiles' : 'Volver a mostrar el menú'">
                        <i class="bi bi-power"></i></button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="card-footer d-flex align-items-center gap-2">
            <small class="text-muted me-auto">{{ marcados.size }} de {{ menus.length }} menús seleccionados
              @if (cambios()) { · <span class="text-warning fw-semibold">cambios sin guardar</span> }</small>
            <button class="btn btn-light" [disabled]="!cambios() || guardando" (click)="seleccionar(sel)">Descartar</button>
            <button class="btn btn-primary" [disabled]="!cambios() || guardando" (click)="guardar()">
              @if (guardando) { <span class="spinner-border spinner-border-sm me-1"></span> }Guardar menús</button>
          </div>
        </div>
      } @else {
        <div class="alert alert-light border">Seleccione un perfil para ver y editar sus menús.</div>
      }
    </div>
  </div>
  `
})
export class PerfilesComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  perfiles: PerfilFila[] = [];
  menus: Menu[] = [];
  sel: PerfilFila | null = null;
  marcados = new Set<number>();
  guardando = false;

  ngOnInit(): void {
    this.api.get<Menu[]>('/perfil/menus').subscribe({ next: m => this.menus = m, error: e => Mensajes.error(e) });
    this.cargar();
  }

  cargar(idSeleccionado?: number): void {
    this.api.get<PerfilFila[]>('/perfil/listar').subscribe({
      next: p => {
        this.perfiles = p;
        const previo = p.find(x => x.perfilId === (idSeleccionado ?? this.sel?.perfilId));
        if (previo) { this.seleccionar(previo); }
      },
      error: e => Mensajes.error(e)
    });
  }

  seleccionar(p: PerfilFila): void {
    this.sel = p;
    this.marcados = new Set(p.menuIds);
  }

  alternar(menuId: number): void {
    if (this.marcados.has(menuId)) { this.marcados.delete(menuId); } else { this.marcados.add(menuId); }
  }

  marcarTodos(valor: boolean): void {
    this.marcados = new Set(valor ? this.menus.map(m => m.menuId) : this.menus.filter(m => this.bloqueado(m)).map(m => m.menuId));
  }

  /** El Administrador no puede quitarse a sí mismo el acceso a este módulo. */
  bloqueado(m: Menu): boolean {
    return this.sel?.codigo === 'ADMIN' && m.code === 'perfiles';
  }

  cambios(): boolean {
    if (!this.sel) { return false; }
    const antes = this.sel.menuIds;
    return antes.length !== this.marcados.size || antes.some(id => !this.marcados.has(id));
  }

  guardar(): void {
    if (!this.sel) { return; }
    const perfil = this.sel;
    this.guardando = true;
    this.api.put<Respuesta>('/perfil/menus', { perfilId: perfil.perfilId, menuIds: [...this.marcados] }).subscribe({
      next: r => {
        this.guardando = false;
        Mensajes.toast(r.message);
        this.cargar(perfil.perfilId);
        this.refrescarPropio(perfil.codigo);
      },
      error: e => { this.guardando = false; Mensajes.error(e); }
    });
  }

  async estadoPerfil(p: PerfilFila): Promise<void> {
    const texto = p.activo
      ? `Los ${p.usuariosActivos} usuario(s) con el perfil ${p.nombre} no podrán ingresar y sus sesiones abiertas dejarán de funcionar.`
      : `Los usuarios con el perfil ${p.nombre} podrán volver a ingresar.`;
    if (!await Mensajes.confirmar(texto, p.activo ? '¿Inactivar perfil?' : '¿Activar perfil?')) { return; }
    this.api.patch<Respuesta>('/perfil/cambiar-estado', {}, { perfilId: p.perfilId, activo: !p.activo }).subscribe({
      next: r => { Mensajes.toast(r.message); this.cargar(p.perfilId); },
      error: e => Mensajes.error(e)
    });
  }

  async estadoMenu(m: Menu): Promise<void> {
    const texto = m.activo
      ? `"${m.title}" dejará de aparecer para todos los perfiles, aunque lo tengan asignado.`
      : `"${m.title}" volverá a aparecer en los perfiles que lo tengan asignado.`;
    if (!await Mensajes.confirmar(texto)) { return; }
    this.api.patch<Respuesta>('/perfil/menu/cambiar-estado', {}, { menuId: m.menuId, activo: !m.activo }).subscribe({
      next: r => {
        Mensajes.toast(r.message);
        this.api.get<Menu[]>('/perfil/menus').subscribe(x => this.menus = x);
        this.refrescarPropio(this.auth.perfil());
      },
      error: e => Mensajes.error(e)
    });
  }

  icono(icon: string): string {
    return icon?.startsWith('feather') ? 'bi bi-people' : icon;
  }

  /** Si se cambió el perfil del usuario conectado, el menú lateral se actualiza de inmediato. */
  private refrescarPropio(codigo: string): void {
    if (codigo === this.auth.perfil()) { this.auth.recargarMenus(); }
  }
}
