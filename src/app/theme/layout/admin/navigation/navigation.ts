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
    id: 'principal',
    title: 'Principal',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'inicio',
        title: 'Inicio',
        type: 'item',
        url: '/inicio',
        icon: 'feather icon-home',
        classes: 'nav-item',
        exactMatch: true
      }
    ]
  },
  {
    id: 'gestion',
    title: 'Módulos de gestión',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'usuarios',
        title: 'Usuarios',
        type: 'item',
        url: '/inicio/usuarios',
        icon: 'feather icon-user',
        classes: 'nav-item'
      },
      {
        id: 'clientes',
        title: 'Clientes',
        type: 'item',
        url: '/inicio/clientes',
        icon: 'feather icon-user-check',
        classes: 'nav-item'
      },
      {
        id: 'mascotas',
        title: 'Mascotas',
        type: 'item',
        url: '/inicio/mascotas',
        icon: 'feather icon-heart',
        classes: 'nav-item'
      },
      {
        id: 'razas',
        title: 'Razas',
        type: 'item',
        url: '/inicio/razas',
        icon: 'feather icon-tag',
        classes: 'nav-item'
      },
      {
        id: 'medicos',
        title: 'Médicos',
        type: 'item',
        url: '/inicio/medicos',
        icon: 'feather icon-users',
        classes: 'nav-item'
      },
      {
        id: 'especializaciones',
        title: 'Especializaciones',
        type: 'item',
        url: '/inicio/especializaciones',
        icon: 'feather icon-award',
        classes: 'nav-item'
      },
      {
        id: 'medicamentos',
        title: 'Medicamentos',
        type: 'item',
        url: '/inicio/medicamentos',
        icon: 'feather icon-package',
        classes: 'nav-item'
      }
    ]
  }
];
