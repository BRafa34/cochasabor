# Contrato de datos e integración Angular–API

## Modo de demostración del frontend

`GET /data/directory.json` es un archivo estático, no una API. Devuelve `{ categories, places, reviews }`. Los tipos públicos están en `src/app/domains/places/places.ts` y `src/app/domains/reviews/reviews.ts`; `parseDirectory` verifica relaciones, duplicados, campos y rutas de medios antes de usarlos.

El filtrado devuelve `{ items, total, page, pageSize }` con 6 lugares por página. Categorías múltiples no duplican fichas. No hay endpoint de escritura: las mutaciones se guardan localmente y la interfaz informa de ese límite.

## API inicial implementada

Servidor independiente en `server/`, con prefijo `/api/v1`. `GET /api/v1/health` verifica conexión con MariaDB. `GET /api/v1/categories` devuelve `{ items }` con `id`, `slug`, `name` e `isActive`; `GET /api/v1/places` acepta `q`, `category`, `sort` (`rating` o `name`), `page` y `pageSize`, y devuelve `{ items, total, page, pageSize }`. Los elementos de lugar exponen campos persistidos en MariaDB, `categoryIds`, `ratingAverage` y `reviewCount`. El listado solo incluye lugares publicados y reseñas visibles.

### Autenticación y cuentas

| Método y ruta                | Función                                                    | Acceso                                              |
| ---------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| POST `/api/v1/auth/register` | Crea cuenta y asigna rol `MEMBER`; devuelve cuenta pública | Público, límite 5 por IP/hora                       |
| POST `/api/v1/auth/login`    | Verifica correo y contraseña; crea sesión cookie           | Público, límite 10 por IP/15 min                    |
| POST `/api/v1/auth/logout`   | Revoca sesión y limpia cookie; idempotente                 | Cookie opcional                                     |
| GET `/api/v1/auth/me`        | Devuelve la cuenta de la sesión                            | Sesión                                              |
| GET `/api/v1/accounts/me`    | Lee la cuenta propia                                       | Sesión                                              |
| PATCH `/api/v1/accounts/me`  | Actualiza nombre, correo o contraseña                      | Sesión; contraseña actual para cambiar correo/clave |
| DELETE `/api/v1/accounts/me` | Anonimiza la cuenta y revoca sesiones                      | Sesión y contraseña actual                          |

El registro espera `{ "email", "displayName", "password" }`. El nombre debe tener 1–120 caracteres, el correo ser válido y la contraseña al menos 12 caracteres y no más de 256 bytes. `PATCH` acepta `displayName`, `email`, `newPassword` y `currentPassword`; cambiar correo o contraseña exige la contraseña actual. La baja no borra reseñas ni historial: borra correo y hash, anonimiza el nombre y revoca sesiones.

La contraseña se guarda con scrypt y sal aleatoria; nunca se devuelve en respuestas. La sesión usa un token aleatorio en cookie `HttpOnly`, `SameSite=Lax`, con 30 minutos de inactividad y siete días de vencimiento absoluto. En producción la cookie también exige `Secure`. La base conserva únicamente el SHA-256 del token, con vencimiento y revocación. Las operaciones que cambian estado validan el origen del navegador.

La sesión necesita una tabla adicional `user_sessions`. Como la base ya está importada, ejecuta solamente el bloque `CREATE TABLE IF NOT EXISTS user_sessions` agregado en `database/cochasabor.sql`, desde la pestaña SQL de la base `cochasabor`; no vuelvas a importar el archivo entero.

Los límites de intentos y operaciones costosas de contraseña viven en memoria del proceso Node. Sirven para el servidor local de esta etapa; si luego se ejecuta más de una instancia, el límite de intentos deberá moverse a un almacén compartido.

### CRUD de reseñas

| Método y ruta                                         | Función                                      | Acceso      |
| ----------------------------------------------------- | -------------------------------------------- | ----------- |
| GET `/api/v1/places/:placeId/reviews?page=&pageSize=` | Lista reseñas visibles de un lugar publicado | Público     |
| GET `/api/v1/reviews?page=&pageSize=`                 | Lista reseñas visibles paginadas             | Público     |
| GET `/api/v1/reviews/:reviewId`                       | Lee una reseña visible                       | Público     |
| POST `/api/v1/places/:placeId/reviews`                | Crea `{ rating, comment }`                   | Sesión      |
| PUT `/api/v1/reviews/:reviewId`                       | Reemplaza `{ rating, comment }`              | Propietario |
| PATCH `/api/v1/reviews/:reviewId`                     | Actualiza `rating` y/o `comment`             | Propietario |
| DELETE `/api/v1/reviews/:reviewId`                    | Oculta la reseña y conserva su historial     | Propietario |

Calificación: entero de 1 a 5. Comentario: 10 a 1000 caracteres. La base permite una reseña por cuenta y lugar; un duplicado devuelve 409. Las operaciones de escritura usan transacciones y preparan `@cochasabor_user_id` para que el trigger registre al actor en `review_history`.

Las escrituras de reseñas requieren una sesión y solo permiten crear/editar/ocultar las reseñas de esa cuenta. Para crear se envía JSON como `{"rating":5,"comment":"Una experiencia muy agradable para compartir con amigos."}` a `POST /api/v1/places/1/reviews`. `PUT` requiere ambos campos; `PATCH` permite enviar uno o los dos. Un borrado lógico correcto responde `204 No Content`.

