import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { PerfilService } from './service/perfil.service';
import { MenuOpcion } from 'src/app/models/auth';
import { PerfilAcceso } from 'src/app/models/perfil';
import { confirmar, mostrarError, notificarExito } from 'src/app/utils/mensajes';

/** Opciones que el administrador nunca puede perder (el backend aplica la misma regla). */
const MENUS_PROTEGIDOS = ['usuarios', 'perfiles'];

/**
 * Administración de perfiles y menús: una matriz con las opciones en las
 * filas y los perfiles en las columnas. Define lo que cada perfil ve; los
 * permisos sobre los servicios los valida el backend por separado.
 */
@Component({
  selector: 'app-perfil',
  imports: [CommonModule],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent implements OnInit {
  /** Perfiles del sistema. */
  perfiles: PerfilAcceso[] = [];
  /** Opciones de menú. */
  menus: MenuOpcion[] = [];
  /** Indica que se están consultando los datos. */
  cargando = false;
  /** Indica que la última consulta falló. */
  error = false;
  /** Indica que se están guardando los cambios. */
  guardando = false;

  /** Asignaciones que se están editando, por perfil. */
  private asignados = new Map<number, Set<number>>();

  /**
   * @param perfilService servicio de perfiles y menús.
   */
  constructor(private readonly perfilService: PerfilService) { }

  /** Consulta los datos iniciales. */
  ngOnInit(): void {
    this.cargar();
  }

  /** Perfiles con cambios sin guardar. */
  get perfilesModificados(): PerfilAcceso[] {
    return this.perfiles.filter((perfil) => {
      const actual = this.asignados.get(perfil.perfilId) ?? new Set<number>();
      return actual.size !== perfil.menuIds.length || perfil.menuIds.some((id) => !actual.has(id));
    });
  }

  /** Consulta perfiles y menús, y descarta los cambios sin guardar. */
  cargar(): void {
    this.cargando = true;
    this.error = false;
    forkJoin({ perfiles: this.perfilService.listar(), menus: this.perfilService.listarMenus() }).subscribe({
      next: ({ perfiles, menus }) => {
        this.perfiles = perfiles;
        this.menus = menus;
        this.asignados = new Map(perfiles.map((p) => [p.perfilId, new Set(p.menuIds)]));
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.error = true;
        mostrarError(error, 'No se pudieron cargar los perfiles');
      }
    });
  }

  /**
   * Indica si la opción está asignada al perfil.
   *
   * @param perfil perfil de la columna.
   * @param menu opción de la fila.
   * @returns true si está asignada.
   */
  asignado(perfil: PerfilAcceso, menu: MenuOpcion): boolean {
    return this.asignados.get(perfil.perfilId)?.has(menu.menuId) ?? false;
  }

  /**
   * Indica si la asignación no se puede quitar.
   *
   * @param perfil perfil de la columna.
   * @param menu opción de la fila.
   * @returns true para los menús protegidos del administrador.
   */
  bloqueado(perfil: PerfilAcceso, menu: MenuOpcion): boolean {
    return perfil.codigo === 'ADMIN' && MENUS_PROTEGIDOS.includes(menu.code);
  }

  /**
   * Indica si la opción no se puede inactivar.
   *
   * @param menu opción de la fila.
   * @returns true para los menús protegidos.
   */
  menuProtegido(menu: MenuOpcion): boolean {
    return MENUS_PROTEGIDOS.includes(menu.code);
  }

  /**
   * Marca o desmarca una asignación.
   *
   * @param perfil perfil de la columna.
   * @param menu opción de la fila.
   */
  alternar(perfil: PerfilAcceso, menu: MenuOpcion): void {
    const actual = this.asignados.get(perfil.perfilId);
    if (!actual || this.bloqueado(perfil, menu)) {
      return;
    }
    if (actual.has(menu.menuId)) {
      actual.delete(menu.menuId);
    } else {
      actual.add(menu.menuId);
    }
  }

  /** Guarda las asignaciones de los perfiles modificados. */
  guardar(): void {
    const modificados = this.perfilesModificados;
    if (this.guardando || modificados.length === 0) {
      return;
    }
    this.guardando = true;
    forkJoin(modificados.map((p) =>
      this.perfilService.actualizarMenus(p.perfilId, [...(this.asignados.get(p.perfilId) ?? [])])
    )).subscribe({
      next: () => {
        this.guardando = false;
        notificarExito('Menús actualizados. Cada usuario los verá al volver a ingresar.');
        this.cargar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error, 'No se pudieron guardar los menús');
      }
    });
  }

  /**
   * Activa o inactiva un perfil tras confirmar.
   *
   * @param perfil perfil de la columna.
   */
  async cambiarEstadoPerfil(perfil: PerfilAcceso): Promise<void> {
    const activar = !perfil.activo;
    const confirmado = await confirmar(
      activar ? `¿Activar el perfil ${perfil.nombre}?` : `¿Inactivar el perfil ${perfil.nombre}?`,
      activar
        ? 'Sus usuarios podrán volver a ingresar.'
        : `Sus ${perfil.totalUsuarios} usuarios dejarán de poder ingresar de inmediato.`,
      activar ? 'Sí, activar' : 'Sí, inactivar'
    );
    if (!confirmado) {
      return;
    }
    this.perfilService.cambiarEstadoPerfil(perfil.perfilId, activar).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.cargar();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cambiar el estado del perfil')
    });
  }

  /**
   * Activa o inactiva una opción de menú tras confirmar.
   *
   * @param menu opción de la fila.
   */
  async cambiarEstadoMenu(menu: MenuOpcion): Promise<void> {
    const activar = !menu.activo;
    const confirmado = await confirmar(
      activar ? `¿Activar "${menu.title}"?` : `¿Inactivar "${menu.title}"?`,
      activar ? 'Volverá a mostrarse a los perfiles asignados.' : 'Dejará de mostrarse a todos los perfiles.',
      activar ? 'Sí, activar' : 'Sí, inactivar'
    );
    if (!confirmado) {
      return;
    }
    this.perfilService.cambiarEstadoMenu(menu.menuId, activar).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.cargar();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cambiar el estado de la opción')
    });
  }
}
