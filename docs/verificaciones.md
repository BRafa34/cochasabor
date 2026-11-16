# Verificaciones del frontend

Fecha: 13 de octubre de 2026. Todos los resultados siguientes corresponden al frontend con datos de demostración.

Actualización del 16 de noviembre de 2026: el usuario confirmó que importó `database/cochasabor.sql` en phpMyAdmin con MariaDB de XAMPP, y que las tablas y datos de demostración se cargaron correctamente. El backend Node.js/Express ya incluye endpoints de lectura, CRUD de reseñas/favoritos y autenticación/cuentas; la sintaxis JavaScript se comprobó, pero todavía no se ha ejecutado contra esa instancia. La autenticación necesita además crear la tabla `user_sessions` con el bloque aditivo del SQL. Por tanto, los resultados del frontend que aparecen abajo no verifican la conexión API/BD. Docker Compose se pospuso para reducir herramientas durante el aprendizaje inicial.

## Versiones efectivas

| Herramienta                              | Versión verificada |
| ---------------------------------------- | ------------------ |
| Angular framework, compiler, CLI y build | 22.2.2             |
| Node ejecutando los scripts npm          | 24.15.0            |
| npm                                      | 11.11.0            |
| TypeScript                               | 6.0.3              |
| RxJS                                     | 7.8.2              |
| Vitest                                   | 4.1.11             |
| Angular ESLint                           | 22.0.0             |
| ESLint                                   | 10.12.0            |

`strict`, `strictTemplates` y zoneless permanecen activados. No se añadió zone.js ni se rebajaron comprobaciones para pasar la compilación.

## Comandos y resultados reales

| Verificación                                                        | Resultado                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Reinstalación `npm ci` desde el lockfile con Node compatible        | Correcta: 416 paquetes instalados; 0 vulnerabilidades reportadas |
| `npm run ng -- version` y `npm ls`                                  | Angular 22.2.2 y dependencias coherentes, sin peers inválidos    |
| `npm run lint`                                                      | Correcto, sin errores                                            |
| `npm test -- --watch=false` después de reinstalar                   | **19 pruebas aprobadas en 7 archivos**                           |
| `npm run build -- --configuration production` después de reinstalar | Correcto, sin advertencias de budgets                            |
| HTTP del servidor local y JSON                                      | Ambos respondieron 200                                           |

El entorno restringido bloqueó inicialmente escrituras temporales de Vitest y sockets loopback; las pruebas y el servidor se ejecutaron después con el permiso correspondiente. Estos bloqueos no se ocultaron cambiando tests ni desactivando strictness. El servidor de QA se detuvo al cerrar la revisión; se inicia de nuevo con `npm start`.

## Cobertura de comportamiento

- Contrato JSON: campos, relaciones de categorías, slugs únicos, reseña única por perfil/lugar, rechazo de rutas de medios inseguras y respuestas inválidas.
- Repositorio: carga compartida para solicitudes concurrentes, estado de carga hasta completar, error recuperable y reintento real con HttpTestingController.
- Catálogo: búsqueda sin tildes/mayúsculas, filtros combinados sin duplicar categorías múltiples, orden, página inválida/fuera de rango, vacío y promedio nulo sin reseñas.
- Formulario: espacios y longitud del comentario, calificación inválida/fractional y fotografía no admitida o superior a 5 MB.
- Persistencia: reseña y fotografía restauradas desde IndexedDB, rechazo de duplicados, favoritos recuperables y aislados por perfil; cierre de perfil oculta favoritos.
- Navegación: clic real catálogo → detalle → volver conservando filtros, guard con retorno a reseña y 404 con salida útil. El retorno usa UrlTree para conservar los query params en el enlace.

## Recorridos comprobados en navegador

1. Inicio → buscar `CAFE` → categoría Restaurantes → Café del Patio → cambiar fotografía → regresar: se conserva búsqueda y categoría, con un resultado.
2. Guardar sin perfil → acceso QA → retorno y favorito marcado → colección → recarga: favorito conservado. Quitar → recarga: colección vacía.
3. Enviar formulario vacío → errores asociados; seleccionar estrellas mediante teclado → comentar → adjuntar WebP de prueba → ver preview → publicar → recargar: comentario y fotografía conservados. La fotografía se decodifica correctamente (`naturalWidth > 0`).
4. Tras esa reseña, el café muestra **4,7 de 5 · 3 reseñas** en detalle, favoritos y tarjeta de inicio. El formulario identifica que ya existe una reseña de ese perfil.
5. Video con controles: reproducción iniciada por teclado, duración 6 segundos, sin error del elemento multimedia. Sin autoplay y con descripción/subtítulos locales.
6. Menú móvil abre/cierra y navega; logout del perfil QA vuelve al inicio. Se usó localhost para separar el almacenamiento de la vista del usuario en 127.0.0.1.
7. Consola revisada tras las correcciones finales: sin nuevos errores ni advertencias. Se corrigieron proporciones usando fill y la prioridad de la primera imagen de catálogo/favoritos.

## Revisión responsive y visual

| Viewport comprobado | Columnas del listado | Desbordamiento horizontal |
| ------------------- | -------------------- | ------------------------- |
| 360 px              | 1                    | No                        |
| 768 px              | 2                    | No                        |
| 1024 px             | 2                    | No                        |
| 1440 px             | 3                    | No                        |

Se revisaron capturas de inicio, catálogo, detalle y formulario. Las capturas quedan en `docs/screenshots/`; hay evidencia móvil de la reseña y su foto. Menú móvil, controles nativos, selector de estrellas por flechas y mensajes de validación fueron comprobados. La revisión no equivale a una auditoría WCAG completa con lector de pantalla.

Contrastes calculados para tokens planos:

| Combinación                          | Ratio   |
| ------------------------------------ | ------- |
| Texto #202923 sobre crema #faf8f2    | 14,10:1 |
| Texto secundario #626861 sobre crema | 5,38:1  |
| Blanco sobre terracota #a43f29       | 6,32:1  |
| Blanco sobre verde #245c42           | 7,82:1  |
| Borde de campos #848b7e sobre blanco | 3,51:1  |

## Peso y carga

- Bundle inicial de producción: **310,24 kB raw**, **85,83 kB de transferencia estimada por Angular CLI**. Las funcionalidades se cargan de forma diferida.
- Budgets originales conservados: inicial 500 kB warning/1 MB error; estilos de componente 4/8 kB. El hero se separó en un componente pequeño para cumplirlos sin elevar límites.
- Hero WebP: 423.688 bytes (413,8 KiB), por debajo de 500 KB.
- Fotografía mayor utilizada en tarjetas: paisaje, 158.598 bytes (154,9 KiB), por debajo de 200 KB. Resto de imágenes de tarjeta: 33,8–131,0 KiB.
- Clip MP4: 74.491 bytes, 6 segundos; carga de video aplazada hasta interacción.
- Imágenes fuera de pantalla con carga diferida y dimensiones/espacio reservados. Registro de tamaños y origen en `public/data/media-sources.json`.
- No se ejecutó Lighthouse ni se midieron métricas de campo/Core Web Vitals. El tamaño de transferencia indicado es una estimación del compilador, no una medición de usuarios reales.

## Pendiente fuera del alcance frontend

Integración Angular con el repositorio HTTP, detalles/medios completos en API, sesiones seguras, permisos de escritura, validación de archivos en servidor, transacciones y despliegue. La importación de BD fue confirmada por el usuario, pero no se probó desde el backend en este entorno. Ningún resultado anterior del frontend afirma validar estas integraciones.
