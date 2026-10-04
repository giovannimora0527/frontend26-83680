# Entrega individual — Menús y enrutamiento

**Rama sugerida:** `feature/menu-rutas-juan_casallas`

## Desarrollo realizado

- Organización del menú principal y del menú de módulos de gestión.
- Enrutamiento individual para cada entidad.
- Rutas implementadas:
  - `/inicio/usuarios`
  - `/inicio/clientes`
  - `/inicio/mascotas`
  - `/inicio/razas`
  - `/inicio/medicos`
  - `/inicio/especializaciones`
  - `/inicio/medicamentos`
- Cada opción del menú apunta directamente al componente correspondiente.
- Se incorporaron vistas identificables para los módulos que anteriormente solo mostraban `works!`.

## Evidencia para Git

Al finalizar la prueba local, realizar el commit y publicar esta versión en la rama individual:

```bash
git checkout -b feature/menu-rutas-juan_casallas
git add .
git commit -m "feat: implementar menu y rutas de modulos de gestion"
git push -u origin feature/menu-rutas-juan_casallas
```

> La rama y el commit deben corresponder al usuario que realizará la entrega.
