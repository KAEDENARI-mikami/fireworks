# PostgreSQL Sync

Fireworks can still run as a static local-first app. PostgreSQL sync is optional and turns on only when both sides are configured.

## Server

Required environment:

```sh
export DATABASE_URL="postgres://user:password@host:5432/fireworks"
export CORS_ORIGIN="https://example.com"
```

For Supabase, start from `.env.supabase.example` and use the Session pooler connection string.

Initialize the database:

```sh
npm run db:migrate
```

Run the API:

```sh
npm run api:dev
```

Deploy the Supabase Edge Function API:

```sh
export SUPABASE_ACCESS_TOKEN="..."
npm run api:deploy:supabase
```

Production Function URL:

```text
https://atdgogohyvlrfwcxoocb.supabase.co/functions/v1/fireworks-api
```

## Client

Set `apiBaseUrl` in `fireworks.config.js`.

```js
window.FireworksApiConfig = {
  apiBaseUrl: 'https://api.example.com',
};
```

When `apiBaseUrl` is blank, the game keeps using `localStorage` only.

## Implemented Scope

- Anonymous cloud save keyed by a locally generated anonymous id. Remote save wins when it has a newer `_cloudUpdatedAt`.
- In-progress battle run sync. Local run state remains a cache/fallback.
- Black powder ledger events.
- Rewarded ad reward events.
- Addon acquisition events.
- Supply spot claims with idempotency per player/spot/cooldown bucket.
- PostGIS-backed supply spot and sweet spot persistence.
- Nearby spot API using `ST_DWithin`.
