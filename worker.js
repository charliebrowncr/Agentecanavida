// Canavida · Lodgify proxy (Cloudflare Worker)
// Keeps the Lodgify API key on the server and returns only what the guest app needs.
// Secret required: LODGIFY_API_KEY  (Lodgify → Settings → Public API)
// Optional var:    ALLOWED_ORIGIN   (e.g. https://canavida.com) — defaults to "*"

const API = 'https://api.lodgify.com';

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);
    if (url.pathname !== '/reservation') return json({ error: 'not_found' }, 404, cors);

    const code = (url.searchParams.get('code') || '').trim().replace(/^#/, '');
    if (!code || code.length > 40) return json({ error: 'bad_code' }, 400, cors);

    const lg = p => fetch(API + p, { headers: { 'X-ApiKey': env.LODGIFY_API_KEY, Accept: 'application/json' } });

    try {
      let booking = null;
      // 1) Lodgify booking ID
      if (/^\d+$/.test(code)) {
        const r = await lg('/v2/reservations/bookings/' + code);
        if (r.ok) booking = await r.json();
      }
      // 2) Channel codes (Airbnb / Booking.com…): search current + upcoming stays
      if (!booking) {
        const c = code.toLowerCase();
        outer: for (const filter of ['Current', 'Upcoming']) {
          for (let page = 1; page <= 6; page++) {
            const r = await lg(`/v2/reservations/bookings?stayFilter=${filter}&page=${page}&size=50`);
            if (!r.ok) break;
            const d = await r.json();
            const items = d.items || [];
            booking = items.find(b => Object.values(b).some(v => typeof v === 'string' && v.toLowerCase() === c));
            if (booking || items.length < 50) { if (booking) break outer; break; }
          }
        }
      }
      if (!booking) return json({ error: 'not_found' }, 404, cors);
      if (/cancel|declin/i.test(booking.status || '')) return json({ error: 'cancelled' }, 404, cors);

      let villa = '';
      if (booking.property_id) {
        const p = await lg('/v2/properties/' + booking.property_id);
        if (p.ok) villa = (await p.json()).name || '';
      }
      const guests = (booking.rooms || []).reduce((n, r) => {
        const g = r.guest_breakdown || {};
        return n + (g.adults || r.people || 0) + (g.children || 0) + (g.infants || 0);
      }, 0);

      return json({
        code: String(booking.id),
        name: (booking.guest && booking.guest.name) || '',
        villa,
        arrive: (booking.arrival || '').slice(0, 10),
        depart: (booking.departure || '').slice(0, 10),
        guests: guests || null
      }, 200, cors);
    } catch (e) {
      return json({ error: 'upstream' }, 502, cors);
    }
  }
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}
