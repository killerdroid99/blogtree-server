# Blogtree Server

A Node.js/Express server for Blogtree backed by PostgreSQL (Drizzle ORM) and Redis for sessions/caching. The project is containerized with Docker and orchestrated via Docker Compose.

## Tech Stack

- Node.js (TypeScript)
- Express
- Drizzle ORM + `pg`
- PostgreSQL 15 (official image)
- Redis (alpine image)
- Session management via `express-session` + `connect-redis`
- Build tooling: `pkgroll`

## Project Structure

```
.
├─ src/
│  ├─ db/
│  │  ├─ schema.ts       # Drizzle schema
│  │  └─ index.ts        # DB initialization
│  ├─ utils/             # Guards and helpers
│  ├─ validators/        # Zod validators
│  └─ index.ts           # App entry (compiled to dist/index.{mjs,cjs})
├─ drizzle.config.ts      # Drizzle config (uses DATABASE_URL)
├─ Dockerfile             # App image
├─ docker-compose.yml     # App + Postgres + Redis
├─ package.json           # Scripts & deps
└─ tsconfig.json
```

## Prerequisites

- Docker and Docker Compose
- Optional for local (non-docker) dev: Node.js 18+

## Environment Configuration

This project supports per-service environment files for clarity and least-privilege. You can start with a single `.env` if you prefer, or use the recommended service-specific files below.

### Option A: Single .env (simple)

Create a `.env` in the project root and point `docker-compose.yml` services to it via `env_file: - .env`.

Example `.env` (covers app + database):

```
# App
COOKIE_SECRET=change-me
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
REDIRECT_URI=http://localhost:3000/auth/google/callback

# App -> Postgres/Redis (use service names as hosts inside Docker network)
DATABASE_URL=postgres://root:mysecretpassword@postgres:5432/local
REDIS_HOST=redis
REDIS_PORT=6379

# Postgres bootstrap (used by postgres service)
POSTGRES_USER=root
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=local
```

### Option B: Service-specific env files (recommended)

Update `docker-compose.yml` to use these:

- App env file: `.env.app`
- Postgres env file: `.env.db`
- Redis usually does not require env unless you enable auth.

`.env.app`:

```
COOKIE_SECRET=change-me
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
REDIRECT_URI=http://localhost:3000/auth/google/callback
DATABASE_URL=postgres://root:mysecretpassword@postgres:5432/local
REDIS_HOST=redis
REDIS_PORT=6379
```

`.env.db`:

```
POSTGRES_USER=root
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=local
```

Add these patterns to `.gitignore` to avoid committing secrets:

```
.env
.env.*
```

## Running with Docker Compose

Build and start all services:

```
docker compose up --build
```

The app will be available at:

- App: http://localhost:3000
- Postgres: localhost:5432 (if `ports` is published)
- Redis: localhost:6379 (if `ports` is published)

Services communicate internally via the Docker network using service names:

- Postgres host: `postgres`
- Redis host: `redis`

Healthchecks are configured so the app waits until Postgres/Redis are ready.

To stop:

```
docker compose down
```

## Local Development (without Docker)

1. Start a local Postgres and Redis, or use Docker just for dependencies.
2. Create a local `.env` consumable by Node (for example via `dotenv`) with at least:

```
DATABASE_URL=postgres://user:password@localhost:5432/yourdb
REDIS_HOST=localhost
REDIS_PORT=6379
COOKIE_SECRET=change-me
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
REDIRECT_URI=http://localhost:3000/auth/google/callback
```

3. Install deps and run dev server:

```
npm ci
npm run dev
```

## Database (Drizzle)

`drizzle.config.ts` loads `DATABASE_URL` from the environment and points to `./src/db/schema.ts`.

Common commands:

```
# Push schema changes to the database
npm run db:push

# Explore the database with Drizzle Studio
npm run db:studio
```

Make sure `DATABASE_URL` points to the correct Postgres (inside Docker, typically `postgres://root:mysecretpassword@postgres:5432/local`).

## Build and Production Notes

- Build: `npm run build` (uses `pkgroll`) -> outputs to `dist/`
- Dockerfile runs `npm ci`, copies source, builds, then starts with `node dist/index.mjs`.
- For production, consider:
  - Using distinct secrets/credentials and a managed secret store.
  - Removing `ports` for Postgres/Redis if not needed externally.
  - Enabling Redis auth if exposed.

## Troubleshooting

- App cannot connect to DB/Redis:

  - Ensure `DATABASE_URL` uses host `postgres` and Redis host `redis` when running in Docker.
  - Verify env files are mounted via `env_file` in `docker-compose.yml`.
  - Check health status: `docker compose ps`.

- Redis exits with code 137:

  - This often indicates the container was killed (e.g., out-of-memory or manual stop). Retry `docker compose up`.
  - If it persists, limit other workloads or configure Docker memory limits appropriately.

- Drizzle commands fail:
  - Ensure `DATABASE_URL` is set in your shell (for local) or in the proper env file (for Docker Compose).

## Scripts

From `package.json`:

```
npm run build       # Build with pkgroll
npm run start       # Start compiled app (node dist/index.mjs)
npm run dev         # Start TS dev server with tsx watch
npm run db:push     # Drizzle push
npm run db:studio   # Drizzle studio
```

## License

ISC
