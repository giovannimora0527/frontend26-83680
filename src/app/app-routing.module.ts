import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { HistoriaComponent } from './demo/pages/historia/historia.component';
import { FormulaComponent } from './demo/pages/formula/formula.component';
import { LoginComponent } from './demo/pages/login/login.component';
import { AgendaComponent } from './demo/pages/agenda/agenda.component';
import { AtencionComponent } from './demo/pages/atencion/atencion.component';
import { InventarioComponent } from './demo/pages/inventario/inventario.component';
import { TarifaComponent } from './demo/pages/tarifa/tarifa.component';
import { FacturaComponent } from './demo/pages/factura/factura.component';
import { ReporteComponent } from './demo/pages/reporte/reporte.component';
import { DespachoComponent } from './demo/pages/despacho/despacho.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { authGuard } from './guards/auth.guard';

/**
 * Rutas de la aplicacion. data.menu es el codigo del menu (tabla menu) que el perfil
 * debe tener asignado para entrar; lo revisa el authGuard.
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
  { path: 'login', component: LoginComponent },
  {
    path: 'inicio',
    component: AdminComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    data: { title: 'Inicio' },
    children: [
      { path: 'clientes', component: ClienteComponent, data: { title: 'Gestión de Clientes', menu: 'clientes' }},
      { path: 'mascotas', component: MascotaComponent, data: { title: 'Gestión de Mascotas', menu: 'mascotas' }},
      { path: 'medicos', component: MedicoComponent, data: { title: 'Gestión de Médicos', menu: 'medicos' }},
      { path: 'citas', component: CitaComponent, data: { title: 'Gestión de Citas', menu: 'cita' }},
      { path: 'historias', component: HistoriaComponent, data: { title: 'Historias Clínicas', menu: 'historias' }},
      { path: 'formulas', component: FormulaComponent, data: { title: 'Fórmulas Médicas', menu: 'formulas' }},
      { path: 'agenda', component: AgendaComponent, data: { title: 'Mi agenda', menu: 'agenda' }},
      { path: 'atencion/:id', component: AtencionComponent, data: { title: 'Atención de la cita', menu: 'agenda' }},
      { path: 'medicamentos', component: InventarioComponent, data: { title: 'Inventario de medicamentos', menu: 'medicamentos' }},
      { path: 'especializaciones', component: TarifaComponent, data: { title: 'Especialidades', menu: 'especializaciones', pestana: 'especialidades' }},
      { path: 'tarifas', component: TarifaComponent, data: { title: 'Tarifas y servicios', menu: 'tarifas', pestana: 'tarifas' }},
      { path: 'facturas', component: FacturaComponent, data: { title: 'Facturación', menu: 'facturas' }},
      { path: 'reportes', component: ReporteComponent, data: { title: 'Reportes', menu: 'reportes' }},
      { path: 'despacho', component: DespachoComponent, data: { title: 'Despacho de medicamentos', menu: 'despacho' }},
      { path: 'usuarios', component: UsuarioComponent, data: { title: 'Gestión de Usuarios', menu: 'usuarios' }}
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
