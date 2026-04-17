# Weather Dashboard

A multi-service weather monitoring system. A background worker polls live weather data from Open-Meteo, stores it in Supabase, and a Next.js frontend displays real-time updates via Supabase Realtime.

## Architecture

```
Open-Meteo API → Worker (Railway) → Supabase (Postgres + Realtime) → Frontend (Next.js on Vercel)
```

### Data Flow

1. **Worker** runs on Railway, polling Open-Meteo every 5 minutes
2. Worker reads the `cities` table to know which cities to poll
3. Worker calls Open-Meteo API for each city's current conditions
4. Worker upserts results into `weather_data` (one row per city, updated in place)
5. Supabase Realtime broadcasts `weather_data` changes to subscribed clients
6. **Frontend** subscribes to Realtime on `weather_data` and updates the UI live

### External API

**Open-Meteo** (https://open-meteo.com) — free, open-source weather API. No API key required.

Endpoint: `GET https://api.open-meteo.com/v1/forecast`
- `latitude`, `longitude` — city coordinates
- `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m`
- `temperature_unit=fahrenheit`, `wind_speed_unit=mph`

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (dark theme)
- **Auth**: Clerk (sign up, sign in, sign out)
- **Database**: Supabase (PostgreSQL + Row Level Security + Realtime)
- **External API**: Open-Meteo (free, no API key)
- **Deployment**: Vercel (frontend) + Railway (worker)

## Monorepo Structure

```
my-weather-tracker/
├── package.json              # Root — npm workspaces
├── CLAUDE.md                 # This file
├── supabase/schema.sql       # Database schema
├── apps/
│   ├── web/                  # Next.js frontend (Vercel)
│   │   ├── src/
│   │   │   ├── app/          # App Router pages
│   │   │   ├── components/   # React components
│   │   │   └── lib/          # Supabase client, utils
│   │   └── ...
│   └── worker/               # Background poller (Railway)
│       └── src/index.ts      # Main polling loop
```

## Environment Variables

### Frontend (apps/web/.env.local)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Worker (apps/worker/.env.local)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
POLL_INTERVAL_MS=300000
```

## Supabase Tables

### cities
Master list of trackable cities. Publicly readable, no client writes.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| name | text | City name, NOT NULL |
| country | text | Country name, NOT NULL |
| latitude | real | NOT NULL |
| longitude | real | NOT NULL |
| created_at | timestamptz | default now() |

### weather_data
Current conditions per city. Worker upserts, Realtime enabled.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| city_id | uuid | FK → cities(id), UNIQUE |
| temperature | real | °F |
| feels_like | real | °F |
| humidity | integer | % |
| wind_speed | real | mph |
| wind_direction | integer | degrees |
| weather_code | integer | WMO code |
| updated_at | timestamptz | default now() |

### user_favorites
Which cities a user is tracking. Scoped by Clerk user ID.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| user_id | text | Clerk user ID, NOT NULL |
| city_id | uuid | FK → cities(id) |
| created_at | timestamptz | default now() |
| | | UNIQUE(user_id, city_id) |

### RLS Policies
- `cities` — SELECT for anon + authenticated (public read)
- `weather_data` — SELECT for anon + authenticated (public read, Realtime enabled)
- `user_favorites` — SELECT/INSERT/DELETE for authenticated where `user_id = auth.jwt()->>'sub'`
- Worker uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS

## Pages / Routes

| Route | Description |
|---|---|
| `/` | Dashboard — user's favorite cities with live weather |
| `/cities` | Browse all cities, add/remove favorites |
| `/sign-in` | Clerk sign-in |
| `/sign-up` | Clerk sign-up |

## Key Patterns

- **Clerk middleware** protects all routes except sign-in/sign-up
- **API routes** handle user_favorites CRUD (Clerk auth + Supabase service role key)
- **Client-side Supabase** uses anon key for reading weather_data and Realtime subscriptions
- **Worker** uses service role key to bypass RLS when writing weather data
- **Realtime** subscription on `weather_data` table pushes updates to connected clients

## Commands

```bash
npm run dev:web       # Start Next.js dev server
npm run dev:worker    # Start worker locally
npm run build:web     # Production build (frontend)
npm run build:worker  # Production build (worker)
```
