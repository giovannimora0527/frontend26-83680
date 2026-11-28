import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { FormulaMedicaComponent } from './demo/pages/formula-medica/formula-medica.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { MedicamentoComponent } from './demo/pages/medicamento/medicamento.component';
import { HistoriaComponent } from './demo/pages/historia/historia.component';
import { EspecializacionComponent } from './demo/pages/especializacion/especializacion.component';
import { RazaComponent } from './demo/pages/raza/raza.component';
import { LoginComponent } from './demo/pages/login/login.component';
import { TarifaComponent } from './demo/pages/tarifa/tarifa.component';
import { AtencionComponent } from './demo/pages/atencion/atencion.component';
import { FacturaComponent } from './demo/pages/factura/factura.component';
import { DespachoComponent } from './demo/pages/despacho/despacho.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  { path: 'login', component: LoginComponent, data: { title: 'Login' } },
  {
    path: 'inicio',
    component: AdminComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    data: { title: 'Inicio' },
    children: [
      { path: 'usuarios', component: UsuarioComponent, canActivate: [roleGuard], data: { title: 'Usuarios' }},
      { path: 'mascotas', component: MascotaComponent, canActivate: [roleGuard], data: { title: 'Mascotas' }},
      { path: 'medicos', component: MedicoComponent, canActivate: [roleGuard], data: { title: 'Medicos' }},
      { path: 'formulas', component: FormulaMedicaComponent, canActivate: [roleGuard], data: { title: 'Formulas' }},
      { path: 'citas', component: CitaComponent, canActivate: [roleGuard], data: { title: 'Citas' }},
      { path: 'clientes', component: ClienteComponent, canActivate: [roleGuard], data: { title: 'Clientes' }},
      { path: 'medicamentos', component: MedicamentoComponent, canActivate: [roleGuard], data: { title: 'Medicamentos' }},
      { path: 'historias', component: HistoriaComponent, canActivate: [roleGuard], data: { title: 'Historias' }},
      { path: 'especializaciones', component: EspecializacionComponent, canActivate: [roleGuard], data: { title: 'Especializaciones' }},
      { path: 'razas', component: RazaComponent, canActivate: [roleGuard], data: { title: 'Razas' }},
      { path: 'tarifas', component: TarifaComponent, canActivate: [roleGuard], data: { title: 'Tarifas' }},
      { path: 'atencion', component: AtencionComponent, canActivate: [roleGuard], data: { title: 'Atención Médica' }},
      { path: 'facturas', component: FacturaComponent, canActivate: [roleGuard], data: { title: 'Facturación' }},
      { path: 'despachos', component: DespachoComponent, canActivate: [roleGuard], data: { title: 'Despachos' }}
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
