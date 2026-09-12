---
name: container-ops
description: Manages Docker, Podman, and docker-compose tasks for building, running, and deploying the Rettid application. Use for container-related workflows and dev environments.
disable-model-invocation: false
---

# Container Operations & Docker Hub Releases for Rettid

You are the expert for container builds, local development with Docker/Podman, compose setups, and especially publishing to Docker Hub so end users can simply `docker pull` the latest private Reddit frontend.

## Docker Hub Publishing (Critical Release Step)
- Image: `docker.io/gab360/rettid` (or override via `vars.DOCKERHUB_NAMESPACE`)
- Multi-arch: linux/amd64 and linux/arm64 (native runners only; armv7 intentionally skipped due to BoringSSL compile time)
- Primary Dockerfile: `Dockerfile.ubuntu` (used in CI for releases)
- Other variants: `Dockerfile`, `Dockerfile.alpine` for local testing or specific needs
- Release process: Push a `v*` tag → GitHub Actions (`main-docker.yml`) builds, creates manifest list, and pushes with semver tags (`vX.Y.Z`, `vX.Y`, `latest`, sha)
- Secrets required in repo: `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` (access token, not password)

When helping with a release:
1. Ensure version in `Cargo.toml` is bumped
2. Create annotated git tag `vX.Y.Z`
3. Push tag → CI handles Docker Hub update automatically
4. Verify image with `docker buildx imagetools inspect docker.io/gab360/rettid:latest`

## Local Docker Usage (Not for Daily Development)
Normal day-to-day development uses `cargo run` / `cargo check` (see `rust-dev` skill).

You only need Docker locally when:
- Reproducing a bug that only appears inside the container
- Verifying the exact image users will get before cutting a release tag
- Working on compose.yaml or Dockerfile changes

Useful commands in those cases:
- `docker compose -f compose.dev.yaml up --build` (containerized dev with hot reload)
- `docker compose -f compose.yaml up` (production-like self-hosting test)
- `docker build -f Dockerfile.ubuntu -t rettid:test .` then `docker run -p 8080:8080 rettid:test`

## User-Facing Self-Hosting (Emphasize Simplicity)
End users should be able to:
```bash
docker pull gab360/rettid:latest
docker run -d -p 8080:8080 gab360/rettid:latest
```
or use the provided `compose.yaml`.

Never suggest complicated build steps for end users — the whole point of this project is "pull and run a tracker/ad-free Reddit frontend".

## Common Commands
- Inspect published image: `docker buildx imagetools inspect gab360/rettid:vX.Y.Z`
- Local multi-arch build test: `docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.ubuntu --load -t rettid:local .`
- Prune build cache after BoringSSL changes: `docker builder prune`

Always keep the "simple pull from Docker Hub" promise in mind when giving instructions.