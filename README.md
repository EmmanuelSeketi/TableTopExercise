# TableTopExercise

TableTopExercise is a Next.js application backed by PostgreSQL. For a VPS deployment, Docker Compose runs the web app and database on a private Docker network; PostgreSQL is not published to the public internet.

## Run locally with Docker

1. Copy `.env.example` to `.env`.
2. On the VPS, set `NEXT_PUBLIC_APP_URL` to the public HTTPS URL, and replace `POSTGRES_PASSWORD` and `EXERCISE_API_SECRET` with long, unique, URL-safe random values.
3. Start the application:

   ```powershell
   docker compose up --build -d
   ```

4. Open `http://127.0.0.1:3001`. The database health check gates app startup. Data is persisted in the `postgres_data` Docker volume.

The app is bound to `127.0.0.1:3001` on the host so it is not directly exposed to the internet and does not conflict with a local Next.js development server on port 3000. On a VPS, put a TLS-terminating reverse proxy (such as Caddy or Nginx) in front of it and proxy to `127.0.0.1:3001`. Allow inbound web traffic only through the proxy; do not expose PostgreSQL port 5432.

To rebuild after changing `EXERCISE_API_SECRET`, run `docker compose up --build -d` so the browser bundle and server use the same value. The browser token is visible to app users and is only a lightweight write guard, not user authentication.

## Backups

Back up the database regularly and copy backups off the VPS. For example, from the project directory:

```powershell
docker compose exec -T db pg_dump -U tabletop -d tabletop -Fc > tabletop.backup
```

Replace `tabletop` with the configured database user and database name if changed. To restore to an empty database:

```powershell
Get-Content tabletop.backup | docker compose exec -T db pg_restore -U tabletop -d tabletop --clean --if-exists
```

The database schema is installed automatically when PostgreSQL initializes a new data volume. To import an existing `data/exercise-state.json` once, start PostgreSQL and run the importer before starting the app:

```powershell
docker compose up -d db
docker compose run --rm -v "${PWD}\data\exercise-state.json:/tmp/exercise-state.json:ro" app node scripts/import-exercise-state.mjs /tmp/exercise-state.json
docker compose up --build -d
```

The importer refuses to overwrite state already stored in PostgreSQL. The running application no longer reads or writes the JSON file.

## Development

Install dependencies with `npm ci`, set `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE` for a PostgreSQL instance, then run `npm run dev`. The API returns an explicit service error if PostgreSQL is unavailable rather than silently treating a failed database write as successful.
