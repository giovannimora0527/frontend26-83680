[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Price](https://img.shields.io/badge/price-FREE-0098f7.svg)](https://codedthemes.com/item/datta-able-angular-lite/)
[![GitHub package version](https://img.shields.io/github/package-json/v/codedthemes/datta-able-free-angular-admin-template)](https://github.com/codedthemes/datta-able-free-angular-admin-template/)

| -------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **9** Demo pages                                                                                   | **45+** demo pages                                                |
| -                                                                                                  | ✓ Multi-language                                                  |
| -                                                                                                  | ✓ Dark/Light Mode 🌓                                              |
| -                                                                                                  | ✓ TypeScript version                                              |
| -                                                                                                  | ✓ 6+ color Options                                                |
| -                                                                                                  | ✓ RTL                                                             |
| ✓ MIT License                                                                                      | ✓ [Pro License](https://codedthemes.com/item/datta-able-angular/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium) |

#### Preview

- [Demo](https://codedthemes.com/demos/admin-templates/datta-able/angular/free/dashboard)

#### Download

- [Download from GitHub](https://github.com/codedthemes/datta-able-free-angular-admin-template)

## Datta Able Pro version

#### Preview

- [Demo](https://codedthemes.com/demos/admin-templates/datta-able/angular/default/)

#### Purchase

- [Purchase from CodedThemes](https://codedthemes.com/item/datta-able-angular/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium)

## Table of contents

- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Technology Stack](#technology-stack)
- [Author](#author)
- [Issues?](#issues)
- [License](#license)
- [More Free Angular Templates](#more-free-angular-dashboard-templates)
- [More Pro Angular Templates](#more-premium-angular-dashboard-templates)
- [Follow us](#follow-us)

## Getting Started

1. Clone from Github

```
git clone https://github.com/codedthemes/datta-able-free-angular-admin-template.git
```

2. Install packages

```
yarn
```

3. Run project

```
yarn start
```

## Documentation

[Datta Able Angular Documentation](https://codedthemes.gitbook.io/datta-angular/) helps you with installation, deployment, and troubleshooting.

### JWT y menus de navegacion

- `getJwtPayload()` en `src/app/utils/jwt.util.ts` lee `sessionStorage['token']`
  y devuelve `{ sub, username, email, rol, menus, iat, exp }`. Devuelve `null`
  si no hay token y lanza un error si su formato o contenido no es valido.
- `getJwtMenus()` convierte el campo `menus` (JSON serializado) en un arreglo
  tipado. Un contenido invalido lanza un error; sin token devuelve `[]`.
- `getNavigationItems()` en `navigation.ts` filtra el catalogo `NavigationItems`
  por `id === code` y `activo === true`, conservando el orden, rutas e iconos
  locales. Elimina grupos vacios y no modifica el catalogo original. Se ejecuta
  al construir la barra lateral y los breadcrumbs, no al importar el modulo.
  Sin token no muestra menus; ante datos invalidos registra el error y tampoco
  muestra menus.

Esta utilidad solo decodifica el JWT; no valida su firma ni su expiracion.
La clave secreta no debe incluirse en el frontend. La autorizacion y validacion
del token deben realizarse en el backend; ocultar menus no protege las rutas ni
los endpoints.

## Technology Stack

- Bootstrap 5
- Angular 18

## Author

Datta Able is developed by Team [CodedThemes](https://codedthemes.com).

## Issues

To report a bug, please submit an [issue](https://github.com/codedthemes/datta-able-free-angular-admin-template/issues) on Github. We will respond as soon as possible to resolve the issue.

## License

- Licensed cover under [MIT](https://github.com/codedthemes/datta-able-free-angular-admin-template/blob/master/LICENSE)

## Datta Able - React version

- [Free](https://lite.codedthemes.com/datta-able/react/default/dashboard/default)
- [Premium](https://codedthemes.com/item/datta-able-react-admin-template/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium)

## More Free Angular Dashboard Templates

- [Mantis Angular](https://codedthemes.com/item/mantis-angular-free-admin-template/)
- [Gradient Able Angular](https://codedthemes.com/item/gradient-able-angular-free-admin-template/)
- [Next Angular](https://codedthemes.com/item/next-free-admin-template/)
- [Berry Angular](https://codedthemes.com/item/berry-angular-free-admin-template/)

## More Premium Angular Dashboard Templates

- [Mantis Angular Pro](https://codedthemes.com/item/mantis-angular-admin-template/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium)
- [Gradient Able Angular Pro](https://codedthemes.com/item/gradient-able-angular-admin-template/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium)
- [Next Angular Pro](https://codedthemes.com/item/next-angular-admin-template/)
- [Berry Angular Pro](https://codedthemes.com/item/berry-angular-admin-dashboard-template/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium)

## Follow us

- Website [https://codedthemes.com/demos/admin-templates/datta-able/angular/default](https://codedthemes.com/demos/admin-templates/datta-able/angular/default)
- Blog [https://blog.codedthemes.com/](https://blog.codedthemes.com/)
- CodedThemes [https://codedthemes.com](https://codedthemes.com)
- Dribbble [https://dribbble.com/codedthemes](https://dribbble.com/codedthemes)
- Facebook [https://www.facebook.com/codedthemes](https://www.facebook.com/codedthemes)
- Twitter [https://twitter.com/codedthemes](https://twitter.com/codedthemes)
