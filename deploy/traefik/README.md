# Traefik (VPS-wide reverse proxy)

This folder is the compose project that runs in `/opt/traefik` on the VPS, in front of both environments: production (`vanidel.com`, Docker, [DEPLOYMENT_DOCKER.md](../../docs/operations/DEPLOYMENT_DOCKER.md)) and testing (`vanidel.izakcodes.com`, systemd, [DEPLOYMENT.md](../../docs/operations/DEPLOYMENT.md)). It is kept in the repository for review and history; the server runs its own copy.

What it does:

- Listens on 80 and 443 on the host network; every HTTP request is redirected to HTTPS (except Let's Encrypt's HTTP challenge, which Traefik answers itself).
- Gets and renews Let's Encrypt certificates, with two resolvers: `letsencrypt` (HTTP challenge) and `letsencrypt-dns` (DNS challenge through the cPanel API, for domains whose DNS is on that cPanel account).
- Routes to containers on the external `traefik-public` network that set `traefik.enable=true`. Nothing is exposed by default. The Docker socket is mounted read-only, only to read container labels.
- Routes to services outside Docker from the files in `dynamic/`: `vanidel-testing.yml` sends `vanidel.izakcodes.com` to the systemd app on `127.0.0.1:3000`.
- No dashboard, no admin port; the health endpoint listens on `127.0.0.1:8082` only.

Traefik runs on the host network rather than joining `traefik-public`: that is how it reaches the systemd app on loopback. It still reaches the containers, through their address on `traefik-public`, and it sees the real client address, which the app's rate limit relies on.

## Install or update on the server

As a user in the `docker` group (`vanidel`):

```sh
docker network create traefik-public    # once per server; "already exists" is fine
mkdir -p /opt/traefik
# From a machine with this repository:
scp -r deploy/traefik/. vanidel-vps:/opt/traefik/
# On the server, the first time:
cd /opt/traefik
cp .env.example .env && chmod 600 .env          # set ACME_EMAIL
cp dns.env.example dns.env && chmod 600 dns.env # cPanel API credentials
docker compose up -d
docker compose logs -f traefik
```

When updating, the copy leaves `.env`, `dns.env` and `letsencrypt/` alone. Changes to `dynamic/` apply on their own; changes to `compose.yaml` need `docker compose up -d`.

On the existing VPS, the testing environment's own Traefik must be stopped first, since both bind 80 and 443: [DEPLOYMENT.md §4](../../docs/operations/DEPLOYMENT.md#moving-from-the-testing-environments-own-traefik).

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

Give each router, service and middleware a name unique on the server. Never publish the service's port on the host: Traefik reaches it through the network.

## Choosing the certificate resolver

This VPS's provider drops inbound connections from some of the regions Let's Encrypt validates from, so the HTTP challenge can fail with `During secondary validation: … Timeout during connect` ([DEPLOYMENT.md §4](../../docs/operations/DEPLOYMENT.md#4-traefik-and-https)). The DNS challenge needs no inbound connection:

- Domain DNS on the cPanel account in `dns.env`: use `letsencrypt-dns`.
- Domain DNS elsewhere: try `letsencrypt`; if it fails as above, add a resolver for that DNS host's [provider](https://doc.traefik.io/traefik/https/acme/#providers) in `compose.yaml`, like `letsencrypt-dns`, with its credentials in another env file.
