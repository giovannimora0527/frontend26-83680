import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClinicApiService } from '../../services/clinic-api.service';
import { AnotacionApi, AnotacionRequestApi, CitaApi, ClienteApi, HistoriaApi, HistoriaRequestApi, MascotaApi, MedicoApi } from '../../models/clinic-workflows';

type OrdenHistoria = 'fechaHora' | 'mascotaNombre' | 'clienteNombre' | 'medicoNombre' | 'motivoConsulta';
interface HistoriaForm { clienteId: number | null; mascotaId: number | null; citaId: number | null; medicoId: number | null; motivoConsulta: string; diagnostico: string; observaciones: string; }
interface AnotacionForm { medicoId: number | null; fecha: string; descripcion: string; observacion: string; diagnostico: string; }

/** Gestiona historias clínicas y permite ver, filtrar y agregar anotaciones de cada consulta. */
@Component({ selector: 'app-historias-clinicas', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './historias-clinicas.component.html', styleUrl: './historias-clinicas.component.scss' })
export class HistoriasClinicasComponent implements OnInit {
  historias: HistoriaApi[] = []; clientes: ClienteApi[] = []; mascotas: MascotaApi[] = []; medicos: MedicoApi[] = []; citas: CitaApi[] = [];
  filtro = ''; fechaDesde = ''; fechaHasta = ''; campoOrden: OrdenHistoria = 'fechaHora'; direccionOrden: 'asc' | 'desc' = 'desc'; paginaActual = 1; tamanoPagina = 10;
  cargando = false; guardando = false; modalFormularioAbierto = false; modalDetalleAbierto = false; modalDetalleAnotacion = false; modoAnotacionEdicion = false; idAnotacionEdicion?: number;
  mensaje = ''; errorGeneral = ''; errorFormulario = ''; errorAnotacion = ''; historiaDetalle: HistoriaApi | null = null; anotacionDetalle: AnotacionApi | null = null; anotaciones: AnotacionApi[] = []; filtroAnotacion = ''; paginaAnotaciones = 1; tamanoAnotaciones = 5;
  formulario: HistoriaForm = this.formularioVacio(); formularioAnotacion: AnotacionForm = this.formularioAnotacionVacio();
  /** API compartida para las peticiones REST. */
  constructor(public readonly api: ClinicApiService) {}
  /** Carga historias y catálogos utilizados al registrar consultas. */
  ngOnInit(): void { this.recargar(); this.cargarCatalogos(); }
  /** Obtiene el listado de historias clínicas desde el backend. */
  recargar(): void { this.cargando=true;this.errorGeneral='';this.api.listarHistorias().subscribe({next:data=>{this.historias=data??[];this.cargando=false;this.ajustarPagina();},error:e=>{this.errorGeneral=this.api.mensajeError(e,'consultar historias clínicas');this.cargando=false;}}); }
  /** Carga clientes, veterinarios y citas necesarias para resolver las relaciones. */
  private cargarCatalogos(): void { this.api.listarClientes().subscribe({next:d=>this.clientes=d??[],error:e=>this.errorGeneral=this.api.mensajeError(e,'cargar clientes')});this.api.listarMedicos().subscribe({next:d=>this.medicos=d??[],error:e=>this.errorGeneral=this.api.mensajeError(e,'cargar veterinarios')});this.api.listarCitas().subscribe({next:d=>this.citas=d??[],error:e=>this.errorGeneral=this.api.mensajeError(e,'cargar citas')}); }
  /** Busca y ordena historias por los filtros introducidos. */
  get historiasFiltradas(): HistoriaApi[] { const term=this.filtro.trim().toLocaleLowerCase('es-CO');return this.historias.filter(h=>{const date=(h.fechaHora??h.fechaCreacion??'').slice(0,10);const text=[h.id,h.clienteNombre,h.mascotaNombre,h.medicoNombre,h.motivoConsulta,h.diagnostico,h.observaciones].join(' ').toLocaleLowerCase('es-CO');return(!term||text.includes(term))&&(!this.fechaDesde||date>=this.fechaDesde)&&(!this.fechaHasta||date<=this.fechaHasta);}).sort((a,b)=>{const x=a[this.campoOrden]??'';const y=b[this.campoOrden]??'';const cmp=this.campoOrden==='fechaHora'?String(x).localeCompare(String(y)):String(x).localeCompare(String(y),'es',{numeric:true,sensitivity:'base'});return this.direccionOrden==='asc'?cmp:-cmp;}); }
  /** Registros de la página activa. */
  get historiasPagina(): HistoriaApi[] { return this.historiasFiltradas.slice((this.paginaActual-1)*this.tamanoPagina,this.paginaActual*this.tamanoPagina); }
  /** Total de páginas calculado sobre el resultado filtrado. */
  get totalPaginas():number{return Math.max(1,Math.ceil(this.historiasFiltradas.length/this.tamanoPagina));}
  /** Primer índice del rango visible. */
  get inicio():number{return this.historiasFiltradas.length?(this.paginaActual-1)*this.tamanoPagina+1:0;}
  /** Último índice del rango visible. */
  get fin():number{return Math.min(this.paginaActual*this.tamanoPagina,this.historiasFiltradas.length);}
  /** Ordena una columna y vuelve a la primera página. */
  ordenarPor(campo:OrdenHistoria):void{if(this.campoOrden===campo)this.direccionOrden=this.direccionOrden==='asc'?'desc':'asc';else{this.campoOrden=campo;this.direccionOrden=campo==='fechaHora'?'desc':'asc';}this.paginaActual=1;}
  /** Reinicia la paginación cuando cambia un filtro. */
  cambiarFiltro():void{this.paginaActual=1;}
  /** Navega a una página válida. */
  irAPagina(p:number):void{if(p>=1&&p<=this.totalPaginas)this.paginaActual=p;}
  /** Abre un formulario vacío para una nueva historia clínica. */
  abrirNueva():void{this.formulario=this.formularioVacio();this.mascotas=[];this.errorFormulario='';this.modalFormularioAbierto=true;this.mensaje='';}
  /** Descarga únicamente las mascotas relacionadas con el cliente elegido. */
  cambiarCliente():void{this.formulario.mascotaId=null;this.formulario.citaId=null;this.formulario.medicoId=null;this.mascotas=[];if(this.formulario.clienteId===null)return;this.api.listarMascotas(this.formulario.clienteId).subscribe({next:d=>this.mascotas=d??[],error:e=>this.errorFormulario=this.api.mensajeError(e,'cargar las mascotas del cliente')});}
  /** Filtra las citas atendidas de la mascota seleccionada y prepara el veterinario de la historia. */
  cambiarMascota():void{this.formulario.citaId=null;this.formulario.medicoId=null;}
  /** Cuando se elige la cita atendida, rellena el veterinario y el motivo si están vacíos. */
  cambiarCita():void{const cita=this.citas.find(c=>c.id===this.formulario.citaId);this.formulario.medicoId=cita?.medicoId??null;if(cita&&!this.formulario.motivoConsulta.trim())this.formulario.motivoConsulta=cita.motivo??'';}
  /** Citas atendidas que pertenecen a la combinación cliente-mascota elegida. */
  get citasAtendidasDisponibles():CitaApi[]{return this.citas.filter(c=>c.estado.toLowerCase()==='atendida'&&c.clienteId===this.formulario.clienteId&&c.mascotaId===this.formulario.mascotaId&&!this.historias.some(h=>h.citaId===c.id));}
  /** Guarda la historia después de validar los campos y sus relaciones. */
  guardarHistoria():void{this.errorFormulario='';if(!this.formulario.clienteId||!this.formulario.mascotaId||!this.formulario.citaId||!this.formulario.medicoId||!this.formulario.motivoConsulta.trim()||!this.formulario.diagnostico.trim()){this.errorFormulario='Completa cliente, mascota, cita atendida, motivo y diagnóstico.';return;}const payload:HistoriaRequestApi={clienteId:Number(this.formulario.clienteId),mascotaId:Number(this.formulario.mascotaId),citaId:Number(this.formulario.citaId),medicoId:Number(this.formulario.medicoId),motivoConsulta:this.formulario.motivoConsulta.trim(),diagnostico:this.formulario.diagnostico.trim(),observaciones:this.formulario.observaciones.trim()||null};this.guardando=true;this.api.crearHistoria(payload).subscribe({next:()=>{this.guardando=false;this.modalFormularioAbierto=false;this.mensaje='Historia clínica registrada correctamente.';this.recargar();this.cargarCatalogos();},error:e=>{this.guardando=false;this.errorFormulario=this.api.mensajeError(e,'registrar la historia clínica');}});}
  /** Abre el detalle y carga el histórico de anotaciones. */
  abrirDetalle(historia:HistoriaApi):void{this.historiaDetalle=historia;this.modalDetalleAbierto=true;this.anotaciones=[];this.filtroAnotacion='';this.paginaAnotaciones=1;this.formularioAnotacion=this.formularioAnotacionVacio(historia.medicoId);this.api.listarAnotaciones(historia.id).subscribe({next:d=>this.anotaciones=d??[],error:e=>this.errorGeneral=this.api.mensajeError(e,'consultar las anotaciones')});}
  /** Cierra los modales de historias y anotaciones. */
  cerrarModales():void{this.modalFormularioAbierto=false;this.modalDetalleAbierto=false;this.modalDetalleAnotacion=false;this.historiaDetalle=null;this.anotacionDetalle=null;this.errorFormulario='';this.errorAnotacion='';}
  /** Lista de anotaciones filtradas por descripción, fecha, diagnóstico o veterinario. */
  get anotacionesFiltradas():AnotacionApi[]{const term=this.filtroAnotacion.trim().toLocaleLowerCase('es-CO');return this.anotaciones.filter(a=>[a.id,a.fecha,a.medicoNombre,a.descripcion,a.observacion,a.diagnostico].join(' ').toLocaleLowerCase('es-CO').includes(term)).sort((a,b)=>b.fecha.localeCompare(a.fecha));}
  /** Anotaciones de la página activa del histórico. */
  get anotacionesPagina():AnotacionApi[]{return this.anotacionesFiltradas.slice((this.paginaAnotaciones-1)*this.tamanoAnotaciones,this.paginaAnotaciones*this.tamanoAnotaciones);}
  /** Total de páginas del histórico de anotaciones. */
  get paginasAnotaciones():number{return Math.max(1,Math.ceil(this.anotacionesFiltradas.length/this.tamanoAnotaciones));}
  /** Abre formulario de creación de anotación. */
  nuevaAnotacion():void{if(!this.historiaDetalle)return;this.modoAnotacionEdicion=false;this.idAnotacionEdicion=undefined;this.formularioAnotacion=this.formularioAnotacionVacio(this.historiaDetalle.medicoId);this.errorAnotacion='';}
  /** Carga una anotación en los controles para editarla. */
  editarAnotacion(a:AnotacionApi):void{this.modoAnotacionEdicion=true;this.idAnotacionEdicion=a.id;this.formularioAnotacion={medicoId:a.medicoId,fecha:a.fecha.slice(0,16),descripcion:a.descripcion,observacion:a.observacion??'',diagnostico:a.diagnostico??''};this.errorAnotacion='';}
  /** Muestra el detalle completo de una anotación. */
  verAnotacion(a:AnotacionApi):void{this.anotacionDetalle=a;this.modalDetalleAnotacion=true;}
  /** Crea o actualiza la anotación asociada a la historia seleccionada. */
  guardarAnotacion():void{if(!this.historiaDetalle)return;this.errorAnotacion='';if(!this.formularioAnotacion.medicoId||!this.formularioAnotacion.fecha||!this.formularioAnotacion.descripcion.trim()){this.errorAnotacion='Selecciona veterinario, fecha y descripción de la anotación.';return;}const payload:AnotacionRequestApi={historiaId:this.historiaDetalle.id,medicoId:Number(this.formularioAnotacion.medicoId),fecha:this.formularioAnotacion.fecha.length===16?this.formularioAnotacion.fecha+':00':this.formularioAnotacion.fecha,descripcion:this.formularioAnotacion.descripcion.trim(),observacion:this.formularioAnotacion.observacion.trim()||null,diagnostico:this.formularioAnotacion.diagnostico.trim()||null};this.guardando=true;const request=this.modoAnotacionEdicion&&this.idAnotacionEdicion?this.api.actualizarAnotacion(this.idAnotacionEdicion,payload):this.api.crearAnotacion(this.historiaDetalle.id,payload);request.subscribe({next:()=>{this.guardando=false;this.mensaje='Anotación guardada correctamente.';this.errorAnotacion='';this.api.listarAnotaciones(this.historiaDetalle!.id).subscribe({next:d=>this.anotaciones=d??[],error:e=>this.errorAnotacion=this.api.mensajeError(e,'recargar anotaciones')});this.nuevaAnotacion();},error:e=>{this.guardando=false;this.errorAnotacion=this.api.mensajeError(e,'guardar la anotación');}});}
  /** Limpia los filtros de la tabla principal. */
  limpiarFiltros():void{this.filtro='';this.fechaDesde='';this.fechaHasta='';this.paginaActual=1;}
  /** Formatea la fecha para la tabla. */
  fechaLegible(value:string|null):string{if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?value:new Intl.DateTimeFormat('es-CO',{dateStyle:'medium',timeStyle:'short'}).format(d);}
  /** Formatea un valor de estado o texto. */
  etiquetaEstado(value:string|null):string{return value?value.charAt(0).toUpperCase()+value.slice(1).toLowerCase():'—';}
  /** Inicializa los campos del formulario de historia clínica. */
  private formularioVacio():HistoriaForm{return{clienteId:null,mascotaId:null,citaId:null,medicoId:null,motivoConsulta:'',diagnostico:'',observaciones:''};}
  /** Inicializa los campos de una anotación y su veterinario predeterminado cuando existe. */
  private formularioAnotacionVacio(medicoId:number|null = null):AnotacionForm{return{medicoId,fecha:this.fechaHoraActual(),descripcion:'',observacion:'',diagnostico:''};}
  /** Obtiene la fecha y hora local para el control datetime-local. */
  private fechaHoraActual():string{const now=new Date();const local=new Date(now.getTime()-now.getTimezoneOffset()*60000);return local.toISOString().slice(0,16);}
  /** Corrige la página activa luego de recargar el listado. */
  private ajustarPagina():void{if(this.paginaActual>this.totalPaginas)this.paginaActual=this.totalPaginas;}
}
