import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './pages/mascota/mascota.component';
import { MedicoComponent } from './pages/medico/medico.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { EspecializacionesComponent } from './pages/especializaciones/especializaciones.component';
import { MedicamentosComponent } from './pages/medicamentos/medicamentos.component';
import { RazasComponent } from './pages/razas/razas.component';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
  {
    path: 'inicio',
    component: AdminComponent,
    data: { title: 'Inicio' },
    children: [
      { path: 'usuarios', component: UsuarioComponent, data: { title: 'Usuarios' }},
      { path: 'mascotas', component: MascotaComponent, data: { title: 'Mascotas' }},
      { path: 'medicos', component: MedicoComponent, data: { title: 'Medicos' }},
      { path: 'clientes', component: ClientesComponent, data: { title: 'Clientes' }},
      { path: 'especializaciones', component: EspecializacionesComponent, data: { title: 'Especializaciones' }},
      { path: 'medicamentos', component: MedicamentosComponent, data: { title: 'Medicamentos' }},
      { path: 'razas', component: RazasComponent, data: { title: 'Razas' }}
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
