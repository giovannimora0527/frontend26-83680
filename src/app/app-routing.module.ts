import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { EspecializacionComponent } from './demo/pages/especializacion/especializacion.component';
import { RazaComponent } from './demo/pages/raza/raza.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';


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
      { path: 'citas', component: CitaComponent, data: { title: 'Citas' }},
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
