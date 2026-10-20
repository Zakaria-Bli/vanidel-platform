# Traefik (VPS-wide reverse proxy)

This folder is the compose project that runs in `/opt/traefik` on the production VPS. It is kept in the repository for review and history; the server runs its own copy. Full server setup: [docs/operations/DEPLOYMENT_DOCKER.md](../../docs/operations/DEPLOYMENT_DOCKER.md).

What it does:

- Listens on 80 and 443; every HTTP request is redirected to HTTPS (except Let's Encrypt's HTTP challenge, which Traefik answers itself).
- Gets and renews Let's Encrypt certificates for every routed domain (`letsencrypt` resolver, stored in `letsencrypt/acme.json`).
- Routes to containers on the external `traefik-public` network that set `traefik.enable=true`. Nothing is exposed by default. The Docker socket is mounted read-only, only to read container labels.
- No dashboard and no published admin port.

## Install or update on the server

As a user in the `docker` group:

```sh
docker network create traefik-public    # once per server; "already exists" is fine
mkdir -p /opt/traefik
# From a machine with this repository:
scp -r deploy/traefik/. vanidel-prod:/opt/traefik/
# On the server:
cd /opt/traefik
cp .env.example .env && chmod 600 .env  # first time only: set ACME_EMAIL
docker compose up -d
docker compose logs -f traefik
```

The first request to a new domain triggers its certificate: the log shows the ACME exchange, and an error names the cause if it fails. Point the domain's DNS `A` record at the server first.

## Routing another compose project

Join the shared network and add labels to the service (the app's [`docker-compose.yml`](../../docker-compose.yml) is the example):

```yaml
services:
  web:
    networks: [default, traefik-public]
    labels:
      traefik.enable: 'true'
      traefik.docker.network: traefik-public
      traefik.http.routers.example.rule: Host(`example.com`)
      traefik.http.routers.example.entrypoints: websecure
      traefik.http.routers.example.tls.certresolver: letsencrypt
      traefik.http.services.example.loadbalancer.server.port: '8080'

networks:
  traefik-public:
    external: true
```

Router, service and middleware names are shared by every project on the server: give each a unique name. Routes to something outside Docker go in a YAML file in `dynamic/` (Traefik's file provider, reloaded on change).

## If the HTTP challenge fails

Let's Encrypt validates from several regions, and the Algerian provider of the testing server drops inbound connections from some of them (`During secondary validation: … Timeout during connect`; see [DEPLOYMENT.md §4](../../docs/operations/DEPLOYMENT.md#4-traefik-and-https)). If production shows the same error, switch to the DNS challenge, which needs no inbound connection. In `compose.yaml`, replace the `httpchallenge.entrypoint` line with the DNS host's [provider](https://doc.traefik.io/traefik/https/acme/#providers), and pass its API credentials in an env file kept only on the server:

```yaml
command:
  # ...
  - --certificatesresolvers.letsencrypt.acme.dnschallenge.provider=cpanel
env_file:
  - ./dns.env # mode 600, e.g. CPANEL_BASE_URL, CPANEL_USERNAME, CPANEL_TOKEN
```
