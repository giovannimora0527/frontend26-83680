import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { UsuarioService } from './service/usuario.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { ROLES_USUARIO, Usuario, UsuarioRq } from 'src/app/models/usuario';
import { TablaLocal } from 'src/app/utils/tabla-local';
import { ModalBootstrap } from 'src/app/utils/modal';
import { normalizarTexto } from 'src/app/utils/texto';
import { avisar, confirmar, mostrarError, notificarExito } from 'src/app/utils/mensajes';
import { camposIguales, contrasenaSegura } from 'src/app/utils/validadores';

/**
 * Pantalla de gestión de usuarios del sistema: listado con búsqueda, filtros
 * por rol y estado, orden y paginación; registro, edición (con cambio de
 * contraseña opcional), detalle y activación / inactivación. Los usuarios no
 * se eliminan para conservar la trazabilidad de lo que registraron.
 */
@Component({
  selector: 'app-usuario',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './usuario.component.html'
})
export class UsuarioComponent implements OnInit, OnDestroy {
  /** Roles para el filtro y el formulario. */
  readonly roles = ROLES_USUARIO;

  /** Tabla de usuarios resuelta en el navegador (orden inicial por usuario). */
  readonly tabla = new TablaLocal<Usuario>(
    {
      username: (u) => u.username,
      email: (u) => u.email,
      rol: (u) => this.nombreRol(u.rol),
      estado: (u) => (u.activo ? 'Activo' : 'Inactivo'),
      creacion: (u) => u.fechaCreacion
    },
    (u) => `${u.username} ${u.email} ${this.nombreRol(u.rol)}`,
    'username'
  );
  /** Rol seleccionado en el filtro (vacío = todos). */
  filtroRol = '';
  /** Estado seleccionado en el filtro: '', 'activo' o 'inactivo'. */
  filtroEstado = '';
  /** Indica que se está consultando el listado. */
  cargando = false;
  /** Indica que la última consulta falló. */
  error = false;

  /** Formulario reactivo del usuario. */
  form!: FormGroup;
  /** Usuario en edición (null al crear). */
  usuarioEditando: Usuario | null = null;
  /** Indica que se está enviando el formulario. */
  guardando = false;
  /** Muestra la contraseña en texto plano mientras se escribe. */
  verContrasena = false;

  /** Usuario mostrado en el detalle. */
  usuarioDetalle: Usuario | null = null;
  /** Indica que se está consultando el detalle. */
  cargandoDetalle = false;

  /** Lista completa, para validar duplicados antes de enviar. */
  private usuarios: Usuario[] = [];
  /** Modal del formulario. */
  private readonly modalFormulario = new ModalBootstrap('modalUsuario');
  /** Modal del detalle. */
  private readonly modalDetalle = new ModalBootstrap('modalDetalleUsuario');

