import { Routes } from '@angular/router';
import { authGuard, invitadoGuard, menuGuard } from './core/guards';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './pages/login/login.component';

/**
 * Cada módulo se habilita según los menús que el backend asigna al perfil (tabla perfil_menu).
 * Los servicios siguen protegidos en el backend con @RequiereRol, así que asignar un menú no da
 * permisos que el perfil no tenga.
 */
export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [invitadoGuard] },
  {
    path: 'inicio',
    component: LayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [menuGuard],
    children: [
      { path: '', data: { libre: true }, loadComponent: () => import('./pages/inicio/inicio.component').then(m => m.InicioComponent) },
      { path: 'usuarios', loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'clientes', loadComponent: () => import('./pages/clientes/clientes.component').then(m => m.ClientesComponent) },
      { path: 'mascotas', loadComponent: () => import('./pages/mascotas/mascotas.component').then(m => m.MascotasComponent) },
      { path: 'medicos', loadComponent: () => import('./pages/medicos/medicos.component').then(m => m.MedicosComponent) },
      { path: 'especializaciones', loadComponent: () => import('./pages/tarifas/tarifas.component').then(m => m.TarifasComponent) },
      { path: 'medicamentos', loadComponent: () => import('./pages/inventario/inventario.component').then(m => m.InventarioComponent) },
      { path: 'citas', loadComponent: () => import('./pages/citas/citas.component').then(m => m.CitasComponent) },
      { path: 'agenda', loadComponent: () => import('./pages/agenda/agenda.component').then(m => m.AgendaComponent) },
      { path: 'atencion/:citaId', data: { menu: '/inicio/agenda' }, loadComponent: () => import('./pages/atencion/atencion.component').then(m => m.AtencionComponent) },
      { path: 'historias', loadComponent: () => import('./pages/historias/historias.component').then(m => m.HistoriasComponent) },
      { path: 'formulas', loadComponent: () => import('./pages/formulas/formulas.component').then(m => m.FormulasComponent) },
      { path: 'facturacion', loadComponent: () => import('./pages/facturacion/facturacion.component').then(m => m.FacturacionComponent) },
      { path: 'reportes', loadComponent: () => import('./pages/reportes/reportes.component').then(m => m.ReportesComponent) },
      { path: 'despacho', loadComponent: () => import('./pages/despacho/despacho.component').then(m => m.DespachoComponent) },
      { path: 'perfiles', loadComponent: () => import('./pages/perfiles/perfiles.component').then(m => m.PerfilesComponent) }
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: '**', redirectTo: 'inicio' }
];
