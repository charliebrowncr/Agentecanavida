# Publicar en Netlify con reservas reales de Lodgify

Netlify Drop (arrastrar carpeta) **no** ejecuta funciones; use GitHub (recomendado) o Netlify CLI.

## 1. Llave de Lodgify
Lodgify → **Settings → Public API** → copiar la llave (no disponible en plan Starter).

## 2. Subir el proyecto a GitHub
Descargue este proyecto y suba todos los archivos al repo `charliebrowncr/Agentecanavida` (incluye `netlify.toml` y `netlify/functions/reservation.mjs`).

## 3. Conectar en Netlify
1. https://app.netlify.com → **Add new site → Import an existing project → GitHub** → elegir `Agentecanavida`.
2. Build command: vacío. Publish directory: `.` → **Deploy**.
3. **Site configuration → Environment variables → Add**: `LODGIFY_API_KEY` = su llave. Volver a desplegar (**Deploys → Trigger deploy**).

## 4. Activar en la app
En `canavida-data.js` cambiar `"apiUrl": ""` por `"apiUrl": "/api"` y subir el cambio.

Probar: `https://SU-SITIO.netlify.app/api/reservation?code=NUMERO_DE_RESERVA`

La app queda en `https://SU-SITIO.netlify.app/` — ese enlace se comparte por WhatsApp. Tras la primera búsqueda, la reserva queda guardada en el teléfono y abre sin internet.
