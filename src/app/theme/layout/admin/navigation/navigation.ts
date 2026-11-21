export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  roles?: string[];
  target?: boolean;
  breadcrumbs?: boolean;

  children?: NavigationItem[];
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'navigation',
    title: 'Inicio',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'usuario',
        title: 'Gestión de Usuarios',
        type: 'item',
        url: '/inicio/usuarios',
        icon: 'feather icon-user',
        classes: 'nav-item',
        roles: ['ADMINISTRADOR', 'ADMIN', 'SECRETARIA', 'VETERINARIO', 'DESPACHO_MEDICO']
      },
      {
        id: 'clientes',
        title: 'Gestión de Propietarios',
        type: 'item',
        url: '/inicio/clientes',
        icon: 'feather icon-users',
        classes: 'nav-item',
        roles: ['ADMINISTRADOR', 'ADMIN', 'SECRETARIA']
      },
      {
        id: 'mis-mascotas',
        title: 'Mis Mascotas',
        type: 'item',
        url: '/inicio/mis-mascotas',
        icon: 'feather icon-heart',
        classes: 'nav-item',
        roles: ['CLIENTE']
      },
      {
        id: 'mascotas',
        title: 'Gestión de Mascotas',
        type: 'item',
        url: '/inicio/mascotas',
        icon: 'feather icon-heart',
        classes: 'nav-item',
        roles: ['ADMINISTRADOR', 'ADMIN', 'SECRETARIA', 'VETERINARIO']
      },
      /* ---------- Nuevos menus aqui -------------  */ 
      {
        id: 'medicos',
        title: 'Gestión de Medicos',
        type: 'item',
        url: '/inicio/medicos',
        icon: 'feather icon-users',
        classes: 'nav-item',
        roles: ['ADMINISTRADOR', 'ADMIN', 'SECRETARIA']
      },
      {
        id: 'medicamentos',
        title: 'Gestión de Medicamentos',
        type: 'item',
        url: '/inicio/medicamentos',
        icon: 'feather icon-package',
        classes: 'nav-item',
        roles: ['ADMINISTRADOR', 'ADMIN', 'VETERINARIO', 'DESPACHO_MEDICO']
      },
      {
        id: 'citas',
        title: 'Gestión de Citas',
        type: 'item',
        url: '/inicio/citas',
        icon: 'feather icon-calendar',
        classes: 'nav-item',
        roles: ['ADMINISTRADOR', 'ADMIN', 'SECRETARIA', 'VETERINARIO']
      },
      {
        id: 'formulas-medicas',
        title: 'Gestión de Fórmulas Médicas',
        type: 'item',
        url: '/inicio/formulas-medicas',
        icon: 'feather icon-file-text',
        classes: 'nav-item',
        roles: ['ADMINISTRADOR', 'ADMIN', 'VETERINARIO', 'DESPACHO_MEDICO']
      },
      {
        id: 'historias-medicas',
        title: 'Gestión de Historias Médicas',
        type: 'item',
        url: '/inicio/historias-medicas',
        icon: 'feather icon-clipboard',
        classes: 'nav-item',
        roles: ['ADMINISTRADOR', 'ADMIN', 'VETERINARIO']
      },
      {
        id: 'anotaciones-historia',
        title: 'Gestión de Anotaciones de Historia',
        type: 'item',
        url: '/inicio/anotaciones-historia',
        icon: 'feather icon-edit',
        classes: 'nav-item',
        roles: ['ADMINISTRADOR', 'ADMIN', 'VETERINARIO']
      },
      {
        id: 'facturacion',
        title: 'Facturación y Pagos',
        type: 'item',
        url: '/inicio/facturacion',
        icon: 'feather icon-credit-card',
        classes: 'nav-item',
        roles: ['ADMINISTRADOR', 'ADMIN', 'SECRETARIA']
      },
      {
        id: 'reportes',
        title: 'Reportes Administrativos',
        type: 'item',
        url: '/inicio/reportes',
        icon: 'feather icon-bar-chart-2',
        classes: 'nav-item',
        roles: ['ADMINISTRADOR', 'ADMIN']
      },
    ]
  },  
];
