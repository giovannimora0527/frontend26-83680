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

/**
 * Arma el menu lateral con los menus que el backend asigno al perfil del usuario
 * (tablas menu y perfil_menu). Si no hay sesion devuelve el menu vacio.
 */
export function construirNavegacion(): NavigationItem[] {
  let menus: { code: string; title: string; url: string; icon: string }[] = [];
  try {
    menus = JSON.parse(localStorage.getItem('sesion') ?? '{}').menus ?? [];
  } catch {
    menus = [];
  }
  return [
    {
      id: 'navigation',
      title: 'Menú',
      type: 'group',
      icon: 'icon-navigation',
      children: menus.map((m) => ({
        id: m.code,
        title: m.title,
        type: 'item' as const,
        url: m.url,
        icon: m.icon,
        classes: 'nav-item'
      }))
    }
  ];
}
