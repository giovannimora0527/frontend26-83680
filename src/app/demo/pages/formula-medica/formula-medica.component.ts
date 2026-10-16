import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { FormulaMedicaRq } from 'src/app/models/formula-medica-rq';
import { Mascota } from 'src/app/models/mascota';
import { Medicamento } from 'src/app/models/medicamento';
import { Medico } from 'src/app/models/medico';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { ClienteService } from 'src/app/services/cliente.service';
import { confirmarAccion, mostrarAdvertencia, mostrarError, mostrarExito } from 'src/app/utils/mensajes-utils';
import { compararValores, estaEnRangoFechas, fechaHoy, nombreCompleto, normalizarTexto, textoEstado } from 'src/app/utils/tabla-utils';
import { CitaService } from '../cita/service/cita.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicamentoService } from '../medicamento/service/medicamento.service';
import { MedicoService } from '../medico/service/medico.service';
import { FormulaMedicaService } from './service/formula-medica.service';

@Component({
  selector: 'app-formula-medica',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './formula-medica.component.html',
  styleUrl: './formula-medica.component.scss'
})
export class FormulaMedicaComponent {
  // Variables para los modales de formulario y de detalle.
  modalInstance: Modal | null = null;
  modalDetalleInstance: Modal | null = null;
  titleModal: string = '';
  modoFormulario: string = '';
  titleBoton: string = '';

  // Variables para la paginación, búsqueda, filtros y ordenamiento de la datatable.
  listFormulas: FormulaMedica[] = [];
  terminoBusqueda = '';
  filtroEstado = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  campoOrden = 'fechaCreacionRegistro';
  ordenAscendente = false;
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  cargando = false;
  guardando = false;

  // Listas para los combos dependientes: Cliente -> Mascotas del cliente -> Citas de la mascota.
  listClientes: Cliente[] = [];
  listMascotas: Mascota[] = [];
  listCitas: Cita[] = [];
  listMedicos: Medico[] = [];
  listMedicamentos: Medicamento[] = [];

  // Formulario y registros seleccionados.
  form!: FormGroup;
  formulaSelected: FormulaMedica | null = null;
  formulaDetalle: FormulaMedica | null = null;

  // Funciones de utilidad que se usan en la plantilla.
  readonly nombreCompleto = nombreCompleto;
  readonly textoEstado = textoEstado;

