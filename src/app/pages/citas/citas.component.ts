import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClinicApiService } from '../../services/clinic-api.service';
import { CitaApi, CitaRequestApi, ClienteApi, MascotaApi, MedicoApi } from '../../models/clinic-workflows';

type OrdenCita = 'fechaHora' | 'clienteNombre' | 'mascotaNombre' | 'medicoNombre' | 'estado';
interface CitaForm { clienteId: number | null; mascotaId: number | null; medicoId: number | null; fechaHora: string; estado: string; motivo: string; }

/** Pantalla para listar, crear y editar citas mediante la API REST. */
@Component({ selector: 'app-citas', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './citas.component.html', styleUrl: './citas.component.scss' })
export class CitasComponent implements OnInit {
  citas: CitaApi[] = []; clientes: ClienteApi[] = []; mascotas: MascotaApi[] = []; medicos: MedicoApi[] = [];
  filtro = ''; filtroEstado = ''; fechaDesde = ''; fechaHasta = ''; campoOrden: OrdenCita = 'fechaHora'; direccionOrden: 'asc' | 'desc' = 'desc'; paginaActual = 1; tamanoPagina = 10;
  cargando = false; guardando = false; modalAbierto = false; modoEdicion = false; idEnEdicion?: number; mensaje = ''; errorGeneral = ''; errorFormulario = '';
  detalleAbierto = false; citaDetalle: CitaApi | null = null;
  formulario: CitaForm = this.formularioVacio(); readonly estados = ['Pendiente', 'Confirmada', 'Atendida', 'Cancelada', 'Programada'];
  /** Cliente HTTP utilizado para comunicarse con Spring Boot. */
  constructor(public readonly api: ClinicApiService) {}
  /** Carga las citas y los catálogos de los formularios. */
  ngOnInit(): void { this.recargar(); this.api.listarClientes().subscribe({ next: data => this.clientes = data ?? [], error: e => this.errorGeneral = this.api.mensajeError(e, 'cargar clientes') }); this.api.listarMedicos().subscribe({ next: data => this.medicos = data ?? [], error: e => this.errorGeneral = this.api.mensajeError(e, 'cargar veterinarios') }); }
  /** Trae las citas reales; los filtros secundarios se aplican en la tabla. */
  recargar(): void { this.cargando = true; this.errorGeneral = ''; this.api.listarCitas().subscribe({ next: data => { this.citas = data ?? []; this.cargando = false; this.ajustarPagina(); }, error: e => { this.errorGeneral = this.api.mensajeError(e, 'consultar las citas'); this.cargando = false; } }); }
  /** Devuelve citas filtradas por texto, estado y rango de fecha, ya ordenadas. */
  get citasFiltradas(): CitaApi[] { const term = this.filtro.trim().toLocaleLowerCase('es-CO'); return this.citas.filter(c => { const date = (c.fechaHora ?? '').slice(0,10); const text = [c.id,c.clienteNombre,c.mascotaNombre,c.medicoNombre,c.estado,c.motivo].join(' ').toLocaleLowerCase('es-CO'); return (!term || text.includes(term)) && (!this.filtroEstado || c.estado.toLowerCase() === this.filtroEstado.toLowerCase()) && (!this.fechaDesde || date >= this.fechaDesde) && (!this.fechaHasta || date <= this.fechaHasta); }).sort((a,b) => { const x = a[this.campoOrden] ?? ''; const y = b[this.campoOrden] ?? ''; const cmp = this.campoOrden === 'fechaHora' ? String(x).localeCompare(String(y)) : String(x).localeCompare(String(y),'es',{numeric:true,sensitivity:'base'}); return this.direccionOrden === 'asc' ? cmp : -cmp; }); }
  /** Filas de la página elegida. */
  get citasPagina(): CitaApi[] { return this.citasFiltradas.slice((this.paginaActual-1)*this.tamanoPagina, this.paginaActual*this.tamanoPagina); }
  /** Total de páginas después de filtrar. */
  get totalPaginas(): number { return Math.max(1, Math.ceil(this.citasFiltradas.length/this.tamanoPagina)); }
  /** Índice inicial del rango visible. */
  get inicio(): number { return this.citasFiltradas.length ? (this.paginaActual-1)*this.tamanoPagina+1 : 0; }
  /** Índice final del rango visible. */
  get fin(): number { return Math.min(this.paginaActual*this.tamanoPagina,this.citasFiltradas.length); }
  /** Cambia el orden por la columna seleccionada. */
  ordenarPor(campo: OrdenCita): void { if(this.campoOrden===campo)this.direccionOrden=this.direccionOrden==='asc'?'desc':'asc';else{this.campoOrden=campo;this.direccionOrden=campo==='fechaHora'?'desc':'asc';}this.paginaActual=1; }
  /** Reinicia la paginación tras cambiar un filtro. */
  cambiarFiltro(): void { this.paginaActual=1; }
  /** Se mueve a una página existente. */
  irAPagina(p: number): void { if(p>=1&&p<=this.totalPaginas)this.paginaActual=p; }
  /** Abre el detalle de una cita en un modal de solo lectura. */
  verDetalle(cita: CitaApi): void { this.citaDetalle = cita; this.detalleAbierto = true; }
  /** Cierra el modal de detalle. */
  cerrarDetalle(): void { this.detalleAbierto = false; this.citaDetalle = null; }
  /** Abre el formulario de nueva cita con una fecha inicial próxima. */
  abrirNueva(): void { this.modoEdicion=false;this.idEnEdicion=undefined;this.formulario=this.formularioVacio();this.mascotas=[];this.errorFormulario='';this.modalAbierto=true;this.mensaje=''; }
  /** Abre edición y obtiene solamente las mascotas del cliente de la cita. */
  abrirEdicion(cita: CitaApi): void { if(cita.estado.toLowerCase()==='cancelada'||cita.estado.toLowerCase()==='atendida'){this.errorGeneral=cita.estado.toLowerCase()==='cancelada'?'Una cita cancelada no puede modificarse.':'Una cita atendida conserva su información histórica.';return;} this.modoEdicion=true;this.idEnEdicion=cita.id;this.formulario={clienteId:cita.clienteId,mascotaId:cita.mascotaId,medicoId:cita.medicoId,fechaHora:cita.fechaHora.slice(0,16),estado:this.etiquetaEstado(cita.estado),motivo:cita.motivo??''};this.errorFormulario='';this.modalAbierto=true;this.api.listarMascotas(cita.clienteId).subscribe({next:data=>this.mascotas=data??[],error:e=>this.errorFormulario=this.api.mensajeError(e,'cargar las mascotas del cliente')}); }
  /** Actualiza el combo de mascotas cuando cambia el cliente. */
  cambiarCliente(): void { this.formulario.mascotaId=null;this.mascotas=[];if(this.formulario.clienteId===null)return;this.api.listarMascotas(this.formulario.clienteId).subscribe({next:data=>this.mascotas=data??[],error:e=>this.errorFormulario=this.api.mensajeError(e,'cargar las mascotas del cliente')}); }
  /** Valida el formulario y llama POST o PUT. */
  guardar(): void { this.errorFormulario=''; if(!this.formulario.clienteId||!this.formulario.mascotaId||!this.formulario.medicoId||!this.formulario.fechaHora||!this.formulario.estado){this.errorFormulario='Completa cliente, mascota, veterinario, fecha, hora y estado.';return;} const payload:CitaRequestApi={clienteId:Number(this.formulario.clienteId),mascotaId:Number(this.formulario.mascotaId),medicoId:Number(this.formulario.medicoId),fechaHora:this.formulario.fechaHora.length===16?this.formulario.fechaHora+':00':this.formulario.fechaHora,estado:this.formulario.estado,motivo:this.formulario.motivo.trim()||null};this.guardando=true;const request=this.modoEdicion&&this.idEnEdicion?this.api.actualizarCita(this.idEnEdicion,payload):this.api.crearCita(payload);request.subscribe({next:()=>{this.guardando=false;this.modalAbierto=false;this.mensaje=this.modoEdicion?'Cita actualizada correctamente.':'Cita creada correctamente.';this.recargar();},error:e=>{this.guardando=false;this.errorFormulario=this.api.mensajeError(e,'guardar la cita');}}); }
  /** Cierra el formulario. */
  cerrar(): void { this.modalAbierto=false;this.errorFormulario=''; }
  /** Limpia filtros. */
  limpiarFiltros(): void { this.filtro='';this.filtroEstado='';this.fechaDesde='';this.fechaHasta='';this.paginaActual=1; }
  /** Formatea fecha y hora usando el huso local del navegador. */
  fechaLegible(value:string):string { if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat('es-CO',{dateStyle:'medium',timeStyle:'short'}).format(date); }
  /** Devuelve un texto uniforme para cada estado. */
  etiquetaEstado(value:string):string { return value ? value.charAt(0).toUpperCase()+value.slice(1).toLowerCase() : ''; }
  /** Devuelve el mínimo de fecha y hora para registrar una cita nueva. */
  get fechaMinima(): string { const now=new Date();const local=new Date(now.getTime()-now.getTimezoneOffset()*60000);return local.toISOString().slice(0,16); }
  /** Inicializa una cita para una hora futura, evitando valores vacíos en el formulario. */
  private formularioVacio():CitaForm { const later=new Date(Date.now()+60*60*1000);const local=new Date(later.getTime()-later.getTimezoneOffset()*60000);return {clienteId:null,mascotaId:null,medicoId:null,fechaHora:local.toISOString().slice(0,16),estado:'Programada',motivo:''}; }
  /** Mantiene la paginación dentro del rango de resultados. */
  private ajustarPagina():void {if(this.paginaActual>this.totalPaginas)this.paginaActual=this.totalPaginas;}
}
