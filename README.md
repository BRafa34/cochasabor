# CochaSabor

Directorio gastronómico y turístico de Cochabamba, construido siguiendo [Agente.md](Agente.md). El frontend usa Angular **22.2.2**, standalone, zoneless, TypeScript estricto, Signals, SCSS y rutas con carga diferida. La base relacional usa MariaDB de XAMPP; el backend Node.js/Express está en su etapa inicial de lectura.

## Ejecutar

Desde esta carpeta:

```powershell
npm ci
npm start
```

Abrir [CochaSabor local](http://localhost:4200). Detener con Ctrl+C. Para permitir el acceso solo por loopback explícito: `npm start -- --host 127.0.0.1 --port 4200`.

Usar Node `^22.22.3 || ^24.15.0 || >=26.0.0`. El proyecto incluye Node **24.15.0** como dependencia de desarrollo para que los scripts npm utilicen un runtime compatible sin cambiar la instalación global. Si el Node global es más antiguo, npm puede advertirlo durante `npm ci`; actualizarlo a una versión compatible es recomendable. La versión efectiva de los scripts se comprueba con `npm run ng -- version`.

## Qué incluye

- Inicio con buscador, categorías, selección de lugares y navegación móvil.
- Catálogo con búsqueda sin distinción de tildes/mayúsculas, filtros combinados, ordenamiento y paginación. La URL conserva `q`, `categoria`, `orden` y `pagina`.
- Detalle con información práctica, fotografías, galería por botones, video local de ejemplo y reseñas paginadas.
- Perfil ficticio local, retorno a la acción original y guard de reseñas/favoritos.
- Formulario reactivo: estrellas por teclado, comentario de 10–1000 caracteres, fotografía de prueba JPG/PNG/WebP de hasta 5 MB, vista previa y manejo de errores.
- Reseñas/fotos recuperables al recargar, promedios compartidos y una reseña por perfil/lugar.
- Favoritos guardados por perfil, sincronizados en inicio, catálogo, detalle y colección.
- Carga, error con reintento, catálogo vacío, lugar inexistente y página 404.

## Datos y límites de la demostración

La fuente inicial es [public/data/directory.json](public/data/directory.json): 8 lugares ficticios, 4 categorías y reseñas de visitantes ficticios. Los lugares, direcciones, horarios y precios son **simulados**, y las fotografías son **ilustrativas**. Para cambiar el contenido, editar este JSON respetando los contratos de `src/app/domains`.

El perfil y los favoritos se guardan en localStorage. Reseñas y fotografías de prueba, en IndexedDB (`cochasabor-demo`). Usar nombres y fotos ficticios. Volver a entrar con el mismo nombre recupera el mismo perfil. Este acceso **no es autenticación real**; no hay correos, contraseñas ni tokens.

El origen forma parte del almacenamiento: `localhost:4200` y `127.0.0.1:4200` tienen datos locales diferentes. Las pruebas de navegador se realizaron en localhost con un perfil QA para preservar los datos del origen 127.0.0.1.

El frontend todavía usa JSON y almacenamiento local de demostración; no está conectado a la API. El backend ya incluye autenticación con cookie y gestión de la cuenta propia, pero el frontend aún no utiliza esos endpoints ni sube datos. El usuario confirmó que el script SQL de [database/cochasabor.sql](database/cochasabor.sql) se importó en XAMPP/phpMyAdmin con las tablas y datos demo. La API en `server/` ofrece conexión a MariaDB, categorías, lugares, cuentas y reseñas; su instalación y uso se describen abajo. La aplicación no cambia silenciosamente a datos falsos ante un error.

## Base de datos

La base `cochasabor` ya se importó según la confirmación del usuario. Para una instalación nueva, inicia MariaDB (rotulado **MySQL** en algunas versiones de XAMPP) y abre phpMyAdmin. En **Importar**, selecciona y ejecuta [database/cochasabor.sql](database/cochasabor.sql). El script crea las tablas, triggers y los datos mínimos de demostración.

## API inicial

Requiere Node.js compatible y MariaDB iniciado en XAMPP. En una terminal, desde `server/`:

```powershell
npm ci
Copy-Item .env.example .env
```

Edita `server/.env` con las credenciales locales de MariaDB. Luego inicia el servidor:

```powershell
npm run dev
```

La API escucha por defecto en `http://localhost:3000`. Incluye salud, categorías, lugares, autenticación/cuentas, CRUD de reseñas y favoritos documentados en [docs/api.md](docs/api.md). Para activar autenticación en la base ya importada, ejecuta únicamente el bloque `CREATE TABLE IF NOT EXISTS user_sessions` de `database/cochasabor.sql` desde phpMyAdmin. No vuelvas a importar el archivo completo. Al llamar a la API desde Angular, las solicitudes de sesión deberán usar credenciales (`withCredentials`). No usamos proxy. CORS se activa solo si `API_ORIGIN` y alguno de los orígenes en `CORS_ORIGINS` son distintos; los puertos actuales de Angular (4200) y Express (3000) sí los hacen distintos. La respuesta aún no cubre todos los campos visuales del frontend y Angular sigue usando el JSON demo.

## Validación

```powershell
npm run ng -- version
npm run lint
npm test -- --watch=false
npm run build -- --configuration production
```

El build se genera en `dist/cochasabor/browser`. No abrir `index.html` con `file://`: Angular y el JSON deben servirse por HTTP. En un futuro alojamiento estático, configurar la reescritura de rutas desconocidas hacia `index.html`, conservando archivos `/data` y `/media` sin reescribirlos. Esto permite recargar `/lugares/cafe-del-patio` y otras rutas de la SPA.

## Multimedia y mantenimiento

Las imágenes WebP están incluidas en `public/media`; no se necesita conexión a servicios de imágenes para ejecutar el frontend. Sus URLs, licencia y pesos están documentados en [media-sources.json](public/data/media-sources.json). La licencia de las fotografías originales es [Unsplash](https://unsplash.com/license).

El clip de café dura 6 segundos, no tiene audio, usa controles y no se reproduce automáticamente. Se generó a partir de una fotografía ilustrativa. Para regenerarlo: `node scripts/create-demo-video.mjs` (usa ffmpeg-static instalado como herramienta de desarrollo). Para volver a descargar las imágenes con sus parámetros registrados: `node scripts/download-media.mjs` (requiere conexión).

Para formatear: `npm run format`. No elevar budgets ni desactivar strictness para ocultar fallos. Mantener el lockfile y usar `npm ci` al instalar.

## Documentación

- [Requisitos y alcance](docs/requisitos.md)
- [Decisiones](docs/decisiones.md)
- [Arquitectura y diagrama de referencia](docs/arquitectura.md)
- [Contrato de datos y API](docs/api.md)
- [Script SQL de base de datos MariaDB / MySQL](database/cochasabor.sql)
- [Avance por módulos](docs/avance.md)
- [Resultados y límites de verificación](docs/verificaciones.md)
- Capturas del inicio, catálogo, detalle, formulario y reseña: `docs/screenshots/`.
