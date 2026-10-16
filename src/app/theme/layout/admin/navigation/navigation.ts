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
        id: 'clientes',
        title: 'Gestión de Clientes',
        type: 'item',
        url: '/inicio/clientes',
        icon: 'feather icon-user',
        classes: 'nav-item'
      },
      {
        id: 'mascotas',
        title: 'Gestión de Mascotas',
        type: 'item',
        url: '/inicio/mascotas',
        icon: 'bi bi-person-lines-fill',
        classes: 'nav-item'
      },
      /* ---------- Nuevos menus aqui -------------  */ 
      {
        id: 'medicos',
        title: 'Gestión de Médicos',
        type: 'item',
        url: '/inicio/medicos',
        icon: 'feather icon-users',
        classes: 'nav-item'
      },
      {
        id: 'citas',
        title: 'Gestión de Citas',
        type: 'item',
        url: '/inicio/citas',
        icon: 'feather icon-calendar',
        classes: 'nav-item'
      },
      {
        id: 'historias',
        title: 'Historias Clínicas',
        type: 'item',
        url: '/inicio/historias',
        icon: 'feather icon-file-text',
        classes: 'nav-item'
      },
      {
        id: 'formulas',
        title: 'Fórmulas Médicas',
        type: 'item',
        url: '/inicio/formulas',
        icon: 'feather icon-clipboard',
        classes: 'nav-item'
      },
    ]
  },  
];
