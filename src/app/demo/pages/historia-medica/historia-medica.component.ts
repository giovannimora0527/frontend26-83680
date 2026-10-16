import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { AnotacionHistoriaRq } from 'src/app/models/anotacion-historia-rq';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { HistoriaMedicaRq } from 'src/app/models/historia-medica-rq';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { ClienteService } from 'src/app/services/cliente.service';
import { mostrarAdvertencia, mostrarError, mostrarExito } from 'src/app/utils/mensajes-utils';
import { compararValores, estaEnRangoFechas, nombreCompleto, normalizarTexto, textoEstado } from 'src/app/utils/tabla-utils';
import { AnotacionHistoriaService } from '../anotacion-historia/service/anotacion-historia.service';
import { CitaService } from '../cita/service/cita.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { HistoriaMedicaService } from './service/historia-medica.service';

@Component({
  selector: 'app-historia-medica',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './historia-medica.component.html',
  styleUrl: './historia-medica.component.scss'
})
export class HistoriaMedicaComponent {
  // Variables para los modales de formulario y de detalle.
  modalInstance: Modal | null = null;
  modalDetalleInstance: Modal | null = null;
  titleModal: string = '';
  modoFormulario: string = '';
  titleBoton: string = '';

  // Estados de una historia clínica: abierta recibe anotaciones, cerrada ya no se modifica.
  readonly estados = ['ABIERTA', 'CERRADA'];

  // Variables para la paginación, búsqueda, filtros y ordenamiento de la datatable.
  listHistorias: HistoriaMedica[] = [];
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

  // Listas para los combos dependientes: Cliente -> Mascotas del cliente -> Citas atendidas de la mascota.
  listClientes: Cliente[] = [];
  listMascotas: Mascota[] = [];
  listCitas: Cita[] = [];
  listMedicos: Medico[] = [];

  // Formulario para crear o editar historia.
  form!: FormGroup;
  historiaSelected: HistoriaMedica | null = null;

  // Variables del detalle (Ver) y del historial de anotaciones.
  historiaDetalle: HistoriaMedica | null = null;
  listAnotaciones: AnotacionHistoria[] = [];
  anotacionSelected: AnotacionHistoria | null = null;
  terminoAnotacion = '';
  anotacionesAscendente = false;
  paginaAnotacion = 1;
  readonly anotacionesPorPagina = 5;
  cargandoAnotaciones = false;
  guardandoAnotacion = false;
  mostrarFormAnotacion = false;
  formAnotacion!: FormGroup;

  // Funciones de utilidad que se usan en la plantilla.
  readonly nombreCompleto = nombreCompleto;
  readonly textoEstado = textoEstado;

  constructor(private readonly historiaService: HistoriaMedicaService,
    private readonly anotacionService: AnotacionHistoriaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly citaService: CitaService,
    private readonly medicoService: MedicoService,
    private readonly formBuilder: FormBuilder) {
    this.inicializarFormulario();
    this.inicializarFormularioAnotacion();
    this.listar();
    this.cargarCombos();
  }

  // Metodo que permite inicializar el formulario de la historia con sus controles y validaciones.
  inicializarFormulario() {
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [null, Validators.required],
      citaId: [null, Validators.required],
      medicoId: [null, Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      diagnostico: ['', [Validators.required, Validators.maxLength(2000)]],
      observaciones: ['', Validators.maxLength(2000)],
      estado: ['ABIERTA', Validators.required]
    });

