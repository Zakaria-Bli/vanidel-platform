Routes to services that are not Docker containers, one YAML file each (Traefik's file provider,
reloaded on change). `vanidel-testing.yml` routes the systemd testing app. Docker services declare
their routes with labels instead and need nothing here.
