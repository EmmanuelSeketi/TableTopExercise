# TableTopExercise

TableTopExercise is a Next.js application backed by PostgreSQL. For a VPS deployment, Docker Compose runs the web app and database on a private Docker network; PostgreSQL is not published to the public internet.

## Run locally with Docker

1. Copy `.env.example` to `.env`.
2. Set `NEXT_PUBLIC_APP_URL` to the address clients will use. For local-network use, use this computer's LAN IPv4 address (for example `http://10.0.0.25:3001`). Set unique values for `POSTGRES_PASSWORD`, `FACILITATOR_PASSWORD`, and `SESSION_SECRET`. Use HTTPS on a VPS and set `AUTH_COOKIE_SECURE=true`.
3. Start the application:

   ```powershell
   docker compose up --build -d
   ```

4. Open the configured URL. On this computer, `http://localhost:3001` also works. The database health check gates app startup. Data is persisted in the `postgres_data` Docker volume.

For local-network use, set `APP_BIND_ADDRESS=0.0.0.0`; the app then binds to port `3001` on host interfaces so devices on the same LAN can connect to `http://<computer-LAN-IP>:3001`. Find the address with `ipconfig` on Windows. If Windows Firewall blocks access, allow inbound TCP 3001 only from `LocalSubnet`. Set `NEXT_PUBLIC_APP_URL` to this LAN URL so the signup QR code points to the host computer; rebuild after changing it. Do not forward port 3001 from your router to the public internet. Without an explicit bind address, the app listens on localhost only.

On a VPS, set `APP_BIND_ADDRESS=127.0.0.1` so the app is reachable only through the host, and put a TLS-terminating reverse proxy (such as Caddy or Nginx) in front of it. Set `APP_PORT` to the port used by the proxy and `AUTH_COOKIE_SECURE=true`. Configure the proxy to forward the original `Host`, `X-Forwarded-Host`, and `X-Forwarded-Proto` headers so same-origin protection works with the public HTTPS URL. PostgreSQL remains bound to `127.0.0.1:5432` for host-side development and is not reachable from other machines.

Facilitator and moderator pages require `FACILITATOR_PASSWORD`. Admin sessions are signed with `SESSION_SECRET`, expire after 12 hours, and are stored in HttpOnly cookies; failed sign-ins are rate-limited per forwarded client IP. The full state API requires the admin session cookie. Participants receive only active exercise details and their own submitted response; the shared browser API token has been removed.

Before upgrading an existing database, make a backup. On the first state request after upgrading, the app creates `exercise_responses`, copies existing JSON-stored responses into it, and clears the legacy response array. The response table enforces one response per participant and inject. Restoring the pre-upgrade backup rolls back both the schema/data migration and subsequent changes.

## Backups

Back up the database regularly and copy backups off the VPS. For example, from the project directory:

```powershell
$dbContainer = docker compose ps -q db
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/tabletop.backup'
docker cp "${dbContainer}:/tmp/tabletop.backup" .\tabletop.backup
docker compose exec -T db rm -f /tmp/tabletop.backup
```

To restore the backup to the database:

```powershell
$dbContainer = docker compose ps -q db
docker cp .\tabletop.backup "${dbContainer}:/tmp/tabletop.backup"
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists /tmp/tabletop.backup'
docker compose exec -T db rm -f /tmp/tabletop.backup
```

The database schema is installed automatically when PostgreSQL initializes a new data volume. To import an existing `data/exercise-state.json` once, start PostgreSQL and run the importer before starting the app:

```powershell
docker compose up -d db
docker compose run --rm -v "${PWD}\data\exercise-state.json:/tmp/exercise-state.json:ro" app node scripts/import-exercise-state.mjs /tmp/exercise-state.json
docker compose up --build -d
```

The importer refuses to overwrite state already stored in PostgreSQL. The running application no longer reads or writes the JSON file.

## Development

The Docker app is the recommended local setup. The optional host-side development server uses `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE` to share the Docker PostgreSQL data; start it with `npm run dev` on port 3000. Both app instances share one database. The API returns an explicit service error if PostgreSQL is unavailable rather than silently treating a failed database write as successful.
