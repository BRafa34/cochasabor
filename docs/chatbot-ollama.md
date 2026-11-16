# Poner en marcha el chatbot con Ollama

El chatbot de CochaSabor ya está conectado de esta forma:

```text
Angular → POST http://localhost:3000/api/v1/chat → Express → Ollama en http://127.0.0.1:11434
                                                        ↘ contexto público de MariaDB
```

El navegador nunca llama directamente a Ollama. Express arma el contexto con las funciones del sitio y el catálogo publicado. No se necesita una tabla nueva ni iniciar sesión para usar el chat; MariaDB sí debe estar encendida para incluir los datos actuales del catálogo.

## 1. Instalar Ollama en Windows

1. Descarga el instalador desde [ollama.com/download/windows](https://ollama.com/download/windows) y ejecútalo.
2. Abre Ollama desde el menú Inicio. Deja la aplicación activa mientras uses el chatbot.
3. Cierra y vuelve a abrir PowerShell o la terminal de VS Code, y confirma la instalación:

```powershell
ollama --version
```

Si PowerShell dice que no reconoce `ollama`, vuelve a abrir la terminal después de instalar; si persiste, reinicia Windows y vuelve a comprobarlo.

## 2. Descargar Gemma 3

En PowerShell ejecuta:

```powershell
ollama pull gemma3:4b
```

El modelo ocupa aproximadamente 3,4 GB en la biblioteca de Ollama. Espera a que termine la descarga. Comprueba que quedó instalado:

```powershell
ollama list
```

Debe aparecer `gemma3:4b`. Para probarlo directamente:

```powershell
ollama run gemma3:4b
```

Escribe una pregunta y, para salir del chat de terminal, usa `Ctrl+C`.

## 3. Iniciar CochaSabor

1. En XAMPP, inicia **MySQL** (MariaDB).
2. Deja Ollama abierto.
3. En una terminal, inicia Express desde `server/`:

```powershell
cd "C:\Universidad\6to Semestre\Programacion Grafica y Multimedia\CochaSabor\server"
npm run dev
```

El archivo `server/.env.example` incluye `OLLAMA_URL=http://127.0.0.1:11434` y `OLLAMA_MODEL=gemma3:4b`. El servidor usa esos valores por defecto aunque no estén escritos en `server/.env`; si se cambian, reinicia Express.

4. En una segunda terminal, desde la carpeta principal del proyecto, inicia Angular:

```powershell
cd "C:\Universidad\6to Semestre\Programacion Grafica y Multimedia\CochaSabor"
npm start
```

5. Abre `http://localhost:4200` y usa el botón flotante **¿Dudas?**.

## 4. Comprobar el alcance

Prueba una pregunta del sitio, por ejemplo: “¿Cómo filtro los lugares por categoría?” o “¿Qué necesito para publicar una reseña?”. Luego pregunta algo ajeno a CochaSabor; el asistente debe responder con su mensaje de abstención.

La primera respuesta puede tardar más porque Ollama tiene que cargar el modelo en memoria. El endpoint acepta hasta 8 mensajes, limita el tamaño de las preguntas y aplica 12 solicitudes por IP por minuto.

## Si no responde

- `ollama list`: confirma que figure `gemma3:4b`.
- Comprueba que Ollama siga abierto. Express se conecta a `http://127.0.0.1:11434`.
- Comprueba que Express indique que escucha en el puerto `3000` y que MariaDB esté activa en XAMPP.
- Si cambiaste `OLLAMA_MODEL` o `OLLAMA_URL` en `server/.env`, reinicia Express.
- La cuenta, `user_sessions` y el modo API del frontend no son necesarios para el chatbot; sí lo es una conexión funcional de Express con MariaDB para que el contexto incluya lugares y categorías.

El endpoint y sus límites están descritos en [api.md](api.md).
