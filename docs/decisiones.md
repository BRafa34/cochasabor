# Decisiones de implementación

## 2026-10-13 · Frontend con JSON

- Se conserva `Agente.md` sin modificar. `AGENTS.md` la referencia y especifica el alcance autorizado por el usuario: solo frontend.
- Proyecto Angular SPA standalone, zoneless, rutas diferidas, TypeScript estricto, strictTemplates, Signals y formularios reactivos. Ninguna librería visual o de estado añadida.
- Framework, compiler, CLI y build fijados a **22.2.2**. Se comenzó con 22.0 para contrastar la matriz publicada; la auditoría señaló correcciones posteriores dentro de la mayor 22. La actualización mantiene paquetes coherentes y no usa `--force` ni `--legacy-peer-deps`.
- La [tabla oficial](https://angular.dev/reference/versions) disponible publica la fila 22.0.x. Para **22.2.2** se comprobaron también `engines` de CLI/build/compiler-cli y `peerDependencies` de compiler-cli/build directamente en npm: Node `^22.22.3 || ^24.15.0 || >=26.0.0`; TypeScript `>=6.0 <6.1`; RxJS admitido por core `^6.5.3 || ^7.4.0`.
- El equipo tenía Node 24.14.1, por debajo del mínimo. Se incluye Node 24.15.0 como dependencia de desarrollo local; los comandos npm ejecutan este runtime sin sustituir la instalación global. npm efectivo al preparar: 11.11.0. Versiones resueltas restantes y evidencias en `verificaciones.md` y el lockfile.
- Angular ESLint 22, ESLint 10 y TypeScript ESLint 8 para análisis estático; Prettier para formato. Vitest es el ejecutor generado por Angular CLI. fake-indexeddb sirve exclusivamente para las pruebas de persistencia.

## Datos, identidad y persistencia

- `PlacesRepository` es el contrato de lectura inyectable. `JsonPlacesRepository` carga y valida una única fuente de datos externa (`unknown` antes de adaptar).
- `DirectoryState` compone reseñas JSON/locales y deriva promedios; las tarjetas, el catálogo, los favoritos y el detalle consumen el mismo estado. Sin reseñas: promedio `null`, cantidad 0.
- Filtros persistentes en query params: `q`, `categoria`, `orden`, `pagina`. Se busca por envío explícito (sin solicitudes por tecla ni debounce innecesario); normalización sin distinción de tildes/mayúsculas. Página fuera de rango se ajusta al último resultado. Categoría u orden desconocidos vuelven al valor seguro.
- Perfiles ficticios y favoritos en localStorage. No se guardan credenciales ni se simula seguridad de sesión. Otro perfil no ve favoritos del anterior; cerrar el acceso oculta su colección.
- Reseñas y fotos de **prueba** en IndexedDB. El formulario informa que la fotografía se guarda en el navegador; no se trata como subida al servidor. Solo éxito al completar la transacción; duplicados rechazados. La foto se decodifica y recomprime a WebP de máximo 1200 px; URLs temporales se liberan.
- Contrato frontend para medios: rutas locales `/media/…`, sin traversal ni `javascript:`. Comentarios como texto; no HTML dinámico ni `bypassSecurityTrust`.
- No se añade un repositorio HTTP sin servidor para aparentar integración. Su sustitución por inyección será parte de M2 al autorizar backend; ver `api.md`.
- Backend: **no implementado por alcance directo**. La selección de tecnología, sesiones seguras, permisos y BD se hará en un encargo posterior.

## 2026-11-15 · Diseño conceptual de datos

- Se preparó [el diagrama entidad-relación](diagrama-entidad-relacion.md) sin implementar base de datos ni backend. El usuario autorizó el diseño; el alcance de código sigue siendo frontend.
- Lugares de aporte comunitario visibles al publicarse; reclamo/verificación de propiedad aparte. Requieren nombre, categoría, ubicación en mapa y descripción breve; datos de contacto, horarios, precio e imágenes opcionales. El equipo revisa reclamos.
- Reportes de lugares por cuentas, uno activo por cuenta/lugar y con el mismo peso. El umbral configurable oculta temporalmente y crea caso para el equipo; usuarios confiables pueden ocultar temporalmente. Equipo resuelve y queda historial.
- Reseñas: una por cuenta/lugar, editable y ocultable con historial. Un reporte activa evaluación de IA; infracción clara oculta, duda o apelación pasa al equipo. No se ha elegido proveedor de IA.
- Cuenta pública única, con permisos adicionales para usuarios confiables y equipo. Categorías mantenidas por el equipo; usuarios pueden proponer. Al borrar una cuenta, anonimizar y conservar el historial.
- Se documentan decisiones abiertas en el propio diagrama: umbral/ventana, fusión de duplicados, evidencia de propiedad, motivos de reporte, términos/IA y detalles de campos opcionales.

## 2026-11-15 · Actualización de alcance

- El frontend Angular 22 de demostración ya fue completado. La etapa vigente es implementar la base de datos relacional, migraciones y datos semilla.
- El backend se abordará después para conectar la base de datos con la web. En una etapa posterior se añadirá un chatbot limitado a preguntas sobre el sitio. No implementar backend ni chatbot durante la etapa actual.
- No desplegar. Ver el alcance vigente en `AGENTS.md`.
- Reportes: `PENDING` significa activo mientras no se retire ni se resuelva el caso; retirar cambia a `WITHDRAWN`, y resolver el caso cambia sus reportes a `RESOLVED`. Los estados cerrados se conservan, pero permiten reportar de nuevo el mismo objeto.
- Motivos: se permiten por tipo de objeto mediante una tabla puente, para admitir motivos exclusivos de lugar/reseña y motivos compartidos, bloqueando combinaciones incompatibles.
- Decisiones iniciales, posteriormente actualizadas el 16/11/2026: PostgreSQL 18 y luego MySQL 8.4 directo. La elección se ajustó a MariaDB al optar por XAMPP, manteniendo SQL compatible con MySQL.
- Se prepararon la migración inicial, semillas de referencia y ocho fichas/reseñas demo. Las demos quedan identificadas con `is_demo` y sin coordenadas inventadas. La ejecución quedó pendiente de preparar una base local; no se reporta como aplicada/verificada.

## 2026-11-16 · Alineación con el ejemplo del docente

- El usuario decidió seguir el flujo phpMyAdmin con XAMPP. XAMPP trae MariaDB en lugar del servidor MySQL; la base actual se alinea a MariaDB 10.11+, InnoDB y `utf8mb4`, manteniendo sintaxis compatible con MySQL.
- La propuesta para el backend futuro queda en `docs/arquitectura.md`: aplicación Node.js/Express con `mysql2/promise` y `dotenv`, separada en `config`, `controllers`, `middlewares`, `models` y `routes`, además de `app.js` e `index.js`. Se documenta, pero no se implementa en la etapa actual.
- Se pospone Docker Compose mientras se aprende el flujo local. La ejecución será con MariaDB iniciado desde XAMPP y phpMyAdmin. La base y las semillas todavía no se han ejecutado.
- Las reglas de unicidad condicional se expresan con columnas generadas e índices únicos MariaDB. La categoría obligatoria de cada lugar se validará en la transacción del backend, porque MariaDB no cuenta con los triggers diferidos que usaba el diseño PostgreSQL.
- La migración y semillas convertidas todavía requieren ejecución en la versión de MariaDB incluida en XAMPP para verificar compatibilidad efectiva; no declarar la base aplicada hasta hacerlo.

## 2026-11-16 · Script SQL único

- Por solicitud del usuario, se eliminó todo el contenido previo de `database/` (README, carpetas de migraciones, semillas y consultas) y se consolidó el esquema más los datos de demostración en `database/cochasabor.sql`.
- La carpeta `database/` debe contener únicamente ese archivo `.sql`. Las instrucciones de uso se mantienen en el README raíz y el estado/pendiente de ejecución en `docs/avance.md`.
- Esta decisión reemplaza el plan anterior de guardar migraciones, semillas y consultas en archivos separados.
- El script aún no se ha importado en XAMPP/phpMyAdmin; la base no se marca como ejecutada ni verificada.

## 2026-11-16 · Importación y arranque de API

- El usuario confirmó que `database/cochasabor.sql` se importó desde phpMyAdmin de XAMPP y que las tablas y datos demo se cargaron correctamente; el módulo M2 queda completado según esa confirmación.
- Se inicia la opción ya documentada: backend independiente Node.js/Express con `mysql2/promise` y `dotenv`; XAMPP mantiene MariaDB y Apache no es requisito para ejecutar la API Node.
- La primera etapa expone salud de conexión, categorías y listado público paginado. La integración Angular se pospone porque el contrato visual pide iconos, galerías, horarios y medios que no están completamente representados en los datos de BD.
- Frontend y backend quedan en un único repositorio, cada uno con su propio `package.json`: Angular en la raíz y Express en `server/`. No se usará proxy. CORS se activará en Express únicamente cuando el origen del frontend difiera del origen de la API; en los puertos locales actuales (4200 y 3000) son distintos.
- No se implementan todavía autenticación, escrituras, chatbot ni despliegue.

## 2026-11-16 · Autenticación y cuentas

- Se reemplazó la identidad demo temporal de reseñas por sesiones reales persistidas en MariaDB. Las cuentas se registran con rol `MEMBER`; los endpoints permiten iniciar/cerrar sesión, leer/editar la cuenta propia y solicitar su baja lógica.
- Las contraseñas se derivan con scrypt y sal aleatoria; la cookie de sesión es `HttpOnly`, `SameSite=Lax`, y `Secure` en producción. Se guarda en BD el hash del token, no el token. No se exponen hashes de contraseña.
- Se añade la tabla `user_sessions` al único script SQL. Para la base ya importada, se aplica solamente el bloque `CREATE TABLE IF NOT EXISTS user_sessions`; no se reimporta todo el script.
- La baja anonimiza correo/nombre y revoca sesiones, conservando reseñas e historial. Cambios de correo/contraseña y baja requieren confirmar la contraseña actual.
- El CRUD de reseñas ahora exige sesión y verifica propiedad. El borrado lógico mantiene el historial generado por el trigger.
- Favoritos usa la clave compuesta existente `(user_id, place_id)`: leer la colección solo de la sesión actual, guardar con `PUT` idempotente y quitar con `DELETE` idempotente. No requiere cambios de esquema.
- Las rutas aún no se han comprobado contra la instancia MariaDB local; la integración con Angular queda pendiente.

## Visual y multimedia

- Crema, terracota y verde, fuentes del sistema (Segoe UI/Georgia), sin peticiones externas de tipografía.
- Fotografías de Unsplash bajo su [licencia](https://unsplash.com/license), descargadas como WebP; registro exacto de URLs y tamaños en `public/data/media-sources.json`. Son imágenes ilustrativas, no fotografías de los establecimientos inventados ni evidencia de ubicaciones reales.
- Un clip local sin audio generado con ffmpeg a partir de la fotografía de café, con controles, poster, sin reproducción automática y alternativa textual/subtítulo. Script reproducible `scripts/create-demo-video.mjs`.
- Diseño adaptable con 1/2/3 columnas y menú móvil; botones nativos para galería (sin diálogo ni carrusel automático), radios nativos para rating y reducción de movimiento.
- No hay repositorio Git en esta carpeta. No se crearon commits ni se publicaron cambios fuera del equipo.
