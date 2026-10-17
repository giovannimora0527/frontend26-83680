import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { EspecializacionesComponent } from './pages/especializaciones/especializaciones.component';
import { MedicamentosComponent } from './pages/medicamentos/medicamentos.component';
import { RazasComponent } from './pages/razas/razas.component';
import { FormulasMedicasComponent } from './pages/formulas-medicas/formulas-medicas.component';
import { CitasComponent } from './pages/citas/citas.component';
import { HistoriasClinicasComponent } from './pages/historias-clinicas/historias-clinicas.component';

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
      {
        path: 'usuarios',
        component: UsuarioComponent,
        data: { title: 'Gestión de usuarios' }
      },
      {
        path: 'mascotas',
        component: MascotaComponent,
        data: { title: 'Gestión de mascotas' }
      },
      {
        path: 'medicos',
        component: MedicoComponent,
        data: { title: 'Gestión de médicos' }
      },
      {
        path: 'clientes',
        component: ClientesComponent,
        data: { title: 'Gestión de clientes' }
      },
      {
        path: 'especializaciones',
        component: EspecializacionesComponent,
        data: { title: 'Gestión de especializaciones' }
      },
      {
        path: 'medicamentos',
        component: MedicamentosComponent,
        data: { title: 'Gestión de medicamentos' }
      },
      {
        path: 'razas',
        component: RazasComponent,
        data: { title: 'Gestión de razas' }
      },
      {
        path: 'formulas-medicas',
        component: FormulasMedicasComponent,
        data: { title: 'Gestión de fórmulas médicas' }
      },
      {
        path: 'citas',
        component: CitasComponent,
        data: { title: 'Gestión de citas médicas' }
      },
      {
        path: 'historias-clinicas',
        component: HistoriasClinicasComponent,
        data: { title: 'Gestión de historias clínicas' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'inicio'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
