# Frontend

Aplicación Angular 19 de la clínica. Las instrucciones para levantar todo el proyecto están en el [README principal](../README.md).

```bash
npm install
npx ng serve     # http://localhost:4200, con proxy de /clinica/v1 hacia localhost:8080
npx ng build     # genera dist/frontend, que es lo que sirve nginx en Docker
```