    // Combos dependientes: cliente -> mascotas -> citas.
    this.form.get('clienteId')?.valueChanges.subscribe((clienteId) => {
      this.cargarMascotasCliente(clienteId);
    });
    this.form.get('mascotaId')?.valueChanges.subscribe((mascotaId) => {
      this.cargarCitasMascota(mascotaId);
    });
    // Al elegir la cita se proponen el veterinario, la fecha, la hora y el motivo de esa cita.
    this.form.get('citaId')?.valueChanges.subscribe((citaId) => {
      const cita = this.listCitas.find((item) => item.id === citaId);
      if (cita) {
        this.form.patchValue({
          medicoId: cita.medico?.id,
          fecha: String(cita.fechaHora).substring(0, 10),
          hora: String(cita.fechaHora).substring(11, 16),
          motivo: cita.motivo
        });
      }
    });
  }

  // Formulario para agregar una anotación a la historia que se está viendo.
  inicializarFormularioAnotacion() {
    this.formAnotacion = this.formBuilder.group({
      medicoId: [null, Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(2000)]],
      observacion: ['', Validators.maxLength(2000)],
      diagnostico: ['', [Validators.required, Validators.maxLength(2000)]]
    });
  }

  // Obtiene los controles del formulario para facilitar el acceso a sus propiedades y métodos.
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  // Obtiene los controles del formulario de anotación.
  get fa(): { [key: string]: AbstractControl } {
    return this.formAnotacion.controls;
  }

  /**
   * Filtra la lista de historias según la búsqueda y los filtros, y la ordena por la columna seleccionada.
   * @returns Un arreglo de historias filtradas y ordenadas.
   */
  get historiasFiltradas(): HistoriaMedica[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());

    const filtradas = this.listHistorias.filter((historia) => {
      if (this.filtroEstado && historia.estado?.toUpperCase() !== this.filtroEstado) {
        return false;
      }
      if (!estaEnRangoFechas(historia.fechaHora, this.filtroFechaDesde, this.filtroFechaHasta)) {
        return false;
      }
      if (!termino) {
        return true;
      }

      const valores = [
        historia.id,
        historia.mascota?.nombreMascota,
        nombreCompleto(historia.cliente),
        nombreCompleto(historia.medico),
        historia.motivo,
        historia.diagnostico
      ];

      return valores.some((valor) =>
        normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return filtradas.sort((a, b) =>
      compararValores(this.valorOrden(a), this.valorOrden(b), this.ordenAscendente)
    );
  }

  get historiasPaginadas(): HistoriaMedica[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.historiasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.historiasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  /**
   * Filtra y ordena por fecha las anotaciones de la historia que se está viendo.
   * Por defecto se muestran de la más reciente a la más antigua.
   * @returns Un arreglo de anotaciones filtradas y ordenadas.
   */
  get anotacionesFiltradas(): AnotacionHistoria[] {
    const termino = normalizarTexto(this.terminoAnotacion.trim());

    const filtradas = this.listAnotaciones.filter((anotacion) => {
      if (!termino) {
        return true;
      }
      const valores = [
        anotacion.descripcion,
        anotacion.observacion,
        anotacion.diagnostico,
        nombreCompleto(anotacion.medico)
      ];
      return valores.some((valor) =>
        normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return filtradas.sort((a, b) =>
      compararValores(String(a.fecha ?? ''), String(b.fecha ?? ''), this.anotacionesAscendente)
    );
  }

  get anotacionesPaginadas(): AnotacionHistoria[] {
    const inicio = (this.paginaAnotacion - 1) * this.anotacionesPorPagina;
    return this.anotacionesFiltradas.slice(inicio, inicio + this.anotacionesPorPagina);
  }

  get totalPaginasAnotacion(): number {
    return Math.ceil(this.anotacionesFiltradas.length / this.anotacionesPorPagina);
  }

  get paginasAnotacion(): number[] {
    return Array.from({ length: this.totalPaginasAnotacion }, (_, indice) => indice + 1);
  }

  /**
   * Metodo que permite listar las historias registradas en la base de datos y mostrarlas en la tabla.
   */
  listar() {
    this.cargando = true;
    this.historiaService.listar().subscribe({
      next: (data) => {
        this.listHistorias = data;
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        mostrarError(error);
      }
    });
  }

  // Carga los clientes y veterinarios de los combos.
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

  // Consulta las mascotas del cliente seleccionado.
  cargarMascotasCliente(clienteId: number | null) {
    this.listMascotas = [];
    this.listCitas = [];
    this.form.patchValue({ mascotaId: null, citaId: null }, { emitEvent: false });
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (data) => this.listMascotas = data,
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  // Consulta las citas de la mascota; solo sirven las atendidas que aún no tienen historia.
  cargarCitasMascota(mascotaId: number | null) {
    this.listCitas = [];
    this.form.get('citaId')?.setValue(null, { emitEvent: false });
    if (!mascotaId) {
      return;
    }
    this.citaService.listarPorMascota(mascotaId).subscribe({
      next: (data) => {
        this.listCitas = data.filter((cita) =>
          cita.estado?.toUpperCase() === 'ATENDIDA'
          && !this.listHistorias.some((historia) => historia.cita?.id === cita.id)
        );
      },
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

  // Una historia cerrada ya no se puede editar ni recibir anotaciones.
  esHistoriaCerrada(historia: HistoriaMedica | null): boolean {
    return historia?.estado?.toUpperCase() === 'CERRADA';
  }

  // Evento para abrir el modal de crear historia.
  nuevaHistoria(modo: string) {
    this.historiaSelected = null;
    this.resetFormulario();
    this.openModal(modo);
  }

  resetFormulario() {
    this.form.enable({ emitEvent: false });
    this.form.reset({ estado: 'ABIERTA' }, { emitEvent: false });
    this.listMascotas = [];
    this.listCitas = [];
  }

  // Consulta la historia y la carga en el formulario; solo se edita diagnóstico, observaciones y estado.
  abrirEdicion(historia: HistoriaMedica) {
    this.historiaService.consultar(historia.id).subscribe({
      next: (data) => {
        this.historiaSelected = data;
        this.resetFormulario();

        this.listMascotas = data.mascota ? [data.mascota] : [];
        this.listCitas = data.cita ? [data.cita] : [];
        this.form.patchValue({
          clienteId: data.cliente?.clienteId,
          mascotaId: data.mascota?.mascotaId,
          citaId: data.cita?.id,
          medicoId: data.medico?.id,
          fecha: String(data.fechaHora).substring(0, 10),
          hora: String(data.fechaHora).substring(11, 16),
          motivo: data.motivo,
          diagnostico: data.diagnostico,
          observaciones: data.observaciones,
          estado: data.estado?.toUpperCase()
        }, { emitEvent: false });

        // Los datos de la consulta son históricos y no se modifican.
        ['clienteId', 'mascotaId', 'citaId', 'medicoId', 'fecha', 'hora', 'motivo'].forEach((campo) => {
          this.form.get(campo)?.disable({ emitEvent: false });
        });
        if (this.esHistoriaCerrada(data)) {
          this.form.disable({ emitEvent: false });
        }
        this.openModal('E');
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  // Valida el formulario y envía la historia al backend para crearla o actualizarla.
  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      mostrarAdvertencia('Campos obligatorios', 'Por favor diligencie todos los campos marcados con *.');
      return;
    }

    const datos = this.form.getRawValue();
    const fechaHora = `${datos.fecha}T${datos.hora}:00`;

    // La fecha de la consulta no puede ser anterior a la fecha de la cita.
    const cita = this.listCitas.find((item) => item.id === datos.citaId);
    if (this.modoFormulario === 'C' && cita && fechaHora.substring(0, 16) < String(cita.fechaHora).substring(0, 16)) {
      mostrarAdvertencia('Fecha no válida', 'La fecha de la consulta no puede ser anterior a la fecha de la cita.');
      return;
    }

    const historiaRq: HistoriaMedicaRq = {
      historiaMedicaId: this.historiaSelected?.id,
      clienteId: datos.clienteId,
      mascotaId: datos.mascotaId,
      citaId: datos.citaId,
      medicoId: datos.medicoId,
      fechaHora: fechaHora,
      motivo: datos.motivo,
      diagnostico: datos.diagnostico,
      observaciones: datos.observaciones,
      estado: datos.estado
    };

    this.guardando = true;
    const peticion = this.modoFormulario === 'C'
      ? this.historiaService.guardar(historiaRq)
      : this.historiaService.actualizar(historiaRq);

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

  // Abre el detalle de la historia con el historial de anotaciones.
  verDetalle(historia: HistoriaMedica) {
    this.historiaService.consultar(historia.id).subscribe({
      next: (data) => {
        this.historiaDetalle = data;
        this.anotacionSelected = null;
        this.mostrarFormAnotacion = false;
        this.terminoAnotacion = '';
        this.anotacionesAscendente = false;
        this.listAnotaciones = [];
        this.cargarAnotaciones();
        const modalElement = document.getElementById('modalDetalleHistoria');
        if (modalElement) {
          this.modalDetalleInstance ??= new Modal(modalElement);
          this.modalDetalleInstance.show();
        }
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  // Consulta en el backend las anotaciones de la historia que se está viendo.
  cargarAnotaciones() {
    if (!this.historiaDetalle) {
      return;
    }
    this.cargandoAnotaciones = true;
    this.anotacionService.listarPorHistoria(this.historiaDetalle.id).subscribe({
      next: (data) => {
        this.listAnotaciones = data;
        this.paginaAnotacion = 1;
        this.cargandoAnotaciones = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoAnotaciones = false;
        mostrarError(error);
      }
    });
  }

  // Actualiza la búsqueda dentro de las anotaciones.
  actualizarBusquedaAnotacion(event: Event) {
    this.terminoAnotacion = (event.target as HTMLInputElement).value;
    this.paginaAnotacion = 1;
  }

  // Invierte el orden por fecha de las anotaciones.
  cambiarOrdenAnotaciones() {
    this.anotacionesAscendente = !this.anotacionesAscendente;
    this.paginaAnotacion = 1;
  }

  // Cambia la página de la tabla de anotaciones.
  cambiarPaginaAnotacion(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginasAnotacion) {
      this.paginaAnotacion = pagina;
    }
  }

  // Muestra el detalle completo de una anotación.
  verAnotacion(anotacion: AnotacionHistoria) {
    this.anotacionSelected = anotacion;
    this.mostrarFormAnotacion = false;
  }

  // Muestra el formulario para agregar una anotación; propone el veterinario de la historia.
  nuevaAnotacion() {
    this.formAnotacion.reset({ medicoId: this.historiaDetalle?.medico?.id ?? null });
    this.anotacionSelected = null;
    this.mostrarFormAnotacion = true;
  }

  cancelarAnotacion() {
    this.mostrarFormAnotacion = false;
  }

  // Valida y guarda la nueva anotación, luego recarga el historial.
  guardarAnotacion() {
    if (this.formAnotacion.invalid) {
      this.formAnotacion.markAllAsTouched();
      mostrarAdvertencia('Campos obligatorios', 'El veterinario, la descripción y el diagnóstico o evolución son obligatorios.');
      return;
    }

    const datos = this.formAnotacion.value;
    const anotacionRq: AnotacionHistoriaRq = {
      historiaMedicaId: this.historiaDetalle?.id,
      medicoId: datos.medicoId,
      descripcion: datos.descripcion,
      observacion: datos.observacion,
      diagnostico: datos.diagnostico
    };

    this.guardandoAnotacion = true;
    this.anotacionService.guardar(anotacionRq).subscribe({
      next: (respuesta) => {
        this.guardandoAnotacion = false;
        this.mostrarFormAnotacion = false;
        mostrarExito(respuesta.message);
        this.cargarAnotaciones();
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoAnotacion = false;
        mostrarError(error);
      }
    });
  }

  closeModalDetalle() {
    if (this.modalDetalleInstance) {
      this.modalDetalleInstance.hide();
    }
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Historia Médica' : 'Editar Historia Médica';
    this.titleBoton = modo === 'C' ? 'Guardar Historia Médica' : 'Actualizar Historia Médica';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearHistoriaMedica');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  // Devuelve el valor de la columna por la que se está ordenando.
  private valorOrden(historia: HistoriaMedica): string | number | undefined {
    switch (this.campoOrden) {
      case 'mascota':
        return historia.mascota?.nombreMascota;
      case 'cliente':
        return nombreCompleto(historia.cliente);
      case 'medico':
        return nombreCompleto(historia.medico);
      case 'motivo':
        return historia.motivo;
      case 'estado':
        return historia.estado;
      default:
        return String(historia.fechaHora ?? '');
    }
  }
}