### Favoritos

| Método y ruta                          | Función                                                  | Acceso |
| -------------------------------------- | -------------------------------------------------------- | ------ |
| GET `/api/v1/me/favorites`             | Devuelve `{ items }` con lugares guardados por la sesión | Sesión |
| PUT `/api/v1/me/favorites/:placeId`    | Guarda el lugar; repetirlo es idempotente                | Sesión |
| DELETE `/api/v1/me/favorites/:placeId` | Quita el lugar; repetirlo también es idempotente         | Sesión |

Cada consulta usa el ID de la cuenta autenticada en el servidor; el cliente no puede leer ni modificar la colección de otra cuenta. Solo se guardan lugares publicados. Un lugar inexistente u oculto devuelve 404 al guardarlo; quitar un favorito inexistente responde `204 No Content`.

### Asistente del sitio

| Método y ruta       | Función                                 | Acceso                                                      |
| ------------------- | --------------------------------------- | ----------------------------------------------------------- |
| POST `/api/v1/chat` | Recibe `{ "messages": [{ "role": "user" | "assistant", "content": "..." }] }`y devuelve`{ "answer" }` | Público; 12 solicitudes por IP/minuto |

El endpoint consulta el catálogo publicado para formar contexto y envía la conversación reciente junto con el contexto del sitio a Ollama local. Usa `OLLAMA_URL` (por defecto `http://127.0.0.1:11434`) y `OLLAMA_MODEL` (por defecto `gemma3:4b`), solicita respuesta JSON sin streaming y restringe respuestas al contenido y navegación de CochaSabor. Las preguntas sobre las funciones del asistente (“¿qué cosas puedes hacer?”, “¿cómo me puedes ayudar?”) reciben una explicación fija de las funciones del sitio y no dependen de la clasificación del modelo. Acepta hasta 8 mensajes, 700 caracteres por mensaje y 3000 caracteres acumulados. Las preguntas ajenas o no respaldadas reciben una respuesta fija de abstención. No requiere cuenta ni guarda el historial.

El botón flotante del asistente está disponible en ambos modos. Las preguntas se procesan en Express y Ollama; el navegador no se conecta directamente al puerto de Ollama.

Para instalar Ollama, descargar `gemma3:4b` e iniciar la aplicación local, sigue la [guía paso a paso](chatbot-ollama.md).

La integración Angular–API está disponible mediante el botón temporal “Ver API” del encabezado; “Ver demo local” vuelve al flujo anterior. El modo elegido se conserva en este navegador. El adaptador toma categorías, lugares y reseñas del backend. El SQL de lugares también consulta imagen, galería, video y horarios si hay filas en `media` y `place_opening_hours`; cuando faltan esos registros, Angular completa solo la presentación con `public/data/directory.json`, buscando por `slug`. Los datos sustantivos del lugar y las reseñas siguen procediendo de MariaDB. Precios nulos y el indicador de destacado también usan el JSON demo porque no existen en la respuesta persistida.

El modo demo conserva su JSON, perfiles, reseñas con foto en IndexedDB y favoritos en localStorage. El modo API usa cookie de sesión, cuentas reales, reseñas y favoritos del servidor; no copia las reseñas demo ni sus favoritos a la base. La reseña API todavía no acepta fotografía.

## Orígenes del frontend y la API

La integración no usa proxy. Si el navegador consume la API directamente y Angular y Express tienen distinto protocolo, host o puerto, Express permitirá el origen de Angular mediante CORS. El middleware solo se instala si `CORS_ORIGINS` contiene al menos un origen diferente de `API_ORIGIN`; si coinciden, CORS queda apagado. En desarrollo, Angular en `http://localhost:4200` y Express en `http://localhost:3000` son orígenes distintos, así que se autoriza el origen de Angular en `server/.env`. El frontend apunta a `http://localhost:3000/api/v1` en `src/app/core/config/api.ts`.

## Etapas posteriores del backend

Prefijo `/api/v1`. El repositorio seleccionable actual se provee en `app.config.ts` como implementación de `PlacesRepository`; los fallos API se muestran al usuario y no cambian automáticamente al modo demo. La estructura de Express, controladores, middlewares, modelos, rutas y conexión MariaDB mediante `mysql2/promise` está documentada en [arquitectura.md](arquitectura.md).

| Endpoint            | Request previsto | Response / error previsto                    |
| ------------------- | ---------------- | -------------------------------------------- |
| GET `/places/:slug` | Slug             | Lugar, categorías y medios; 404 si no existe |

El catálogo actual carga el directorio desde la API y aplica búsqueda, categoría, orden y paginación en Angular; una optimización posterior podría trasladar esos filtros al servidor y añadir el detalle por slug. El backend obtiene el usuario autenticado desde la sesión, valida calificación 1–5 y comentario 10–1000, aplica permisos y confirma las escrituras de reseñas con transacciones. En el contrato actual la reseña de API no admite fotos; las fotos se conservan en modo demo. El promedio se calcula desde reseñas visibles y es `null` cuando no existen.
