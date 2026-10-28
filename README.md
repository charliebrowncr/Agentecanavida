# Conectar la app a Lodgify (reservas reales)

La app no guarda usuario/contraseña de Lodgify. Usa la **API pública de Lodgify** a través de un pequeño servidor gratuito (Cloudflare Worker) que guarda la llave en secreto.

## 1. Obtener la API key
Lodgify → **Settings → Public API** → copiar la llave. (La API requiere un plan que no sea Starter.)

## 2. Crear el Worker (gratis, ~5 min)
1. Entrar a https://dash.cloudflare.com → **Workers & Pages → Create → Worker**.
2. Nombre: `canavida-lodgify` → **Deploy** → **Edit code**.
3. Pegar todo el contenido de `worker.js` → **Deploy**.
4. **Settings → Variables and Secrets → Add**:
   - Tipo **Secret**, nombre `LODGIFY_API_KEY`, valor = la llave de Lodgify.
   - (Opcional) Variable `ALLOWED_ORIGIN` = el dominio donde publique la app.
5. Copiar la URL del Worker, ej. `https://canavida-lodgify.SU-CUENTA.workers.dev`.

Probar: abrir `https://canavida-lodgify.SU-CUENTA.workers.dev/reservation?code=NUMERO_DE_RESERVA`

## 3. Conectar la app
En `Canavida App.dc.html`, panel **Tweaks → apiUrl**, pegar la URL del Worker (o editar `apiUrl` en `canavida-data.js`).

## Qué devuelve
Solo: número de reserva, nombre del huésped, villa, fechas y cantidad de huéspedes. Acepta el ID de Lodgify o el código del canal (Airbnb, Booking.com…) para estadías actuales y próximas.

## Sin internet
Tras la primera búsqueda exitosa, la reserva queda guardada en el teléfono y la app abre sin conexión.
