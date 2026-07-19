#!/bin/sh
# Prints the DOCKER_HOST value needed for Docker-API-based tools (e.g. the
# Supabase CLI) to reach podman when `docker` is just a shell alias to
# `podman` rather than a real Docker daemon socket.
#
# Usage: export DOCKER_HOST=$(./scripts/podman-docker-host.sh)
podman machine inspect podman-machine-default --format '{{.ConnectionInfo.PodmanSocket.Path}}' | sed 's#^#unix://#'
