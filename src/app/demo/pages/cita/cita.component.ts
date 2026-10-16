import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { Cita } from 'src/app/models/cita';
import { CitaRq } from 'src/app/models/cita-rq';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { ClienteService } from 'src/app/services/cliente.service';
import { confirmarAccion, mostrarAdvertencia, mostrarError, mostrarExito } from 'src/app/utils/mensajes-utils';
import { compararValores, estaEnRangoFechas, fechaHoy, nombreCompleto, normalizarTexto, textoEstado } from 'src/app/utils/tabla-utils';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { CitaService } from './service/cita.service';

@Component({
  selector: 'app-cita',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent {
  // Variables para el modal.
  modalInstance: Modal | null = null;
  titleModal: string = '';
  modoFormulario: string = '';
  titleBoton: string = '';

  // Estados que maneja una cita. Una cita nueva solo puede iniciar en los tres primeros.
  readonly estados = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA'];
  readonly estadosIniciales = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA'];

  // Variables para la paginación, búsqueda, filtros y ordenamiento de la datatable.
  listCitas: Cita[] = [];
  terminoBusqueda = '';
  filtroEstado = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  campoOrden = 'fechaHora';
  ordenAscendente = false;
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  cargando = false;
  guardando = false;

  // Listas para los combos dependientes del formulario: Cliente -> Mascotas del cliente.
  listClientes: Cliente[] = [];
  listMascotas: Mascota[] = [];
  listMedicos: Medico[] = [];

  // Formulario para crear o editar cita.
  form!: FormGroup;
  citaSelected: Cita | null = null;
  readonly fechaMinima = fechaHoy();

  // Funciones de utilidad que se usan en la plantilla.
  readonly nombreCompleto = nombreCompleto;
  readonly textoEstado = textoEstado;

  constructor(private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoService,
    private readonly formBuilder: FormBuilder) {
    this.inicializarFormulario();
    this.listar();
    this.cargarCombos();
  }

  // Metodo que permite inicializar el formulario con sus controles y validaciones.
  inicializarFormulario() {
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [null, Validators.required],
      medicoId: [null, Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      estado: ['PENDIENTE', Validators.required]
    });

    // Cuando cambia el cliente se consultan únicamente sus mascotas.
    this.form.get('clienteId')?.valueChanges.subscribe((clienteId) => {
      this.cargarMascotasCliente(clienteId);
    });
  }

  // Obtiene los controles del formulario para facilitar el acceso a sus propiedades y métodos.
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Filtra la lista de citas según la búsqueda y los filtros, y la ordena por la columna seleccionada.
   * @returns Un arreglo de citas filtradas y ordenadas.
   */
  get citasFiltradas(): Cita[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());

    const filtradas = this.listCitas.filter((cita) => {
      if (this.filtroEstado && cita.estado?.toUpperCase() !== this.filtroEstado) {
        return false;
      }
      if (!estaEnRangoFechas(cita.fechaHora, this.filtroFechaDesde, this.filtroFechaHasta)) {
        return false;
      }
      if (!termino) {
        return true;
      }

      const valores = [
        cita.motivo,
        cita.estado,
        nombreCompleto(cita.cliente),
        cita.mascota?.nombreMascota,
        nombreCompleto(cita.medico)
      ];

      return valores.some((valor) =>
        normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return filtradas.sort((a, b) =>
      compararValores(this.valorOrden(a), this.valorOrden(b), this.ordenAscendente)
    );
  }

  get citasPaginadas(): Cita[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.citasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.citasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  /**
   * Metodo que permite listar las citas registradas en la base de datos y mostrarlas en la tabla.
   */
  listar() {
    this.cargando = true;
    this.citaService.listar().subscribe({
      next: (data) => {
        this.listCitas = data;
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        mostrarError(error);
      }
    });
  }

  // Carga los clientes y veterinarios que se muestran en los combos del formulario.
  cargarCombos() {
    this.clienteService.listar().subscribe({
      next: (data) => this.listClientes = data,
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
    this.medicoService.listar().subscribe({
      next: (data) => this.listMedicos = data,
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  // Consulta las mascotas del cliente seleccionado y limpia la mascota elegida antes.
  cargarMascotasCliente(clienteId: number | null) {
    this.listMascotas = [];
    this.form.get('mascotaId')?.setValue(null, { emitEvent: false });
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (data) => this.listMascotas = data,
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  // Metodo que actualiza el termino de busqueda y reinicia la pagina actual a 1.
  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  // Reinicia la paginación cuando cambia algún filtro.
  aplicarFiltros() {
    this.paginaActual = 1;
  }

  // Quita todos los filtros de la tabla.
  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.paginaActual = 1;
  }

  // Cambia la columna de ordenamiento o invierte el orden si es la misma columna.
  ordenarPor(campo: string) {
    if (this.campoOrden === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.campoOrden = campo;
      this.ordenAscendente = true;
    }
    this.paginaActual = 1;
  }

  // Devuelve el icono que indica el orden de la columna.
  iconoOrden(campo: string): string {
    if (this.campoOrden !== campo) {
      return 'fa-sort';
    }
    return this.ordenAscendente ? 'fa-sort-up' : 'fa-sort-down';
  }

  // Cambia paginacion.
  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // Devuelve la clase de color del badge según el estado de la cita.
  claseEstado(estado?: string): string {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE':
        return 'bg-warning text-dark';
      case 'PROGRAMADA':
        return 'bg-info text-dark';
      case 'CONFIRMADA':
        return 'bg-primary';
      case 'ATENDIDA':
        return 'bg-success';
      case 'CANCELADA':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  // Una cita atendida o cancelada ya no se puede editar desde el formulario.
  esCitaBloqueada(cita: Cita | null): boolean {
    const estado = cita?.estado?.toUpperCase();
    return estado === 'ATENDIDA' || estado === 'CANCELADA';
  }

  // Evento para abrir el modal de crear cita.
  nuevaCita(modo: string) {
    this.citaSelected = null;
    this.resetFormulario();
    this.openModal(modo);
  }

  resetFormulario() {
    this.form.enable({ emitEvent: false });
    this.form.reset({ estado: 'PENDIENTE' }, { emitEvent: false });
    this.listMascotas = [];
  }

  // Consulta la cita en el backend y carga sus datos en el formulario.
  abrirEdicion(cita: Cita) {
    this.citaService.consultar(cita.id).subscribe({
      next: (data) => {
        this.citaSelected = data;
        this.resetFormulario();

        // En la edición el cliente y la mascota no cambian, por eso solo se muestra la mascota de la cita.
        this.listMascotas = data.mascota ? [data.mascota] : [];
        this.form.patchValue({
          clienteId: data.cliente?.clienteId,
          mascotaId: data.mascota?.mascotaId,
          medicoId: data.medico?.id,
          fecha: String(data.fechaHora).substring(0, 10),
          hora: String(data.fechaHora).substring(11, 16),
          motivo: data.motivo,
          estado: data.estado?.toUpperCase()
        }, { emitEvent: false });
        this.form.get('clienteId')?.disable({ emitEvent: false });
        this.form.get('mascotaId')?.disable({ emitEvent: false });

        if (this.esCitaBloqueada(data)) {
          this.form.disable({ emitEvent: false });
        }
        this.openModal('E');
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  // Valida el formulario y envía la cita al backend para crearla o actualizarla.
  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      mostrarAdvertencia('Campos obligatorios', 'Por favor diligencie todos los campos marcados con *.');
      return;
    }

    const datos = this.form.getRawValue();
    const fechaHora = `${datos.fecha}T${datos.hora}:00`;
    if (this.modoFormulario === 'C' && new Date(fechaHora) < new Date()) {
      mostrarAdvertencia('Fecha no válida', 'No se pueden registrar citas en fechas anteriores a la fecha actual.');
      return;
    }

    const citaRq: CitaRq = {
      citaId: this.citaSelected?.id,
      clienteId: datos.clienteId,
      mascotaId: datos.mascotaId,
      medicoId: datos.medicoId,
      fechaHora: fechaHora,
      estado: datos.estado,
      motivo: datos.motivo
    };

    this.guardando = true;
    const peticion = this.modoFormulario === 'C'
      ? this.citaService.guardar(citaRq)
      : this.citaService.actualizar(citaRq);

    peticion.subscribe({
      next: (respuesta: MiRespuesta) => {
        this.guardando = false;
        mostrarExito(respuesta.message);
        this.closeModal();
        this.listar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error);
      }
    });
  }

  // Reactiva una cita cancelada, es una operación explícita que pide confirmación.
  reactivarCita(cita: Cita) {
    confirmarAccion('Reactivar cita',
      `¿Desea reactivar la cita de ${cita.mascota?.nombreMascota}? Quedará en estado Pendiente.`)
      .then((confirmado) => {
        if (!confirmado) {
          return;
        }
        this.citaService.reactivar(cita.id).subscribe({
          next: (respuesta) => {
            mostrarExito(respuesta.message);
            this.listar();
          },
          error: (error: HttpErrorResponse) => mostrarError(error)
        });
      });
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Cita' : 'Editar Cita';
    this.titleBoton = modo === 'C' ? 'Guardar Cita' : 'Actualizar Cita';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearCita');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  // Devuelve el valor de la columna por la que se está ordenando.
  private valorOrden(cita: Cita): string | number | undefined {
    switch (this.campoOrden) {
      case 'hora':
        return String(cita.fechaHora ?? '').substring(11, 16);
      case 'cliente':
        return nombreCompleto(cita.cliente);
      case 'mascota':
        return cita.mascota?.nombreMascota;
      case 'medico':
        return nombreCompleto(cita.medico);
      case 'estado':
        return cita.estado;
      default:
        return String(cita.fechaHora ?? '');
    }
  }
}
