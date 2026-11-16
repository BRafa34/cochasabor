# Arquitectura de COCHASABOR

## Organización del repositorio

COCHASABOR es **un solo repositorio con dos aplicaciones**: el frontend Angular en la raíz y la API Node.js/Express dentro de `server/`. Cada aplicación conserva su código, dependencias y comandos. La base de datos y su script SQL quedan en `database/`.

```text
CochaSabor/
  src/                         # Frontend Angular
    app/
    styles/
    main.ts
  public/                      # JSON e imágenes de demostración
  database/
    cochasabor.sql             # Esquema, triggers y datos iniciales MariaDB
  server/                      # Backend Express dentro del mismo repositorio
    src/
      config/
        database.js            # Pool mysql2/promise y conexión MariaDB
      controllers/             # Coordinan la solicitud y la respuesta
      middlewares/              # Autenticación por sesión, origen y errores
      models/                   # Consultas SQL preparadas
      routes/                   # Rutas HTTP
      app.js                    # Configuración de Express
      index.js                  # Inicio y cierre del servidor/pool
    .env.example                # Variables de ejemplo, sin contraseñas reales
    .gitignore                  # Excluye .env y node_modules del backend
    package.json                # Dependencias y comandos de la API
  docs/
  package.json                 # Dependencias y comandos del frontend
```

El `src/` de la raíz pertenece a Angular; `server/src/` pertenece a Express. No se mezclan ni se reemplazan. La carpeta `database/` es compartida como contrato de persistencia, pero el navegador nunca se conecta directamente a MariaDB: solo el backend contiene las credenciales y ejecuta SQL.

## Estado actual

La base MariaDB de XAMPP se importó en phpMyAdmin y el usuario confirmó la creación de las tablas y la carga de datos de demostración. La API Express tiene endpoint de salud, categorías, listado paginado de lugares, autenticación/cuentas con sesión en base de datos, CRUD de reseñas y favoritos por cuenta. Para las sesiones debe aplicarse el bloque aditivo de `user_sessions` en la base existente. Angular ya permite alternar temporalmente entre el repositorio JSON demo (que conserva perfiles, reseñas y favoritos locales) y el adaptador API. En modo API, las reseñas y favoritos se persisten con la sesión; la presentación visual faltante se completa desde el JSON por slug. La compilación pasó; la validación de ejecución contra XAMPP sigue pendiente.

En Angular, `core` mantiene el perfil local, `layout` contiene la navegación, `shared/ui` reúne presentación reusable, `domains` define contratos y acceso a datos del frontend, y `features` agrupa páginas. El repositorio HTTP futuro se conectará mediante esos contratos, sin importar módulos de Express ni SQL.

## Flujo de datos

```text
Angular en el navegador → API Express → MariaDB de XAMPP
```

Durante la integración las aplicaciones se inician por separado y **no se configura un proxy**. CORS se habilita en Express únicamente cuando la URL del frontend y la URL pública de la API tienen distinto origen. El origen incluye protocolo, nombre de host y puerto; por ejemplo `http://localhost:4200` y `http://localhost:3000` son distintos. `API_ORIGIN` declara el origen de la API y `CORS_ORIGINS` enumera los orígenes de frontend permitidos. Si ambos orígenes coinciden, Express no instala el middleware CORS. Si se cambia el host o puerto de Angular, actualizar la lista permitida.

La pertenencia a un solo repositorio no determina CORS. En el desarrollo actual Angular (`4200`) y Express (`3000`) tienen distinto origen; si el navegador llama directamente a la API, CORS debe permitir el origen exacto de Angular. No se usará proxy.

## Responsabilidades del backend

- `routes/` declara la URL y el método HTTP y los asocia con un controlador.
- `controllers/` valida parámetros de solicitud y arma la respuesta; no contiene SQL.
- `models/` ejecuta consultas preparadas sobre MariaDB y adapta filas al formato de la API.
- `middlewares/` centraliza errores y posteriormente validación, sesión y permisos.
- `config/database.js` crea el pool limitado con `mysql2/promise` desde variables de entorno.
- `app.js` configura Express, CORS condicional, rutas y errores; `index.js` carga `dotenv`, inicia el puerto y cierra el pool al terminar.

El backend usa `server/.env`, que no se versiona. `server/.env.example` enumera `PORT`, `API_ORIGIN`, `CORS_ORIGINS`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` sin incluir secretos. Las transacciones que cambian varias tablas usarán una sola conexión del pool.

## Límite de la primera API

Los endpoints actuales exponen datos persistidos: salud de la conexión, categorías y catálogo paginado. El contrato está en [api.md](api.md). Antes de cambiar Angular al repositorio HTTP se debe completar el mapeo de campos visuales del JSON demo que aún no están en MariaDB: iconos/descripciones de categorías, imágenes, galería, horarios, destacados y video.

El modelo entidad-relación y sus decisiones pendientes están en [diagrama-entidad-relacion.md](diagrama-entidad-relacion.md). El contenido ejecutable de la base está en `database/cochasabor.sql`.
