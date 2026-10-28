// Canavida · Lodgify lookup (Netlify Function)
// Environment variable required: LODGIFY_API_KEY  (Lodgify → Settings → Public API)
// Served at /api/reservation?code=XXXX (see netlify.toml)

const API = 'https://api.lodgify.com';
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });

export default async (req) => {
  const key = process.env.LODGIFY_API_KEY;
  if (!key) return json({ error: 'missing_key' }, 500);
  const code = (new URL(req.url).searchParams.get('code') || '').trim().replace(/^#/, '');
  if (!code || code.length > 40) return json({ error: 'bad_code' }, 400);

  const lg = p => fetch(API + p, { headers: { 'X-ApiKey': key, Accept: 'application/json' } });

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
          const items = (await r.json()).items || [];
          booking = items.find(b => Object.values(b).some(v => typeof v === 'string' && v.toLowerCase() === c));
          if (booking) break outer;
          if (items.length < 50) break;
        }
      }
    }
    if (!booking) return json({ error: 'not_found' }, 404);
    if (/cancel|declin/i.test(booking.status || '')) return json({ error: 'cancelled' }, 404);

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
    });
  } catch (e) {
    return json({ error: 'upstream' }, 502);
  }
};