  constructor(private readonly formulaService: FormulaMedicaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly citaService: CitaService,
    private readonly medicoService: MedicoService,
    private readonly medicamentoService: MedicamentoService,
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
      citaId: [null, Validators.required],
      medicoId: [null, Validators.required],
      medicamentoId: [null, Validators.required],
      fechaEmision: ['', Validators.required],
      dosis: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\d/)]],
      frecuencia: ['', [Validators.required, Validators.maxLength(100)]],
      duracionDias: [null, [Validators.required, Validators.min(1), Validators.max(365)]],
      indicaciones: ['', [Validators.required, Validators.maxLength(1000)]]
    });

    // Combos dependientes: al cambiar el cliente se cargan sus mascotas y al cambiar la mascota sus citas.
    this.form.get('clienteId')?.valueChanges.subscribe((clienteId) => {
      this.cargarMascotasCliente(clienteId);
    });
    this.form.get('mascotaId')?.valueChanges.subscribe((mascotaId) => {
      this.cargarCitasMascota(mascotaId);
    });
    // Al elegir la consulta se propone el veterinario que la atendió.
    this.form.get('citaId')?.valueChanges.subscribe((citaId) => {
      const cita = this.listCitas.find((item) => item.id === citaId);
      if (cita?.medico) {
        this.form.get('medicoId')?.setValue(cita.medico.id);
      }
    });
  }

  // Obtiene los controles del formulario para facilitar el acceso a sus propiedades y métodos.
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Filtra la lista de fórmulas según la búsqueda y los filtros, y la ordena por la columna seleccionada.
   * @returns Un arreglo de fórmulas filtradas y ordenadas.
   */
  get formulasFiltradas(): FormulaMedica[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());

    const filtradas = this.listFormulas.filter((formula) => {
      if (this.filtroEstado === 'ACTIVA' && !formula.activo) {
        return false;
      }
      if (this.filtroEstado === 'INACTIVA' && formula.activo) {
        return false;
      }
      if (!estaEnRangoFechas(formula.fechaEmision, this.filtroFechaDesde, this.filtroFechaHasta)) {
        return false;
      }
      if (!termino) {
        return true;
      }

      const valores = [
        formula.id,
        formula.mascota?.nombreMascota,
        nombreCompleto(formula.mascota?.cliente),
        formula.medicamento?.nombre,
        nombreCompleto(formula.medico),
        formula.dosis
      ];

      return valores.some((valor) =>
        normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return filtradas.sort((a, b) =>
      compararValores(this.valorOrden(a), this.valorOrden(b), this.ordenAscendente)
    );
  }

  get formulasPaginadas(): FormulaMedica[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.formulasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.formulasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  /**
   * Metodo que permite listar las fórmulas registradas en la base de datos y mostrarlas en la tabla.
   */
  listar() {
    this.cargando = true;
    this.formulaService.listar().subscribe({
      next: (data) => {
        this.listFormulas = data;
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        mostrarError(error);
      }
    });
  }

  // Carga los clientes, veterinarios y medicamentos de los combos.
  cargarCombos() {
    this.clienteService.listar().subscribe({
      next: (data) => this.listClientes = data,
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
    this.medicoService.listar().subscribe({
      next: (data) => this.listMedicos = data,
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
    this.medicamentoService.listar().subscribe({
      next: (data) => this.listMedicamentos = data,
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

  // Consulta las citas de la mascota; no se muestran las canceladas porque no pueden tener fórmula.
  cargarCitasMascota(mascotaId: number | null) {
    this.listCitas = [];
    this.form.get('citaId')?.setValue(null, { emitEvent: false });
    if (!mascotaId) {
      return;
    }
    this.citaService.listarPorMascota(mascotaId).subscribe({
      next: (data) => {
        this.listCitas = data.filter((cita) => cita.estado?.toUpperCase() !== 'CANCELADA');
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

  // Evento para abrir el modal de crear fórmula.
  nuevaFormula(modo: string) {
    this.formulaSelected = null;
    this.resetFormulario();
    this.form.patchValue({ fechaEmision: fechaHoy() });
    this.openModal(modo);
  }

  resetFormulario() {
    this.form.enable({ emitEvent: false });
    this.form.reset({}, { emitEvent: false });
    this.listMascotas = [];
    this.listCitas = [];
  }

  // Consulta la fórmula y carga en el formulario los datos que se pueden editar.
  abrirEdicion(formula: FormulaMedica) {
    this.formulaService.consultar(formula.id).subscribe({
      next: (data) => {
        this.formulaSelected = data;
        this.resetFormulario();

        // La mascota y la consulta de una fórmula no se cambian, solo se muestran.
        this.listMascotas = data.mascota ? [data.mascota] : [];
        this.listCitas = data.cita ? [data.cita] : [];
        this.form.patchValue({
          clienteId: data.mascota?.cliente?.clienteId,
          mascotaId: data.mascota?.mascotaId,
          citaId: data.cita?.id,
          medicoId: data.medico?.id,
          medicamentoId: data.medicamento?.id,
          fechaEmision: data.fechaEmision,
          dosis: data.dosis,
          frecuencia: data.frecuencia,
          duracionDias: data.duracionDias,
          indicaciones: data.indicaciones
        }, { emitEvent: false });
        this.form.get('clienteId')?.disable({ emitEvent: false });
        this.form.get('mascotaId')?.disable({ emitEvent: false });
        this.form.get('citaId')?.disable({ emitEvent: false });

        if (!data.activo) {
          this.form.disable({ emitEvent: false });
        }
        this.openModal('E');
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  // Consulta el detalle completo de la fórmula y lo muestra en el modal de detalle.
  verDetalle(formula: FormulaMedica) {
    this.formulaService.consultar(formula.id).subscribe({
      next: (data) => {
        this.formulaDetalle = data;
        const modalElement = document.getElementById('modalDetalleFormula');
        if (modalElement) {
          this.modalDetalleInstance ??= new Modal(modalElement);
          this.modalDetalleInstance.show();
        }
      },
      error: (error: HttpErrorResponse) => mostrarError(error)
    });
  }

  closeModalDetalle() {
    if (this.modalDetalleInstance) {
      this.modalDetalleInstance.hide();
    }
  }

  // Valida el formulario y envía la fórmula al backend para crearla o actualizarla.
  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      mostrarAdvertencia('Campos obligatorios', 'Por favor revise los campos marcados en rojo.');
      return;
    }

    const datos = this.form.getRawValue();

    // La fecha de emisión no puede ser anterior a la fecha de la consulta.
    const cita = this.listCitas.find((item) => item.id === datos.citaId);
    const fechaConsulta = String(cita?.fechaHora ?? '').substring(0, 10);
    if (fechaConsulta && datos.fechaEmision < fechaConsulta) {
      mostrarAdvertencia('Fecha no válida', `La fecha de emisión no puede ser anterior a la fecha de la consulta (${fechaConsulta}).`);
      return;
    }

    const formulaRq: FormulaMedicaRq = {
      formulaId: this.formulaSelected?.id,
      mascotaId: datos.mascotaId,
      citaId: datos.citaId,
      medicoId: datos.medicoId,
      medicamentoId: datos.medicamentoId,
      fechaEmision: datos.fechaEmision,
      dosis: datos.dosis,
      frecuencia: datos.frecuencia,
      duracionDias: datos.duracionDias,
      indicaciones: datos.indicaciones
    };

    this.guardando = true;
    const peticion = this.modoFormulario === 'C'
      ? this.formulaService.guardar(formulaRq)
      : this.formulaService.actualizar(formulaRq);

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

  // Las fórmulas no se eliminan: se inactivan para conservar la información clínica.
  inactivarFormula(formula: FormulaMedica) {
    confirmarAccion('Inactivar fórmula',
      `¿Desea inactivar la fórmula #${formula.id}? Ya no se podrá modificar.`)
      .then((confirmado) => {
        if (!confirmado) {
          return;
        }
        this.formulaService.inactivar(formula.id).subscribe({
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
    this.titleModal = modo === 'C' ? 'Crear Fórmula Médica' : 'Editar Fórmula Médica';
    this.titleBoton = modo === 'C' ? 'Guardar Fórmula Médica' : 'Actualizar Fórmula Médica';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearFormulaMedica');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  // Devuelve el valor de la columna por la que se está ordenando.
  private valorOrden(formula: FormulaMedica): string | number | undefined {
    switch (this.campoOrden) {
      case 'fechaEmision':
        return String(formula.fechaEmision ?? '');
      case 'mascota':
        return formula.mascota?.nombreMascota;
      case 'medicamento':
        return formula.medicamento?.nombre;
      case 'medico':
        return nombreCompleto(formula.medico);
      case 'estado':
        return formula.activo ? 'Activa' : 'Inactiva';
      default:
        return String(formula.fechaCreacionRegistro ?? '');
    }
  }
}
