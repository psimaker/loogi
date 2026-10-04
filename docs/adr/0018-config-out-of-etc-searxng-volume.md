# 0018 — Config moves to /etc/loogi: the /etc/searxng VOLUME masks image contents

* Status: accepted
* Date: 2026-06-11

## Context

Our Dockerfile baked `settings.yml` + `limiter.toml` into the image under
`/etc/searxng/` (ADR 0003: everything in the image, no host mounts).
During the base update on 2026-06-11 it turned out that the **running
container was reading an outdated settings.yml**, even though the build had
demonstrably copied the new version into the image.

The cause is a chain of three mechanisms:

1. The upstream image declares `VOLUME /etc/searxng` (and
   `VOLUME /var/cache/searxng`), see `container/dist.dockerfile`.
2. Docker populates an anonymous volume with the image's content of that
   path on the **first** container start. Docker Compose **carries
   anonymous volumes over on every recreate** (unless
   `--renew-anon-volumes`). From then on the volume state covers every new
   image state — baked-in config changes never reach the container.
3. The official entrypoint doesn't fix this: if the image template is
   newer than the file in the volume, it only drops a `settings.yml.new`
   next to it ("Please review and merge").

In our case the volume had been frozen on 2026-05-10 (first deploy of the
then-current container). It never got noticed because our settings.yml
hadn't changed since — theme/templates live outside the VOLUME path and
always arrived correctly.

`searx/settings_loader.py::get_user_cfg_folder()` offers the way out: if
the env var `SEARXNG_SETTINGS_PATH` points to a **folder**, SearXNG reads
`settings.yml`, `limiter.toml` **and** `favicons.toml` from exactly that
folder; `/etc/searxng` is ignored.

## Decision

* Config files are baked into **`/etc/loogi/`** (not a VOLUME path) and
  `ENV SEARXNG_SETTINGS_PATH=/etc/loogi` is set in the Dockerfile.
* In addition, a `favicons.toml` is baked in (upstream default except for
  `db_url` → favicon cache on the persistent data volume
  `/var/cache/searxng` instead of ephemeral in `/tmp`). Side effect: the
  previous start-up log ERROR `missing favicon config` goes away.
* The anonymous volume on `/etc/searxng` technically stays (a VOLUME can't
  be removed in a child image), but the app no longer reads it. The
  entrypoint keeps managing it harmlessly (ownership check, possibly
  `.new` hints).

## Alternatives considered

- **`docker compose up -d --renew-anon-volumes` on every config update** —
  works, but it's a process must that gets forgotten; the trap would stay
  armed.
- **Bind-mounting the config** (`./searxng/settings.yml:/etc/searxng/...`)
  — contradicts ADR 0003 (self-contained image).

## Consequences

* Baked-in config changes now take effect reliably after `build` +
  `up -d` — no hidden volume in between anymore.
* `/var/cache/searxng` (engine/favicon caches) deliberately stays an
  anonymous volume: cache persistence across recreates is wanted, and
  masking is no problem there (no config).
* When debugging the settings path: what counts is
  `docker exec loogi env | grep SEARXNG_SETTINGS_PATH` and the contents of
  `/etc/loogi/` — not `/etc/searxng/`.
