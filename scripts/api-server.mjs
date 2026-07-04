import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env.supabase');

if (existsSync(envPath)) {
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const PORT = Number(process.env.PORT || 8787);
const DATABASE_URL = process.env.DATABASE_URL;
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required to start the API server.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
});

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function send(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    ...corsHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
  });
  res.end(data);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function requireAnon(body, url) {
  const id = String(body?.anonymousId || url.searchParams.get('anonymousId') || '').trim();
  if (!id || id.length > 128) {
    const err = new Error('anonymousId is required');
    err.status = 400;
    throw err;
  }
  return id;
}

async function playerForAnonymousId(anonymousId) {
  const result = await pool.query(
    `INSERT INTO players (anonymous_id, updated_at)
     VALUES ($1, now())
     ON CONFLICT (anonymous_id) DO UPDATE SET updated_at = now()
     RETURNING id, anonymous_id, created_at, updated_at`,
    [anonymousId],
  );
  return result.rows[0];
}

function intOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function floatOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function handle(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/health') {
    await pool.query('SELECT 1');
    send(res, 200, { ok: true });
    return;
  }

  const body = ['POST', 'PUT', 'DELETE'].includes(req.method) ? await readJson(req) : {};

  if (req.method === 'POST' && url.pathname === '/api/v1/bootstrap') {
    const player = await playerForAnonymousId(requireAnon(body, url));
    send(res, 200, { player });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/save') {
    const player = await playerForAnonymousId(requireAnon(body, url));
    const result = await pool.query(
      `SELECT save, version, client_updated_at, updated_at
       FROM player_save_states
       WHERE player_id = $1 AND slot = 'main'`,
      [player.id],
    );
    send(res, 200, { player, state: result.rows[0] || null });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/v1/save') {
    const player = await playerForAnonymousId(requireAnon(body, url));
    const save = body?.save && typeof body.save === 'object' ? body.save : {};
    const clientUpdatedAt = body?.clientUpdatedAt ? new Date(body.clientUpdatedAt) : null;
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
    send(res, 200, { ok: true, state: result.rows[0] });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/run') {
    const player = await playerForAnonymousId(requireAnon(body, url));
    const result = await pool.query(
      `SELECT run, client_updated_at, updated_at
       FROM player_run_states
       WHERE player_id = $1 AND slot = 'main'`,
      [player.id],
    );
    send(res, 200, { player, state: result.rows[0] || null });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/v1/run') {
    const player = await playerForAnonymousId(requireAnon(body, url));
    const run = body?.run && typeof body.run === 'object' ? body.run : {};
    const clientUpdatedAt = body?.clientUpdatedAt ? new Date(body.clientUpdatedAt) : null;
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
    send(res, 200, { ok: true, state: result.rows[0] });
    return;
  }

  if (req.method === 'DELETE' && url.pathname === '/api/v1/run') {
    const player = await playerForAnonymousId(requireAnon(body, url));
    await pool.query(`DELETE FROM player_run_states WHERE player_id = $1 AND slot = 'main'`, [player.id]);
    send(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/v1/events/black-powder') {
    const player = await playerForAnonymousId(requireAnon(body, url));
    const amount = intOrNull(body.amount);
    if (!amount) return send(res, 400, { ok: false, error: 'amount is required' });
    const idempotencyKey = String(body.idempotencyKey || randomUUID());
    await pool.query(
      `INSERT INTO black_powder_ledger (player_id, amount, reason, placement, idempotency_key, meta)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (player_id, idempotency_key) DO NOTHING`,
      [player.id, amount, body.reason || null, body.placement || null, idempotencyKey, JSON.stringify(body.meta || {})],
    );
    send(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/v1/events/ad-reward') {
    const player = await playerForAnonymousId(requireAnon(body, url));
    const amount = intOrNull(body.amount);
    if (!amount || !body.placement) return send(res, 400, { ok: false, error: 'placement and amount are required' });
    const idempotencyKey = String(body.idempotencyKey || randomUUID());
    await pool.query(
      `INSERT INTO ad_rewards (player_id, placement, reward_type, amount, provider, ad_unit_id, idempotency_key, raw)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       ON CONFLICT (player_id, idempotency_key) DO NOTHING`,
      [player.id, body.placement, body.rewardType || 'blackPowder', amount, body.provider || null, body.adUnitId || null, idempotencyKey, JSON.stringify(body.raw || {})],
    );
    send(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/v1/events/addon') {
    const player = await playerForAnonymousId(requireAnon(body, url));
    await pool.query(
      `INSERT INTO addon_events (player_id, addon_uid, event_type, cat, rarity, source, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [player.id, body.addonUid || null, body.eventType || 'acquired', body.cat || null, body.rarity || null, body.source || null, JSON.stringify(body.payload || {})],
    );
    send(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/v1/claims/supply') {
    const player = await playerForAnonymousId(requireAnon(body, url));
    const spotId = String(body.spotId || '').slice(0, 256);
    const cooldownBucket = intOrNull(body.cooldownBucket);
    if (!spotId || cooldownBucket === null) return send(res, 400, { ok: false, error: 'spotId and cooldownBucket are required' });
    const idempotencyKey = String(body.idempotencyKey || `supply:${spotId}:${cooldownBucket}`);
    const rewards = body.rewards && typeof body.rewards === 'object' ? body.rewards : {};
    const result = await pool.query(
      `INSERT INTO supply_claims (player_id, spot_id, cooldown_bucket, idempotency_key, rewards)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (player_id, spot_id, cooldown_bucket) DO UPDATE
       SET idempotency_key = supply_claims.idempotency_key
       RETURNING rewards, claimed_at`,
      [player.id, spotId, cooldownBucket, idempotencyKey, JSON.stringify(rewards)],
    );
    send(res, 200, { ok: true, rewards: result.rows[0]?.rewards || rewards, claimedAt: result.rows[0]?.claimed_at || null });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/v1/spots/supply/bulk') {
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
    send(res, 200, { ok: true, count: spots.length });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/v1/spots/sweet/bulk') {
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
        [
          'sweet:' + cellId,
          cellId,
          lng,
          lat,
          JSON.stringify(field),
          field.rarity || null,
          intOrNull(field.moduleCost),
          intOrNull(field.moduleBudget),
          intOrNull(field.TOTAL),
        ],
      );
    }
    send(res, 200, { ok: true, count: spots.length });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/spots/nearby') {
    const lat = floatOrNull(url.searchParams.get('lat'));
    const lng = floatOrNull(url.searchParams.get('lng'));
    const radius = Math.min(2000, Math.max(50, intOrNull(url.searchParams.get('radius')) || 700));
    if (lat === null || lng === null) return send(res, 400, { ok: false, error: 'lat and lng are required' });
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
    send(res, 200, { supply: supply.rows, sweet: sweet.rows });
    return;
  }

  send(res, 404, { ok: false, error: 'not found' });
}

createServer((req, res) => {
  handle(req, res).catch(err => {
    const status = err.status || 500;
    console.error(err);
    send(res, status, { ok: false, error: status === 500 ? 'internal error' : err.message });
  });
}).listen(PORT, () => {
  console.log(`Fireworks API listening on http://localhost:${PORT}`);
});