  /**
   * @param usuarioService servicio de usuarios.
   * @param formBuilder constructor de formularios reactivos.
   */
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly formBuilder: FormBuilder
  ) { }

  /** Crea el formulario y consulta el listado. */
  ngOnInit(): void {
    this.form = this.formBuilder.group(
      {
        username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9._-]{4,30}$/)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
        rol: ['', Validators.required],
        password: [''],
        confirmar: ['']
      },
      { validators: camposIguales('password', 'confirmar') }
    );
    this.listar();
  }

  /** Libera los modales. */
  ngOnDestroy(): void {
    this.modalFormulario.destruir();
    this.modalDetalle.destruir();
  }

  /** Acceso corto a los controles del formulario. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Indica si hay búsqueda o filtro activo. */
  get hayFiltros(): boolean {
    return this.tabla.hayBusqueda || !!this.filtroRol || !!this.filtroEstado;
  }

  /** Indica que otro usuario ya tiene ese nombre de usuario. */
  get usernameDuplicado(): boolean {
    return this.existe((u) => u.username, this.f['username'].value);
  }

  /** Indica que otro usuario ya tiene ese correo. */
  get emailDuplicado(): boolean {
    return this.existe((u) => u.email, this.f['email'].value);
  }

  /** Indica si hay que mostrar el aviso de contraseñas distintas. */
  get contrasenasDistintas(): boolean {
    return !!this.form.errors?.['noCoincide'] && (this.f['confirmar'].touched || this.f['confirmar'].dirty);
  }

  // ===================== Listado =====================

  /** Consulta la lista completa de usuarios. */
  listar(): void {
    this.cargando = true;
    this.error = false;
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.tabla.cargar(data);
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.error = true;
        this.tabla.cargar([]);
        mostrarError(error, 'No se pudieron cargar los usuarios');
      }
    });
  }

  /** Aplica los filtros de rol y estado. */
  aplicarFiltros(): void {
    const rol = this.filtroRol;
    const estado = this.filtroEstado;
    this.tabla.filtrar((u) => (!rol || u.rol === rol) && (!estado || (estado === 'activo') === u.activo));
  }

  /** Quita búsqueda, filtros y orden personalizados. */
  limpiarFiltros(): void {
    this.filtroRol = '';
    this.filtroEstado = '';
    this.tabla.filtrar(() => true);
    this.tabla.reiniciar();
  }

  // ===================== Formulario =====================

  /** Abre el formulario vacío; la contraseña es obligatoria al crear. */
  abrirNuevo(): void {
    this.usuarioEditando = null;
    this.configurarContrasena(true);
    this.form.reset({ username: '', email: '', rol: '', password: '', confirmar: '' });
    this.verContrasena = false;
    this.modalFormulario.abrir();
  }

  /**
   * Abre el formulario con los datos de un usuario; la contraseña queda vacía
   * y solo se cambia si se escribe una nueva. Un usuario inactivo no se edita.
   *
   * @param usuario usuario a editar.
   */
  abrirEdicion(usuario: Usuario): void {
    if (!usuario.activo) {
      avisar('El usuario está inactivo', 'Actívelo primero si necesita actualizar sus datos.');
      return;
    }
    this.usuarioEditando = usuario;
    this.configurarContrasena(false);
    this.form.reset({ username: usuario.username, email: usuario.email, rol: usuario.rol, password: '', confirmar: '' });
    this.verContrasena = false;
    this.modalFormulario.abrir();
  }

  /**
   * Ajusta las validaciones de la contraseña según el modo del formulario.
   *
   * @param obligatoria true al crear; false al editar (cambio opcional).
   */
  private configurarContrasena(obligatoria: boolean): void {
    const password = this.f['password'];
    password.setValidators(obligatoria ? [Validators.required, contrasenaSegura] : [contrasenaSegura]);
    password.updateValueAndValidity({ emitEvent: false });
  }

  /** Cierra el formulario sin guardar. */
  cerrarFormulario(): void {
    this.modalFormulario.cerrar();
  }

  /** Envía el formulario: crea el usuario o actualiza el que se está editando. */
  guardar(): void {
    if (this.guardando) {
      return;
    }
    if (this.form.invalid || this.usernameDuplicado || this.emailDuplicado) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const usuarioRq: UsuarioRq = {
      username: String(v.username).trim(),
      email: String(v.email).trim().toLowerCase(),
      rol: v.rol
    };
    if (v.password) {
      usuarioRq.password = v.password;
    }

    this.guardando = true;
    const peticion = this.usuarioEditando
      ? this.usuarioService.actualizar(this.usuarioEditando.id, usuarioRq)
      : this.usuarioService.guardar(usuarioRq);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando = false;
        notificarExito(respuesta.message);
        this.modalFormulario.cerrar();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error, 'No se pudo guardar el usuario');
      }
    });
  }

  /**
   * Indica si un campo debe mostrarse como inválido.
   *
   * @param campo nombre del control.
   * @returns true si es inválido y el usuario ya interactuó con él.
   */
  invalido(campo: string): boolean {
    const control = this.f[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  // ===================== Detalle y estado =====================

  /**
   * Abre el detalle del usuario.
   *
   * @param usuario fila seleccionada.
   */
  verDetalle(usuario: Usuario): void {
    this.usuarioDetalle = null;
    this.cargandoDetalle = true;
    this.modalDetalle.abrir();
    this.usuarioService.consultar(usuario.id).subscribe({
      next: (data) => {
        this.usuarioDetalle = data;
        this.cargandoDetalle = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoDetalle = false;
        this.modalDetalle.cerrar();
        mostrarError(error, 'No se pudo consultar el usuario');
      }
    });
  }

  /**
   * Activa o inactiva un usuario tras confirmar con el usuario.
   *
   * @param usuario usuario de la fila.
   */
  async cambiarEstado(usuario: Usuario): Promise<void> {
    const activar = !usuario.activo;
    const confirmado = await confirmar(
      activar ? `¿Activar a ${usuario.username}?` : `¿Inactivar a ${usuario.username}?`,
      activar ? 'Podrá volver a iniciar sesión.' : 'No podrá iniciar sesión. Lo que registró en el sistema se conserva.',
      activar ? 'Sí, activar' : 'Sí, inactivar'
    );
    if (!confirmado) {
      return;
    }
    this.usuarioService.cambiarEstado(usuario.id, activar).subscribe({
      next: (respuesta) => {
        notificarExito(respuesta.message);
        this.listar();
      },
      error: (error: HttpErrorResponse) => mostrarError(error, 'No se pudo cambiar el estado del usuario')
    });
  }

  /**
   * Nombre legible de un rol.
   *
   * @param codigo código del rol.
   * @returns nombre del rol, o el código si no se reconoce.
   */
  nombreRol(codigo: string): string {
    return this.roles.find((r) => r.codigo === codigo)?.nombre ?? codigo;
  }

  /**
   * Indica si otro usuario (distinto del que se edita) ya usa un valor.
   *
   * @param campo valor a comparar de cada usuario.
   * @param valor valor escrito en el formulario.
   * @returns true si está repetido.
   */
  private existe(campo: (u: Usuario) => string, valor: string): boolean {
    const buscado = normalizarTexto(valor);
    return !!buscado && this.usuarios.some((u) => u.id !== this.usuarioEditando?.id && normalizarTexto(campo(u)) === buscado);
  }
}
