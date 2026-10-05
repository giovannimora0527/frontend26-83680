import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Usuario } from 'src/app/models/usuario';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent implements OnInit {

  // ==========================================
  // VARIABLES
  // ==========================================

  usuarios: Usuario[] = [];

  usuarioFormulario: Usuario =
    this.crearUsuarioVacio();

  terminoBusqueda = '';

  mostrarFormulario = false;

  guardando = false;

  cargando = false;

  error = '';

  mensaje = '';

  editando = false;

  usuarioEditandoId?: number;


  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private readonly usuarioService: UsuarioService
  ) {}


  // ==========================================
  // INICIO
  // ==========================================

  ngOnInit(): void {

    this.listarUsuarios();
  }


  // ==========================================
  // USUARIO VACÍO
  // ==========================================

  crearUsuarioVacio(): Usuario {

    return {

      username: '',

      passwordHash: '',

      rol: '',

      email: '',

      activo: true
    };
  }


  // ==========================================
  // LISTAR
  // ==========================================

  listarUsuarios(): void {

    this.cargando = true;

    this.error = '';

    this.usuarioService.listar().subscribe({

      next: (respuesta: Usuario[]) => {

        this.usuarios = respuesta;

        this.cargando = false;

        console.log(
          'Usuarios cargados:',
          this.usuarios
        );
      },

      error: (error) => {

        console.error(
          'Error al cargar usuarios:',
          error
        );

        this.error =
          'No fue posible cargar los usuarios.';

        this.cargando = false;
      }
    });
  }


  // ==========================================
  // BUSCAR
  // ==========================================

  filtrarUsuarios(): Usuario[] {

    const termino =
      this.terminoBusqueda
        .toLowerCase()
        .trim();

    if (!termino) {

      return this.usuarios;
    }

    return this.usuarios.filter(usuario => {

      const username =
        usuario.username
          ?.toLowerCase() ?? '';

      const email =
        usuario.email
          ?.toLowerCase() ?? '';

      const rol =
        usuario.rol
          ?.toLowerCase() ?? '';

      return (
        username.includes(termino) ||
        email.includes(termino) ||
        rol.includes(termino)
      );
    });
  }


  // ==========================================
  // NUEVO USUARIO
  // ==========================================

  nuevoUsuario(): void {

    this.usuarioFormulario =
      this.crearUsuarioVacio();

    this.usuarioEditandoId =
      undefined;

    this.editando = false;

    this.mensaje = '';

    this.error = '';

    this.mostrarFormulario = true;
  }


  // ==========================================
  // EDITAR USUARIO
  // ==========================================

  editarUsuario(usuario: Usuario): void {

    this.usuarioFormulario = {
      ...usuario,

      // No mostramos la contraseña/hash actual
      passwordHash: ''
    };

    this.usuarioEditandoId =
      usuario.id;

    this.editando = true;

    this.mensaje = '';

    this.error = '';

    this.mostrarFormulario = true;
  }


  // ==========================================
  // CANCELAR
  // ==========================================

  cancelarFormulario(): void {

    this.mostrarFormulario = false;

    this.editando = false;

    this.usuarioEditandoId =
      undefined;

    this.usuarioFormulario =
      this.crearUsuarioVacio();

    this.mensaje = '';

    this.error = '';
  }


  // ==========================================
  // GUARDAR / ACTUALIZAR
  // ==========================================

  guardarUsuario(): void {

    this.error = '';

    this.mensaje = '';


    // ==========================================
    // VALIDACIONES
    // ==========================================

    if (!this.usuarioFormulario.username) {

      this.error =
        'Ingrese el nombre de usuario.';

      return;
    }

    if (!this.usuarioFormulario.rol) {

      this.error =
        'Seleccione el rol.';

      return;
    }

    if (!this.usuarioFormulario.email) {

      this.error =
        'Ingrese el correo electrónico.';

      return;
    }


    this.guardando = true;


    // ==========================================
    // ACTUALIZAR
    // ==========================================

    if (
      this.editando &&
      this.usuarioEditandoId !== undefined
    ) {

      this.usuarioService
        .actualizar(
          this.usuarioEditandoId,
          this.usuarioFormulario
        )
        .subscribe({

          next: (usuarioActualizado: Usuario) => {

            console.log(
              'Usuario actualizado:',
              usuarioActualizado
            );

            this.mensaje =
              'Usuario actualizado correctamente.';

            this.guardando = false;

            this.mostrarFormulario = false;

            this.editando = false;

            this.usuarioEditandoId =
              undefined;

            this.usuarioFormulario =
              this.crearUsuarioVacio();

            this.listarUsuarios();
          },

          error: (error) => {

            console.error(
              'Error al actualizar usuario:',
              error
            );

            this.error =
              error?.error?.message ||
              'No fue posible actualizar el usuario.';

            this.guardando = false;
          }
        });

      return;
    }


    // ==========================================
    // CREAR
    // ==========================================

    if (!this.usuarioFormulario.passwordHash) {

      this.error =
        'Ingrese el password hash del usuario.';

      this.guardando = false;

      return;
    }

    this.usuarioService
      .crear(this.usuarioFormulario)
      .subscribe({

        next: (usuarioCreado: Usuario) => {

          console.log(
            'Usuario creado:',
            usuarioCreado
          );

          this.mensaje =
            'Usuario creado correctamente.';

          this.guardando = false;

          this.mostrarFormulario = false;

          this.usuarioFormulario =
            this.crearUsuarioVacio();

          this.listarUsuarios();
        },

        error: (error) => {

          console.error(
            'Error al crear usuario:',
            error
          );

          this.error =
            error?.error?.message ||
            'No fue posible crear el usuario.';

          this.guardando = false;
        }
      });
  }


  // ==========================================
  // CAMBIAR ESTADO
  // ==========================================

  cambiarEstado(usuario: Usuario): void {

    if (usuario.id === undefined) {

      return;
    }

    const nuevoEstado =
      !usuario.activo;

    this.usuarioService
      .cambiarEstado(
        usuario.id,
        nuevoEstado
      )
      .subscribe({

        next: () => {

          this.mensaje =
            nuevoEstado
              ? 'Usuario activado correctamente.'
              : 'Usuario desactivado correctamente.';

          this.listarUsuarios();
        },

        error: (error) => {

          console.error(
            'Error al cambiar estado:',
            error
          );

          this.error =
            error?.error?.message ||
            'No fue posible cambiar el estado.';
        }
      });
  }


  // ==========================================
  // LIMPIAR BÚSQUEDA
  // ==========================================

  limpiarBusqueda(): void {

    this.terminoBusqueda = '';
  }
}