import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { EspecializacionComponent } from './demo/pages/especializacion/especializacion.component';
import { RazaComponent } from './demo/pages/raza/raza.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { HistoriaComponent } from './demo/pages/historia/historia.component';
import { FormulaComponent } from './demo/pages/formula/formula.component';
import { DespachoComponent } from './demo/pages/despacho/despacho.component';
import { CalendarioComponent } from './demo/pages/calendario/calendario.component';
import { TarifasComponent } from './demo/pages/tarifas/tarifas.component';
import { AtencionComponent } from './demo/pages/atencion/atencion.component';
import { FacturacionComponent } from './demo/pages/facturacion/facturacion.component';
import { ReportesComponent } from './demo/pages/reportes/reportes.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { LoginComponent } from './demo/pages/login/login.component';
import { PerfilComponent } from './demo/pages/perfil/perfil.component';
import { InventarioComponent } from './demo/pages/inventario/inventario.component';
import { menuGuard, sesionGuard } from './guards/auth.guards';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },  
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'inicio',
    component: AdminComponent,
    canActivate: [sesionGuard],
    canActivateChild: [menuGuard],
    data: { title: 'Inicio' },
    children: [      
      { path: 'usuarios', component: UsuarioComponent, data: { title: 'Usuarios' }},
      { path: 'mascotas', component: MascotaComponent, data: { title: 'Mascotas' }},
      { path: 'medicos', component: MedicoComponent, data: { title: 'Medicos' }},  
      { path: 'citas', component: CitaComponent, data: { title: 'Citas' }},
      { path: 'historias', component: HistoriaComponent, data: { title: 'Historias clínicas' }},
      { path: 'formulas', component: FormulaComponent, data: { title: 'Fórmulas médicas' }},
      { path: 'despacho', component: DespachoComponent, data: { title: 'Despacho de medicamentos' }},
      { path: 'calendario', component: CalendarioComponent, data: { title: 'Mi calendario' }},
      { path: 'tarifas', component: TarifasComponent, data: { title: 'Tarifas y servicios' }},
      { path: 'atencion', component: AtencionComponent, data: { title: 'Atención médica' }},
      { path: 'facturacion', component: FacturacionComponent, data: { title: 'Facturación' }},
      { path: 'reportes', component: ReportesComponent, data: { title: 'Reportes' }},
      { path: 'medicamentos', component: InventarioComponent, data: { title: 'Inventario' }},
      { path: 'perfiles', component: PerfilComponent, data: { title: 'Perfiles y Menús' }},
      { path: 'clientes', component: ClienteComponent, data: { title: 'Clientes' }},
      { path: 'especializaciones', component: EspecializacionComponent, data: { title: 'Especializaciones' }},
      { path: 'razas', component: RazaComponent, data: { title: 'Razas' }}
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
