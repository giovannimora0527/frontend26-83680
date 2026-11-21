import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { MedicamentoComponent } from './demo/pages/medicamento/medicamento.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { FormulaMedicaComponent } from './demo/pages/formula-medica/formula-medica.component';
import { HistoriaMedicaComponent } from './demo/pages/historia-medica/historia-medica.component';
import { AnotacionHistoriaComponent } from './demo/pages/anotacion-historia/anotacion-historia.component';
import { FacturaComponent } from './demo/pages/factura/factura.component';
import { ReporteComponent } from './demo/pages/reporte/reporte.component';
import { LoginComponent } from './demo/pages/login/login.component';
import { roleGuard } from './guards/role.guard';
import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { MisMascotasComponent } from './demo/pages/mis-mascotas/mis-mascotas.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { title: 'Iniciar sesión' } },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },  
  {
    path: 'inicio',
    component: AdminComponent,
    canActivate: [roleGuard],
    data: { title: 'Inicio' },
    children: [      
      { path: 'usuarios', component: UsuarioComponent, canActivate: [roleGuard], data: { title: 'Usuarios', roles: ['ADMINISTRADOR', 'ADMIN'] }},
      { path: 'clientes', component: ClienteComponent, canActivate: [roleGuard], data: { title: 'Propietarios', roles: ['ADMINISTRADOR', 'SECRETARIA'] }},
      { path: 'mis-mascotas', component: MisMascotasComponent, canActivate: [roleGuard], data: { title: 'Mis mascotas', roles: ['CLIENTE'] }},
      { path: 'mascotas', component: MascotaComponent, canActivate: [roleGuard], data: { title: 'Mascotas', roles: ['ADMINISTRADOR', 'ADMIN', 'SECRETARIA', 'VETERINARIO'] }},
      { path: 'medicos', component: MedicoComponent, canActivate: [roleGuard], data: { title: 'Medicos', roles: ['ADMINISTRADOR', 'ADMIN', 'SECRETARIA'] }},
      { path: 'medicamentos', component: MedicamentoComponent, canActivate: [roleGuard], data: { title: 'Medicamentos', roles: ['ADMINISTRADOR', 'ADMIN', 'VETERINARIO', 'DESPACHO_MEDICO'] }},
      { path: 'citas', component: CitaComponent, canActivate: [roleGuard], data: { title: 'Citas', roles: ['ADMINISTRADOR', 'ADMIN', 'SECRETARIA', 'VETERINARIO'] }},
      { path: 'formulas-medicas', component: FormulaMedicaComponent, canActivate: [roleGuard], data: { title: 'Formulas Medicas', roles: ['ADMINISTRADOR', 'ADMIN', 'VETERINARIO', 'DESPACHO_MEDICO'] }},
      { path: 'historias-medicas', component: HistoriaMedicaComponent, canActivate: [roleGuard], data: { title: 'Historias Medicas', roles: ['ADMINISTRADOR', 'ADMIN', 'VETERINARIO'] }},
      { path: 'anotaciones-historia', component: AnotacionHistoriaComponent, canActivate: [roleGuard], data: { title: 'Anotaciones de Historia', roles: ['ADMINISTRADOR', 'ADMIN', 'VETERINARIO'] }},
      { path: 'facturacion', component: FacturaComponent, canActivate: [roleGuard], data: { title: 'Facturacion y Pagos', roles: ['ADMINISTRADOR', 'ADMIN', 'SECRETARIA'] }},
      { path: 'reportes', component: ReporteComponent, canActivate: [roleGuard], data: { title: 'Reportes Administrativos y Contables', roles: ['ADMINISTRADOR', 'ADMIN', 'SECRETARIA', 'VETERINARIO', 'DESPACHO_MEDICO'] }}
      /* Inserte nuevos menus aqui */    
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
