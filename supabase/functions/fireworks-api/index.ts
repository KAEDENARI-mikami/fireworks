import pg from 'npm:pg@8.13.1';

const { Pool } = pg;
const DATABASE_URL = Deno.env.get('DATABASE_URL') || Deno.env.get('SUPABASE_DB_URL') || '';
const ALLOWED_ORIGIN = Deno.env.get('CORS_ORIGIN') || '*';

if (!DATABASE_URL) console.error('DATABASE_URL is not set');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 4,
});

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-client-info,apikey',
    'Access-Control-Max-Age': '86400',
  };
}

function send(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

async function readJson(req: Request) {
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return {};
  const text = await req.text();
  if (!text) return {};
  return JSON.parse(text);
}

function apiPath(req: Request) {
  const url = new URL(req.url);
  const idx = url.pathname.indexOf('/api/');
  return idx >= 0 ? url.pathname.slice(idx) : url.pathname.replace(/^\/functions\/v1\/fireworks-api/, '') || '/';
}

function intOrNull(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function floatOrNull(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function requireAnon(body: Record<string, unknown>, url: URL) {
  const id = String(body?.anonymousId || url.searchParams.get('anonymousId') || '').trim();
  if (!id || id.length > 128) {
    const err = new Error('anonymousId is required') as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  return id;
}

async function playerForAnonymousId(anonymousId: string) {
  const result = await pool.query(
    `INSERT INTO players (anonymous_id, updated_at)
     VALUES ($1, now())
     ON CONFLICT (anonymous_id) DO UPDATE SET updated_at = now()
     RETURNING id, anonymous_id, created_at, updated_at`,
    [anonymousId],
  );
  return result.rows[0];
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });

    const url = new URL(req.url);
    const path = apiPath(req);
    if (req.method === 'GET' && path === '/api/health') {
      await pool.query('SELECT 1');
      return send(200, { ok: true });
    }

    const body = await readJson(req) as Record<string, unknown>;

    if (req.method === 'POST' && path === '/api/v1/bootstrap') {
      const player = await playerForAnonymousId(requireAnon(body, url));
      return send(200, { player });
    }

    if (req.method === 'GET' && path === '/api/v1/save') {
      const player = await playerForAnonymousId(requireAnon(body, url));
      const result = await pool.query(
        `SELECT save, version, client_updated_at, updated_at
         FROM player_save_states
         WHERE player_id = $1 AND slot = 'main'`,
        [player.id],
      );
      return send(200, { player, state: result.rows[0] || null });
    }

    if (req.method === 'PUT' && path === '/api/v1/save') {
      const player = await playerForAnonymousId(requireAnon(body, url));
      const save = body?.save && typeof body.save === 'object' ? body.save : {};
      const clientUpdatedAt = body?.clientUpdatedAt ? new Date(String(body.clientUpdatedAt)) : null;
      const result = await pool.query(
        `INSERT INTO player_save_states (player_id, slot, save, version, client_updated_at, updated_at)
         VALUES ($1, 'main', $2::jsonb, 1, $3, now())
         ON CONFLICT (player_id, slot) DO UPDATE
         SET save = EXCLUDED.save,
             version = player_save_states.version + 1,
             client_updated_at = EXCLUDED.client_updated_at,
             updated_at = now()
         RETURNING version, client_updated_at, updated_at`,
        [player.id, JSON.stringify(save), clientUpdatedAt],
      );
      return send(200, { ok: true, state: result.rows[0] });
    }

    if (req.method === 'GET' && path === '/api/v1/run') {
      const player = await playerForAnonymousId(requireAnon(body, url));
      const result = await pool.query(
        `SELECT run, client_updated_at, updated_at
         FROM player_run_states
         WHERE player_id = $1 AND slot = 'main'`,
        [player.id],
      );
      return send(200, { player, state: result.rows[0] || null });
    }

    if (req.method === 'PUT' && path === '/api/v1/run') {
      const player = await playerForAnonymousId(requireAnon(body, url));
      const run = body?.run && typeof body.run === 'object' ? body.run : {};
      const clientUpdatedAt = body?.clientUpdatedAt ? new Date(String(body.clientUpdatedAt)) : null;
      const result = await pool.query(
        `INSERT INTO player_run_states (player_id, slot, run, client_updated_at, updated_at)
         VALUES ($1, 'main', $2::jsonb, $3, now())
         ON CONFLICT (player_id, slot) DO UPDATE
         SET run = EXCLUDED.run,
             client_updated_at = EXCLUDED.client_updated_at,
             updated_at = now()
         RETURNING client_updated_at, updated_at`,
        [player.id, JSON.stringify(run), clientUpdatedAt],
      );
      return send(200, { ok: true, state: result.rows[0] });
    }

    if (req.method === 'DELETE' && path === '/api/v1/run') {
      const player = await playerForAnonymousId(requireAnon(body, url));
      await pool.query(`DELETE FROM player_run_states WHERE player_id = $1 AND slot = 'main'`, [player.id]);
      return send(200, { ok: true });
    }

    if (req.method === 'POST' && path === '/api/v1/events/black-powder') {
      const player = await playerForAnonymousId(requireAnon(body, url));
      const amount = intOrNull(body.amount);
      if (!amount) return send(400, { ok: false, error: 'amount is required' });
      await pool.query(
        `INSERT INTO black_powder_ledger (player_id, amount, reason, placement, idempotency_key, meta)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         ON CONFLICT (player_id, idempotency_key) DO NOTHING`,
        [player.id, amount, body.reason || null, body.placement || null, String(body.idempotencyKey || crypto.randomUUID()), JSON.stringify(body.meta || {})],
      );
      return send(200, { ok: true });
    }

    if (req.method === 'POST' && path === '/api/v1/events/ad-reward') {
      const player = await playerForAnonymousId(requireAnon(body, url));
      const amount = intOrNull(body.amount);
      if (!amount || !body.placement) return send(400, { ok: false, error: 'placement and amount are required' });
      await pool.query(
        `INSERT INTO ad_rewards (player_id, placement, reward_type, amount, provider, ad_unit_id, idempotency_key, raw)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
         ON CONFLICT (player_id, idempotency_key) DO NOTHING`,
        [player.id, body.placement, body.rewardType || 'blackPowder', amount, body.provider || null, body.adUnitId || null, String(body.idempotencyKey || crypto.randomUUID()), JSON.stringify(body.raw || {})],
      );
      return send(200, { ok: true });
    }

    if (req.method === 'POST' && path === '/api/v1/events/addon') {
      const player = await playerForAnonymousId(requireAnon(body, url));
      await pool.query(
        `INSERT INTO addon_events (player_id, addon_uid, event_type, cat, rarity, source, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [player.id, body.addonUid || null, body.eventType || 'acquired', body.cat || null, body.rarity || null, body.source || null, JSON.stringify(body.payload || {})],
      );
      return send(200, { ok: true });
    }

    if (req.method === 'POST' && path === '/api/v1/claims/supply') {
      const player = await playerForAnonymousId(requireAnon(body, url));
      const spotId = String(body.spotId || '').slice(0, 256);
      const cooldownBucket = intOrNull(body.cooldownBucket);
      if (!spotId || cooldownBucket === null) return send(400, { ok: false, error: 'spotId and cooldownBucket are required' });
      const rewards = body.rewards && typeof body.rewards === 'object' ? body.rewards : {};
      const result = await pool.query(
        `INSERT INTO supply_claims (player_id, spot_id, cooldown_bucket, idempotency_key, rewards)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT (player_id, spot_id, cooldown_bucket) DO UPDATE
         SET idempotency_key = supply_claims.idempotency_key
         RETURNING rewards, claimed_at`,
        [player.id, spotId, cooldownBucket, String(body.idempotencyKey || `supply:${spotId}:${cooldownBucket}`), JSON.stringify(rewards)],
      );
      return send(200, { ok: true, rewards: result.rows[0]?.rewards || rewards, claimedAt: result.rows[0]?.claimed_at || null });
    }

    if (req.method === 'POST' && path === '/api/v1/spots/supply/bulk') {
      const spots = Array.isArray(body.spots) ? body.spots.slice(0, 80) : [];
      for (const spot of spots) {
        const lat = floatOrNull(spot.lat), lng = floatOrNull(spot.lng), id = String(spot.id || '');
        if (!id || lat === null || lng === null) continue;
        await pool.query(
          `INSERT INTO supply_spots (id, name, type, source, geom, tags, payload, updated_at)
           VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7::jsonb, $8::jsonb, now())
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               type = EXCLUDED.type,
               source = EXCLUDED.source,
               geom = EXCLUDED.geom,
               tags = EXCLUDED.tags,
               payload = EXCLUDED.payload,
               updated_at = now()`,
          [id, spot.name || '補給ポイント', spot.type || null, spot.source || null, lng, lat, JSON.stringify(spot.tags || {}), JSON.stringify(spot)],
        );
      }
      return send(200, { ok: true, count: spots.length });
    }

    if (req.method === 'POST' && path === '/api/v1/spots/sweet/bulk') {
      const spots = Array.isArray(body.spots) ? body.spots.slice(0, 80) : [];
      for (const spot of spots) {
        const lat = floatOrNull(spot.lat), lng = floatOrNull(spot.lng), cellId = String(spot.cellId || spot.cell || '');
        if (!cellId || lat === null || lng === null) continue;
        const field = spot.field && typeof spot.field === 'object' ? spot.field : {};
        await pool.query(
          `INSERT INTO sweet_spots (id, cell_id, geom, field, rarity, module_cost, module_budget, density_total, updated_at)
           VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5::jsonb, $6, $7, $8, $9, now())
           ON CONFLICT (id) DO UPDATE
           SET geom = EXCLUDED.geom,
               field = EXCLUDED.field,
               rarity = EXCLUDED.rarity,
               module_cost = EXCLUDED.module_cost,
               module_budget = EXCLUDED.module_budget,
               density_total = EXCLUDED.density_total,
               updated_at = now()`,
          ['sweet:' + cellId, cellId, lng, lat, JSON.stringify(field), field.rarity || null, intOrNull(field.moduleCost), intOrNull(field.moduleBudget), intOrNull(field.TOTAL)],
        );
      }
      return send(200, { ok: true, count: spots.length });
    }

    if (req.method === 'GET' && path === '/api/v1/spots/nearby') {
      const lat = floatOrNull(url.searchParams.get('lat'));
      const lng = floatOrNull(url.searchParams.get('lng'));
      const radius = Math.min(2000, Math.max(50, intOrNull(url.searchParams.get('radius')) || 700));
      if (lat === null || lng === null) return send(400, { ok: false, error: 'lat and lng are required' });
      const supply = await pool.query(
        `SELECT id, name, type, source, ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng,
                ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS dist,
                tags, payload
         FROM supply_spots
         WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
         ORDER BY dist ASC
         LIMIT 80`,
        [lng, lat, radius],
      );
      const sweet = await pool.query(
        `SELECT id, cell_id, ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng,
                ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS dist,
                field, rarity, module_cost, module_budget, density_total
         FROM sweet_spots
         WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
         ORDER BY dist ASC
         LIMIT 80`,
        [lng, lat, radius],
      );
      return send(200, { supply: supply.rows, sweet: sweet.rows });
    }

    return send(404, { ok: false, error: 'not found' });
  } catch (err) {
    console.error(err);
    const status = (err as Error & { status?: number }).status || 500;
    return send(status, { ok: false, error: status === 500 ? 'internal error' : (err as Error).message });
  }
});
