import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { mostrarError } from 'src/app/utils/mensajes-utils';
import { compararValores, nombreCompleto, normalizarTexto } from 'src/app/utils/tabla-utils';
import { AnotacionHistoriaService } from './service/anotacion-historia.service';

/**
 * Listado general de anotaciones (solo consulta).
 * Las anotaciones se registran desde el detalle (Ver) de cada historia clínica.
 */
@Component({
  selector: 'app-anotacion-historia',
  imports: [CommonModule],
  templateUrl: './anotacion-historia.component.html',
  styleUrl: './anotacion-historia.component.scss'
})
export class AnotacionHistoriaComponent {
  // Variables para la paginación, búsqueda y ordenamiento de la datatable.
  listAnotaciones: AnotacionHistoria[] = [];
  terminoBusqueda = '';
  ordenAscendente = false;
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  cargando = false;

  // Funciones de utilidad que se usan en la plantilla.
  readonly nombreCompleto = nombreCompleto;

  constructor(private readonly anotacionService: AnotacionHistoriaService) {
    this.listar();
  }

  /**
   * Filtra las anotaciones según la búsqueda y las ordena por fecha.
   * @returns Un arreglo de anotaciones filtradas y ordenadas.
   */
  get anotacionesFiltradas(): AnotacionHistoria[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());

    const filtradas = this.listAnotaciones.filter((anotacion) => {
      if (!termino) {
        return true;
      }
      const valores = [
        anotacion.id,
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
      compararValores(String(a.fecha ?? ''), String(b.fecha ?? ''), this.ordenAscendente)
    );
  }

  get anotacionesPaginadas(): AnotacionHistoria[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.anotacionesFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.anotacionesFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  /**
   * Metodo que permite listar las anotaciones registradas y mostrarlas en la tabla.
   */
  listar() {
    this.cargando = true;
    this.anotacionService.listar().subscribe({
      next: (data) => {
        this.listAnotaciones = data;
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        mostrarError(error);
      }
    });
  }

  // Metodo que actualiza el termino de busqueda y reinicia la pagina actual a 1.
  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  // Invierte el orden por fecha.
  cambiarOrden() {
    this.ordenAscendente = !this.ordenAscendente;
    this.paginaActual = 1;
  }

  // Cambia paginacion.
  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }
}
