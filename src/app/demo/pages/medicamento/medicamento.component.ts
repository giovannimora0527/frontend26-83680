import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { Medicamento } from 'src/app/models/medicamento';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { mostrarAdvertencia, mostrarError, mostrarExito } from 'src/app/utils/mensajes-utils';
import { MedicamentoService } from './service/medicamento.service';

@Component({
  selector: 'app-medicamento',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './medicamento.component.html',
  styleUrl: './medicamento.component.scss',
  providers: [DatePipe]
})
export class MedicamentoComponent implements OnInit {
  modalInstance: Modal | null = null;
  titleModal = '';
  modoFormulario = '';
  titleBoton = '';

  listMedicamentos: Medicamento[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  guardando = false;
  cargandoArchivo = false;
  archivoSeleccionado: File | null = null;
  erroresCarga: Array<{ fila: number; mensaje: string }> = [];

  medicamentoSelected: Medicamento | null = null;
  form!: FormGroup;

  constructor(
    private readonly medicamentoService: MedicamentoService,
    private readonly formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.listar();
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  get medicamentosFiltrados(): Medicamento[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const lista = this.listMedicamentos ?? [];

    if (!termino) {
      return lista;
    }

    return lista.filter((med) => {
      const valores = [
        med.nombre,
        med.descripcion,
        med.presentacion,
        med.codigo,
        med.lote,
        med.registroInvima
      ];

      return valores.some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });
  }

  get medicamentosPaginados(): Medicamento[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.medicamentosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.medicamentosFiltrados.length / this.registrosPorPagina) || 1;
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  inicializarFormulario() {
    this.form = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      presentacion: ['', Validators.maxLength(100)],
      codigo: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{8}$/)]],
      lote: ['', Validators.maxLength(50)],
      registroInvima: ['', Validators.maxLength(50)],
      requiereRegistroInvima: [false],
      precioCompra: [null, [Validators.required, Validators.min(1)]],
      precioVenta: [null, [Validators.required, Validators.min(1)]],
      cantidadDisponible: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [0, [Validators.required, Validators.min(0)]],
      fechaCompra: ['', Validators.required],
      fechaIngresoInventario: ['', Validators.required],
      fechaVence: ['', Validators.required],
      fechaProximoPedido: [''],
      activo: [true]
    });
  }

  listar() {
    this.medicamentoService.listar().subscribe({
      next: (data) => {
        this.listMedicamentos = data ?? [];
        this.paginaActual = 1;
      },
      error: (error: HttpErrorResponse) => {
        mostrarError(error);
      }
    });
  }

  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  nuevoMedicamento(modo: string) {
    this.medicamentoSelected = null;
    this.modoFormulario = modo;
    this.titleModal = modo === 'C' ? 'Crear medicamento' : 'Editar medicamento';
    this.titleBoton = modo === 'C' ? 'Guardar medicamento' : 'Actualizar medicamento';
    this.form.reset({
      nombre: '',
      descripcion: '',
      presentacion: '',
      codigo: '',
      lote: '',
      registroInvima: '',
      requiereRegistroInvima: false,
      precioCompra: null,
      precioVenta: null,
      cantidadDisponible: 0,
      stockMinimo: 0,
      fechaCompra: '',
      fechaIngresoInventario: '',
      fechaVence: '',
      fechaProximoPedido: '',
      activo: true
    });
    this.openModal();
  }

  abrirEdicion(med: Medicamento) {
    this.medicamentoSelected = med;
    this.modoFormulario = 'E';
    this.titleModal = 'Editar medicamento';
    this.titleBoton = 'Actualizar medicamento';

    this.form.patchValue({
      nombre: med.nombre,
      descripcion: med.descripcion,
      presentacion: med.presentacion,
      codigo: med.codigo,
      lote: med.lote,
      registroInvima: med.registroInvima,
      requiereRegistroInvima: Boolean(med.requiereRegistroInvima),
      precioCompra: med.precioCompra,
      precioVenta: med.precioVenta,
      cantidadDisponible: med.cantidadDisponible,
      stockMinimo: med.stockMinimo,
      fechaCompra: this.formatearFechaInput(med.fechaCompra),
      fechaIngresoInventario: this.formatearFechaInput(med.fechaIngresoInventario),
      fechaVence: this.formatearFechaInput(med.fechaVence),
      fechaProximoPedido: this.formatearFechaInput(med.fechaProximoPedido),
      activo: med.activo ?? true
    });
    this.openModal();
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      mostrarAdvertencia('Validación', 'Complete los campos obligatorios y verifique el formato del inventario.');
      return;
    }

    const payload: Medicamento = this.form.getRawValue();

    if (payload.requiereRegistroInvima && (!payload.registroInvima || payload.registroInvima.trim() === '')) {
      mostrarAdvertencia('Registro Invima', 'El registro Invima es obligatorio cuando el producto requiere este trámite.');
      return;
    }

    if (payload.fechaVence && payload.fechaCompra && payload.fechaVence < payload.fechaCompra) {
      mostrarAdvertencia('Fechas inválidas', 'La fecha de vencimiento no puede ser anterior a la fecha de compra.');
      return;
    }

    if (payload.precioVenta && payload.precioCompra && payload.precioVenta < payload.precioCompra) {
      mostrarAdvertencia('Precios inválidos', 'El precio de venta no puede ser menor al de compra.');
      return;
    }

    this.guardando = true;

    const operacion = this.modoFormulario === 'C'
      ? this.medicamentoService.guardar(payload)
      : this.medicamentoService.actualizar({ ...payload, id: this.medicamentoSelected?.id });

    operacion.subscribe({
      next: (respuesta: MiRespuesta) => {
        this.guardando = false;
        this.closeModal();
        this.listar();
        mostrarExito(respuesta.message || 'Operación realizada correctamente');
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        mostrarError(error);
      }
    });
  }

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files && input.files.length > 0 ? input.files[0] : null;
    this.erroresCarga = [];
  }

  importarArchivo() {
    if (!this.archivoSeleccionado) {
      mostrarAdvertencia('Archivo requerido', 'Seleccione un archivo CSV o XLSX para continuar.');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', this.archivoSeleccionado);
    this.cargandoArchivo = true;

    this.medicamentoService.importarMasivo(formData).subscribe({
      next: (respuesta) => {
        this.cargandoArchivo = false;
        this.erroresCarga = respuesta.errores ?? [];

        if ((respuesta.errores ?? []).length > 0) {
          mostrarAdvertencia('Carga con errores', `Se detectaron ${respuesta.errores?.length ?? 0} errores. Revise la información del archivo.`);
          return;
        }

        this.archivoSeleccionado = null;
        this.listar();
        mostrarExito(`Se importaron ${respuesta.importados?.length ?? respuesta.registrosValidos ?? 0} medicamentos correctamente.`);
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoArchivo = false;
        mostrarError(error);
      }
    });
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
      this.modalInstance = null;
    }
  }

  openModal() {
    const modalElement = document.getElementById('modalCrearMedicamento');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  estadoInventario(med: Medicamento): string {
    const cantidad = Number(med.cantidadDisponible ?? 0);
    const minimo = Number(med.stockMinimo ?? 0);
    const fechaVence = med.fechaVence ? new Date(med.fechaVence) : null;
    const hoy = new Date();

    if (cantidad <= 0) {
      return 'AGOTADO';
    }
    if (cantidad <= minimo) {
      return 'STOCK BAJO';
    }
    if (fechaVence && (fechaVence.getTime() - hoy.getTime()) <= (30 * 24 * 60 * 60 * 1000)) {
      return 'PRÓXIMO A VENCER';
    }
    return 'DISPONIBLE';
  }

  claseEstadoInventario(med: Medicamento): string {
    switch (this.estadoInventario(med)) {
      case 'AGOTADO':
        return 'badge bg-danger';
      case 'STOCK BAJO':
        return 'badge bg-warning text-dark';
      case 'PRÓXIMO A VENCER':
        return 'badge bg-info text-dark';
      default:
        return 'badge bg-success';
    }
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private formatearFechaInput(fecha: Date | string | undefined): string {
    if (!fecha) {
      return '';
    }

    const fechaObj = new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) {
      return '';
    }

    const anio = fechaObj.getFullYear();
    const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaObj.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
