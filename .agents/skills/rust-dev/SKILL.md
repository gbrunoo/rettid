---
name: rust-dev
description: Helps with Rust development, building, testing, linting, formatting, and running the Rettid server. Use for cargo commands and Rust-specific maintenance in this project.
disable-model-invocation: false
---

# Rust Development for Rettid

Expert Rust + Askama assistance for the Rettid Reddit frontend (private, no trackers/ads, Docker-distributed).

## Daily Commands
- `cargo check` — fast compile check after edits
- `cargo clippy -- -D warnings` — lint (required before PRs)
- `cargo fmt` — format (run before committing)
- `cargo test` — run tests
- `cargo run` — local dev server (listens on 8080 by default)
- `cargo build --release` — optimized binary (note: BoringSSL compile is slow)

## Important Context
- Heavy crypto dependency (BoringSSL via wreq) makes full `cargo build --release` slow locally. For day-to-day work use `cargo check`, `cargo clippy`, and `cargo run`. Only build Docker images when you specifically need to test the container (see container-ops skill).
- Templates live in `templates/`, static assets in `static/`.
- All config via `REDLIB_*` env vars or config file (see README).
- When making code changes, always run `cargo check` + `cargo clippy` and verify the dev server still starts cleanly.
- Normal testing of new features is done with `cargo run`. Build a local Docker image only when you need to verify behavior inside the exact container that users will receive (rare for routine development).

## When Working on Features
- Test UI changes (Voyager layout, PWA, API) directly with `cargo run` and a browser.
- Keep the "simple Docker pull for users" promise: new features must not break the published `gab360/rettid` image experience. The Docker image is produced by GitHub Actions on release, not locally.

Prefer small, reviewable diffs. After edits, suggest running the relevant checks.
