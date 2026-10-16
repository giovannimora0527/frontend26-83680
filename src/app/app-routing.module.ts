import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { HistoriaComponent } from './demo/pages/historia/historia.component';
import { FormulaComponent } from './demo/pages/formula/formula.component';


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
      { path: 'clientes', component: ClienteComponent, data: { title: 'Gestión de Clientes' }},
      { path: 'mascotas', component: MascotaComponent, data: { title: 'Gestión de Mascotas' }},
      { path: 'medicos', component: MedicoComponent, data: { title: 'Gestión de Médicos' }},
      { path: 'citas', component: CitaComponent, data: { title: 'Gestión de Citas' }},
      { path: 'historias', component: HistoriaComponent, data: { title: 'Gestión de Historias Clínicas' }},
      { path: 'formulas', component: FormulaComponent, data: { title: 'Gestión de Fórmulas Médicas' }}
      /* Inserte nuevos menus aqui */    
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
