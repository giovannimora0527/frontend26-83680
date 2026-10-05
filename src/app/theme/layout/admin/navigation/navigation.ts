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
        classes: 'nav-item'
      },
      {
        id: 'mascotas',
        title: 'Gestión de Mascotas',
        type: 'item',
        url: '/inicio/mascotas',
        icon: 'feather icon-user',
        classes: 'nav-item'
      },
      /* ---------- Nuevos menus aqui -------------  */ 
      {
        id: 'medicos',
        title: 'Gestión de Medicos',
        type: 'item',
        url: '/inicio/medicos',
        icon: 'feather icon-users',
        classes: 'nav-item'
      },
      {
        id: 'clientes',
        title: 'Gestión de Clientes',
        type: 'item',
        url: '/inicio/clientes',
        icon: 'feather icon-user-check',
        classes: 'nav-item'
      },
      {
        id: 'razas',
        title: 'Gestión de Razas',
        type: 'item',
        url: '/inicio/razas',
        icon: 'feather icon-tag',
        classes: 'nav-item'
      },
      {
        id: 'especializaciones',
        title: 'Gestión de Especializaciones',
        type: 'item',
        url: '/inicio/especializaciones',
        icon: 'feather icon-award',
        classes: 'nav-item'
      },
      {
        id: 'medicamentos',
        title: 'Gestión de Medicamentos',
        type: 'item',
        url: '/inicio/medicamentos',
        icon: 'feather icon-package',
        classes: 'nav-item'
      },
    ]
  },  
];
