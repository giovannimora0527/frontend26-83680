import { getJwtMenus, getJwtPayload } from 'src/app/utils/jwt.util';
import { rolPuedeAcceder } from 'src/app/constants/role-permissions';

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
        id: 'citas',
        title: 'Gestión de Citas',
        type: 'item',
        url: '/inicio/citas',
        icon: 'bi bi-calendar',
        classes: 'nav-item'
      },
      {
        id: 'clientes',
        title: 'Gestión de Clientes',
        type: 'item',
        url: '/inicio/clientes',
        icon: 'bi bi-person-check',
        classes: 'nav-item'
      },
      {
        id: 'especializaciones',
        title: 'Gestión de Especializaciones',
        type: 'item',
        url: '/inicio/especializaciones',
        icon: 'fa-solid fa-user-graduate',
        classes: 'nav-item'
      },
      {
        id: 'formulas',
        title: 'Gestión de Formulas',
        type: 'item',
        url: '/inicio/formulas',
        icon: 'fa-solid fa-clipboard-list',
        classes: 'nav-item'
      },
      {
        id: 'historias',
        title: 'Gestión de Historias',
        type: 'item',
        url: '/inicio/historias',
        icon: 'fa-solid fa-book-medical',
        classes: 'nav-item'
      },
      {
        id: 'mascotas',
        title: 'Gestión de Mascotas',
        type: 'item',
        url: '/inicio/mascotas',
        icon: 'fa-solid fa-paw',
        classes: 'nav-item'
      },
      {
        id: 'medicamentos',
        title: 'Gestión de Medicamentos',
        type: 'item',
        url: '/inicio/medicamentos',
        icon: 'fa-solid fa-capsules',
        classes: 'nav-item'
      },
      {
        id: 'medicos',
        title: 'Gestión de Medicos',
        type: 'item',
        url: '/inicio/medicos',
        icon: 'fa-solid fa-user-doctor',
        classes: 'nav-item'
      },
      {
        id: 'usuarios',
        title: 'Gestión de Usuarios',
        type: 'item',
        url: '/inicio/usuarios',
        icon: 'feather icon-users',
        classes: 'nav-item'
      },
      {
        id: 'razas',
        title: 'Gestión de Razas',
        type: 'item',
        url: '/inicio/razas',
        icon: 'fa-solid fa-paw',
        classes: 'nav-item'
      },
      {
        id: 'tarifas',
        title: 'Gestión de Tarifas',
        type: 'item',
        url: '/inicio/tarifas',
        icon: 'fa-solid fa-dollar-sign',
        classes: 'nav-item'
      },
      {
        id: 'atencion',
        title: 'Atención Médica',
        type: 'item',
        url: '/inicio/atencion',
        icon: 'fa-solid fa-stethoscope',
        classes: 'nav-item'
      },
      {
        id: 'facturas',
        title: 'Facturación',
        type: 'item',
        url: '/inicio/facturas',
        icon: 'fa-solid fa-file-invoice-dollar',
        classes: 'nav-item'
      },
      {
        id: 'despachos',
        title: 'Despacho de Medicamentos',
        type: 'item',
        url: '/inicio/despachos',
        icon: 'fa-solid fa-box-open',
        classes: 'nav-item'
      },
    ]
  },
];

export function getNavigationItems(): NavigationItem[] {
  const payload = getJwtPayload();
  if (!payload) return [];

  const rol = payload.rol;

  const filterItems = (items: NavigationItem[]): NavigationItem[] =>
    items.flatMap((item) => {
      if (item.type === 'item') {
        return rolPuedeAcceder(rol, item.id) ? [{ ...item }] : [];
      }

      const children = filterItems(item.children ?? []);
      return children.length > 0 ? [{ ...item, children }] : [];
    });

  return filterItems(NavigationItems);
}
