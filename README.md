## Linkbox

A personal learning project about Docker, Compose, security and CI/CD. The app itself is deliberately simple: save a link and a background worker fetches that page's title.

## Run locally (dev server)

```bash
git clone https://github.com/StefBisti/linkbox.git && cd linkbox
cp .env.example .env
docker compose up --build --watch
```

- web: localhost:5173
- api: localhost:3000
- adminer (database ui) with `docker compose --profile tools up -d`: localhost:8081

Edits in api/src and web/src sync automatically into the running containers. Changing dependencies triggers a rebuild.

## Production

`compose.prod.yaml` runs all the services as containers on a single server:

- web and api images are pulled from GHCR, tagged per commit (`sha-xxxxxxx`), multi-arch (amd64 + arm64)
- Networks: `edge` for proxy, web, api, worker; `backend` (internal) for db and cache
- Hardening for app containers: non-root, read-only root filesystem, all capabilities dropped, `no-new-privileges`, memory/CPU/pids limits, log rotation, restart policies

Deploy from your own machine via ssh to the server machine using `./deploy.sh sha-xxxxxxx`. You need to change SCP_TARGET, SERVER and IDENTITY to your own in `./deploy.sh`, the image names in cosign verify, compose.prod.yaml and in workflows/image.yml and also the default_sni address in the Caddyfile.

It verifies both images' signatures, syncs the config to the server, runs `docker compose up -d --wait`, and rolls back to the previous version automatically if the new one doesn't become healthy.

## Architecture

| Service        | What it does                                                                        |
| -------------- | ----------------------------------------------------------------------------------- |
| `proxy`        | Caddy: the only published service (80/443), HTTPS, routes `/api/*` to the API       |
| `web`          | React + shadcn/ui, built by Vite and served by unprivileged nginx                   |
| `api`          | Fastify: `GET /health`, `GET /links`, `POST /links` (inserts the row, queues a job) |
| `worker`       | Waits on the Redis queue, fetches each URL, stores its `<title>`                    |
| `migrate`      | One-off job: creates the schema, then exits before `api` and `worker` start         |
| `db` / `cache` | Postgres and Redis, on an internal network with no internet access                  |

## CI/CD

`.github/workflows/image.yml`, on every pull request and push to `main`:

1. test: starts the full stack with Compose and runs end-to-end tests against it
2. image (api and web, in parallel): builds, fails on fixable HIGH/CRITICAL CVEs (Trivy), then, on `main` only, pushes multi-arch images with SBOM and provenance and signs them with cosign (keyless)

All actions and the Trivy image are pinned to exact commits/digests.

## Acknowledgements

Written by Stefan Bisti as a personal project, with Claude Code used for:

- Learning concepts used throughout the project (docker, compose, volumes, networks etc.)
- Creating the web interface
- Help in writing the README and LICENSE


## License

[MIT](LICENSE)
