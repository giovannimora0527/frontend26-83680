# Revisión frente a la referencia visual del docente

## Decisión de integración

Se conserva como proyecto principal esta entrega porque incluye `frontend/package.json`, `frontend/angular.json`, `backend/pom.xml`, configuración de entorno, API REST, base de datos y documentación. El ZIP del compañero aporta una implementación alternativa de las pantallas transaccionales y algunos patrones útiles, pero el archivo recibido no contiene `package.json` ni `pom.xml`; además, su `app-routing.module.ts` tiene una coma faltante después de la ruta `medicamentos`, por lo que no es autocontenido ni conviene reemplazar el proyecto completo con él.

Se tomaron como referencia sus ideas de tablas con ordenamiento, paginación, formularios y estados, sin copiar sus rutas de API porque difieren de los endpoints de esta base.

## Ajustes visuales aplicados a Gestión de citas

- Fondo general azul grisáceo claro y tarjeta de contenido blanca.
- Tabla con encabezado claro, filas alternas y bordes suaves.
- Botón `Nueva cita` alineado a la derecha.
- Columnas y orden visual similares a la captura del docente: Mascota, Médico, Fecha y hora, Motivo, Estado y Acciones.
- Etiquetas de estado por color.
- Acciones `Ver` y `Editar`; el detalle abre un modal de solo lectura.
- Se conservan búsqueda, filtro por estado, rango de fechas, ordenamiento y paginación.
- Se conserva la restricción de interfaz para no editar citas canceladas o atendidas; el backend también aplica reglas de negocio.

## Validación pendiente antes de entregar

La edición de archivos y el empaquetado no sustituyen una prueba local. En el computador del grupo se debe ejecutar:

1. Backend: `mvn clean test` y luego `mvn spring-boot:run`.
2. Frontend: `npm ci`, `npm run build` y `npm start`.
3. Verificar el CRUD y las reglas contra una base de datos de pruebas, no contra información de producción.
4. Confirmar que la migración SQL se ejecute una sola vez sobre el esquema correcto.

No se declara compilación integral verificada en este paquete.
