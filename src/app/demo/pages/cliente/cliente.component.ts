import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Cliente } from 'src/app/models/cliente';
import { ClienteService } from 'src/app/services/cliente.service';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent implements OnInit {

  // ==========================================
  // VARIABLES
  // ==========================================

  clientes: Cliente[] = [];

  clienteFormulario: Cliente = this.crearClienteVacio();

  terminoBusqueda = '';

  mostrarFormulario = false;

  guardando = false;

  cargando = false;

  error = '';

  mensaje = '';

  // Indica si estamos creando o editando
  editando = false;

  // ID del cliente que estamos editando
  clienteEditandoId?: number;


  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private readonly clienteService: ClienteService
  ) {}


  // ==========================================
  // INICIO
  // ==========================================

  ngOnInit(): void {

    this.listarClientes();
  }


  // ==========================================
  // CREAR CLIENTE VACÍO
  // ==========================================

  crearClienteVacio(): Cliente {

    return {

      usuarioId: undefined,

      tipoDocumento: '',

      numeroDocumento: '',

      nombres: '',

      apellidos: '',

      fechaNacimiento: '',

      genero: '',

      telefono: '',

      direccion: '',

      activo: true
    };
  }


  // ==========================================
  // LISTAR CLIENTES
  // ==========================================

  listarClientes(): void {

    this.cargando = true;

    this.error = '';

    this.clienteService.listar().subscribe({

      next: (respuesta: Cliente[]) => {

        this.clientes = respuesta;

        this.cargando = false;

        console.log(
          'Clientes cargados:',
          this.clientes
        );
      },

      error: (error) => {

        console.error(
          'Error al cargar clientes:',
          error
        );

        this.error =
          'No fue posible cargar los clientes.';

        this.cargando = false;
      }
    });
  }


  // ==========================================
  // FILTRAR CLIENTES
  // ==========================================

  filtrarClientes(): Cliente[] {

    const termino =
      this.terminoBusqueda
        .toLowerCase()
        .trim();

    if (!termino) {

      return this.clientes;
    }

    return this.clientes.filter(cliente => {

      const nombreCompleto =
        `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`
          .toLowerCase();

      const documento =
        cliente.numeroDocumento
          ?.toLowerCase() ?? '';

      const telefono =
        cliente.telefono
          ?.toLowerCase() ?? '';

      return (

        nombreCompleto.includes(termino) ||

        documento.includes(termino) ||

        telefono.includes(termino)
      );
    });
  }


  // ==========================================
  // NUEVO CLIENTE
  // ==========================================

  nuevoCliente(): void {

    this.clienteFormulario =
      this.crearClienteVacio();

    this.clienteEditandoId =
      undefined;

    this.editando = false;

    this.mensaje = '';

    this.error = '';

    this.mostrarFormulario = true;
  }


  // ==========================================
  // EDITAR CLIENTE
  // ==========================================

  editarCliente(cliente: Cliente): void {

    // Copiar los datos del cliente
    this.clienteFormulario = {
      ...cliente
    };

    // Guardar el ID
    this.clienteEditandoId =
      cliente.clienteId;

    // Activar modo edición
    this.editando = true;

    this.mensaje = '';

    this.error = '';

    // Mostrar formulario
    this.mostrarFormulario = true;
  }


  // ==========================================
  // CANCELAR FORMULARIO
  // ==========================================

  cancelarFormulario(): void {

    this.mostrarFormulario = false;

    this.editando = false;

    this.clienteEditandoId =
      undefined;

    this.clienteFormulario =
      this.crearClienteVacio();

    this.mensaje = '';

    this.error = '';
  }


  // ==========================================
  // GUARDAR / ACTUALIZAR
  // ==========================================

  guardarCliente(): void {

    this.error = '';

    this.mensaje = '';


    // ==========================================
    // VALIDACIONES FRONTEND
    // ==========================================

    if (!this.clienteFormulario.tipoDocumento) {

      this.error =
        'Seleccione el tipo de documento.';

      return;
    }

    if (!this.clienteFormulario.numeroDocumento) {

      this.error =
        'Ingrese el número de documento.';

      return;
    }

    if (!this.clienteFormulario.nombres) {

      this.error =
        'Ingrese los nombres.';

      return;
    }

    if (!this.clienteFormulario.apellidos) {

      this.error =
        'Ingrese los apellidos.';

      return;
    }

    if (!this.clienteFormulario.fechaNacimiento) {

      this.error =
        'Ingrese la fecha de nacimiento.';

      return;
    }


    this.guardando = true;


    // ==========================================
    // ACTUALIZAR
    // ==========================================

    if (
      this.editando &&
      this.clienteEditandoId !== undefined
    ) {

      this.clienteService
        .actualizar(
          this.clienteEditandoId,
          this.clienteFormulario
        )
        .subscribe({

          next: (clienteActualizado: Cliente) => {

            console.log(
              'Cliente actualizado:',
              clienteActualizado
            );

            this.mensaje =
              'Cliente actualizado correctamente.';

            this.guardando = false;

            this.mostrarFormulario = false;

            this.editando = false;

            this.clienteEditandoId =
              undefined;

            this.clienteFormulario =
              this.crearClienteVacio();

            this.listarClientes();
          },

          error: (error) => {

            console.error(
              'Error al actualizar cliente:',
              error
            );

            this.error =
              error?.error?.message ||
              'No fue posible actualizar el cliente.';

            this.guardando = false;
          }
        });

      return;
    }


    // ==========================================
    // CREAR
    // ==========================================

    this.clienteService
      .crear(this.clienteFormulario)
      .subscribe({

        next: (clienteCreado: Cliente) => {

          console.log(
            'Cliente creado:',
            clienteCreado
          );

          this.mensaje =
            'Cliente creado correctamente.';

          this.guardando = false;

          this.mostrarFormulario = false;

          this.clienteFormulario =
            this.crearClienteVacio();

          this.listarClientes();
        },

        error: (error) => {

          console.error(
            'Error al crear cliente:',
            error
          );

          this.error =
            error?.error?.message ||
            'No fue posible crear el cliente.';

          this.guardando = false;
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