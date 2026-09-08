# Redlib Revamped

> A private front-end to Reddit. Forked from [Redlib](https://github.com/redlib-org/redlib), which itself has its origins in [Libreddit](https://github.com/libreddit/libreddit).

![screenshot](https://i.ibb.co/18vrdxk/redlib-rust.png)

---

**10-second pitch:** Browse Reddit without ads, trackers, or an account, the way [Invidious](https://github.com/iv-org/invidious) does for YouTube. This fork builds on Redlib with a mobile-first "Voyager" layout, offline/installable PWA support, and an opt-in read-only JSON API for building your own client.

- 🚀 Fast: written in Rust for blazing-fast speeds and memory safety
- ☁️ Light: no required JavaScript, no ads, no tracking, no bloat
- 🕵 Private: all requests are proxied through the server, including media
- 🔒 Secure: strong [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) prevents browser requests to Reddit
- 📱 Installable: optional Voyager layout with an offline-capable PWA (service worker, manifest, app shell caching)
- 🔌 Extensible: opt-in JSON API for scripting or building an alternative frontend against this instance

---

## Table of Contents

1. [About this fork](#about-this-fork)
   - [What's different from upstream Redlib](#whats-different-from-upstream-redlib)
2. [Instances](#instances)
3. [About Redlib](#about-redlib)
   - [Built with](#built-with)
   - [How is it different from other Reddit front ends?](#how-is-it-different-from-other-reddit-front-ends)
4. [Comparison](#comparison)
   - [Privacy](#privacy)
5. [Deployment](#deployment)
   - [Docker](#docker)
   - [Podman](#podman)
   - [Binary](#binary)
   - [Building from source](#building-from-source)
   - [Replit/Heroku](#replitheroku)
   - [launchd (macOS)](#launchd-macos)
6. [Configuration](#configuration)
   - [Command Line Flags](#command-line-flags)
   - [Instance settings](#instance-settings)
   - [Default user settings](#default-user-settings)
   - [Voyager layout & PWA](#voyager-layout--pwa)
   - [JSON API](#json-api)
   - [Forward Proxies](#forward-proxies)
7. [Security](#security)
8. [Building](#building)

---

# About this fork

This repository is a personal fork of [Redlib](https://github.com/redlib-org/redlib), maintained independently at [gbrunoo/redlib-revamped](https://github.com/gbrunoo/redlib-revamped). It tracks upstream where practical, but carries changes that don't fit upstream's no-JavaScript, minimal-surface philosophy, so they live here instead.

## What's different from upstream Redlib

- **Voyager layout**: an additional mobile-first layout option (alongside `card`, `clean`, `compact`) modeled after [Voyager for Lemmy](https://github.com/aeharding/voyager) and Apollo-style Reddit clients. Selectable per-user in Settings or as an instance default via `REDLIB_DEFAULT_LAYOUT=voyager`. Every rule is scoped to `body.voyager`, so it has no effect on the other layouts.
- **PWA support**: a service worker, web app manifest, and offline fallback page make the instance installable on mobile and usable with flaky connectivity. Static assets and proxied media are cached; HTML pages are network-first since preferences live in cookies.
- **Opt-in JSON API**: `GET /api/reddit/*path` forwards an allowlisted set of public Reddit paths through this instance's existing OAuth/rate-limit machinery, for anyone scripting against their own instance or building an alternative frontend. Disabled by default (see [JSON API](#json-api)).
- **wreq/BoringSSL networking stack**: outbound requests use [wreq](https://github.com/0x676e67/wreq) with BoringSSL (built from source) instead of the previous client, for closer TLS fingerprint parity with Reddit's official apps.

Everything else — routing, templates, config surface, deployment story — is inherited from upstream Redlib and documented below.

---

# Instances

> [!TIP]
> 🔗 **Want to automatically redirect Reddit links to Redlib? Use [LibRedirect](https://github.com/libredirect/libredirect) or [Privacy Redirect](https://github.com/SimonBrazell/privacy-redirect)!**

This fork isn't part of the public instance list; it's meant for self-hosting (see [Deployment](#deployment)). For official Redlib instances, an up-to-date table is available in [Markdown](https://github.com/redlib-org/redlib-instances/blob/main/instances.md) and [machine-readable JSON](https://github.com/redlib-org/redlib-instances/blob/main/instances.json) in the [redlib-instances](https://github.com/redlib-org/redlib-instances) repository.

---

# About Redlib

> [!NOTE]
> Find upstream Redlib on 💬 [Matrix](https://matrix.to/#/#redlib:matrix.org), 🐋 [Quay.io](https://quay.io/repository/redlib/redlib), :octocat: [GitHub](https://github.com/redlib-org/redlib), and 🦊 [GitLab](https://gitlab.com/redlib/redlib).

Redlib provides an easier way to browse Reddit, without the ads, trackers, and bloat. It was inspired by other alternative front-ends to popular services such as [Invidious](https://github.com/iv-org/invidious) for YouTube, [Nitter](https://github.com/zedeus/nitter) for Twitter, and [Bibliogram](https://sr.ht/~cadence/bibliogram/) for Instagram.

Redlib implements most of Reddit's (signed-out) functionality but still lacks [a few features](https://github.com/redlib-org/redlib/issues).

## Built with

- [Rust](https://www.rust-lang.org/) - Programming language
- [Hyper](https://github.com/hyperium/hyper) - HTTP server
- [wreq](https://github.com/0x676e67/wreq) - HTTP client with BoringSSL, used for outbound Reddit requests
- [Askama](https://github.com/askama-rs/askama) - Templating engine

## How is it different from other Reddit front ends?

### Teddit

Teddit is another open source alternative frontend to Reddit, unrelated to Redlib. Redlib is themed around Reddit's redesign, whereas Teddit sticks closer to Reddit's old design; which one fits depends on preference. Redlib is written in Rust for speed and memory safety, using Hyper as its HTTP server.

### Libreddit

Redlib originated as a fork of Libreddit; the name changed to avoid trademark issues, since Reddit only permits use of their name when structured as "XYZ For Reddit." Technical improvements made along the way include:

- **OAuth token spoofing**: to work around Reddit's rate limits, requests mimic the official Android client's OAuth flow (iOS was considered but dropped due to tighter content restrictions for anonymous clients).
- **Token refreshing**: the authentication token is refreshed every 24 hours, matching the official Android app's behavior.
- **HTTP header mimicking**: as many of the official app's headers as possible are forwarded to reduce the chance of Reddit blocking Redlib's traffic.

---

# Comparison

## Privacy

### Reddit

Per Reddit's [privacy policy](https://www.redditinc.com/policies/privacy-policy) and [cookie notice](https://www.redditinc.com/policies/cookies), Reddit logs IP address, user-agent, browser/OS, referral URLs, device IDs and settings, pages visited, links clicked, and search terms; it can collect location via GPS, Bluetooth, or IP address (where consented); and it sets cookies for authentication, functionality, analytics, advertising, and third-party tracking.

### Redlib

- **Logging**: in production (binary, Docker, or an official instance), Redlib logs nothing. When run from source in debug mode, it logs fetched post IDs to aid troubleshooting.
- **Cookies**: Redlib uses optional, first-party cookies to store settings chosen in the settings menu. They hold no personal data and aren't used cross-site.
- **PWA cache** (this fork's Voyager layout): the service worker caches static assets and already-proxied media locally in the browser, entirely client-side. It doesn't send anything to a third party, and can be cleared like any other site data.

---

# Deployment

This section covers ways to run this fork. Using [Docker](#docker) is recommended for production; substitute your own image if you build and publish one, since this fork isn't published to a public registry.

For configuration options, see [Configuration](#configuration).

## Docker

[Docker](https://www.docker.com) lets you run containerized applications without depending on what's installed on the host.

Official Redlib images (upstream, without this fork's changes) are available at [quay.io/redlib/redlib](https://quay.io/repository/redlib/redlib) for `amd64`, `arm64`, and `armv7`. To run this fork in Docker, build your own image from the included `Dockerfile.alpine` or `Dockerfile.ubuntu`, or build the binary and use the plain `Dockerfile` as a template.

```bash
docker build -f Dockerfile.alpine -t redlib-revamped .
docker run -d --name redlib-revamped -p 8080:8080 redlib-revamped
```

### Docker Compose

Copy `compose.yaml`, point `image:` at your own build (or use `compose.dev.yaml` to build locally), and adjust ports as needed.

```bash
docker compose up -d
docker logs -f redlib
```

## Podman

[Podman](https://podman.io/) runs the same containers rootlessly. A Quadlet unit is provided in `redlib.container`.

```bash
cp redlib.container .env.example .config/containers/systemd/
systemctl --user daemon-reload
systemctl --user start redlib.service
systemctl --user status redlib.service
```

> [!IMPORTANT]
> Requires a systemd-based distro with Podman installed, and `loginctl enable-linger <username>` so the service can run without an active login session.

## Binary

Build from source (see below) or grab a binary from your own release pipeline; this fork does not publish prebuilt binaries.

```bash
sudo chmod +x redlib && sudo chown root:root redlib
sudo cp ./redlib /usr/bin/redlib
redlib
```

> [!IMPORTANT]
> If proxying through NGINX, add `proxy_http_version 1.1;` above your `proxy_pass` line.

### Running as a systemd service

Use `contrib/redlib.service` (install to `/etc/systemd/system/redlib.service`). Configure it via environment variables in `/etc/redlib.conf` (template: `contrib/redlib.conf`).

## Building from source

```bash
git clone https://github.com/gbrunoo/redlib-revamped && cd redlib-revamped
cargo run
```

See [Building](#building) for platform-specific build dependencies (this project builds BoringSSL from source).

## Replit/Heroku

> [!WARNING]
> Free hosting options are not private and will monitor usage to prevent abuse. Fine for a quick, disposable setup; not recommended otherwise.

Deploy buttons aren't wired up for this fork; use the [upstream repository](https://github.com/redlib-org/redlib) if you want one-click Replit/Heroku deployment of vanilla Redlib.

## launchd (macOS)

```bash
cp contrib/redlib.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/redlib.plist
```

---

# Configuration

Configure via environment variables:

```bash
REDLIB_DEFAULT_SHOW_NSFW=on redlib
```

```bash
REDLIB_DEFAULT_WIDE=on REDLIB_DEFAULT_THEME=dark redlib
```

Or via a `redlib.toml` file:

```toml
REDLIB_DEFAULT_WIDE = "on"
REDLIB_DEFAULT_USE_HLS = "on"
```

> [!NOTE]
> With Docker CLI or Compose, copy `.env.example` to `.env` and edit it. Docker CLI: add `--env-file .env`. Compose already references it via `env_file: .env` in `compose.yaml`.

## Command Line Flags

- `-4`, `--ipv4-only`: Listen on IPv4 only.
- `-6`, `--ipv6-only`: Listen on IPv6 only.
- `-r`, `--redirect-https`: Redirect all HTTP requests to HTTPS (no longer functional).
- `-a`, `--address <ADDRESS>`: Address to listen on. Default `[::]`.
- `-p`, `--port <PORT>`: Port to listen on. Default `8080`.
- `-H`, `--hsts <EXPIRE_TIME>`: HSTS max-age header. Default `604800`.

## Instance settings

Set with `REDLIB_{X}`:

| Name                      | Possible values | Default value          | Description                                                                                                |
|---------------------------|------------------|-------------------------|-------------------------------------------------------------------------------------------------------------|
| `SFW_ONLY`                | `["on", "off"]`  | `off`                   | Enables SFW-only mode for the instance, filtering all NSFW content.                                         |
| `BANNER`                  | String           | (empty)                 | Banner message displayed on the instance info page.                                                          |
| `ROBOTS_DISABLE_INDEXING` | `["on", "off"]`  | `off`                   | Disables indexing of the instance by search engines.                                                         |
| `PUSHSHIFT_FRONTEND`      | String           | `undelete.pullpush.io`  | Pushshift frontend used for "removed" links.                                                                 |
| `PORT`                    | Integer 0-65535  | `8080`                  | The **internal** port Redlib listens on.                                                                     |
| `ENABLE_RSS`              | `["on", "off"]`  | `off`                   | Enables RSS feed generation.                                                                                 |
| `FULL_URL`                | String           | (empty)                 | Full base URL, currently only needed for RSS.                                                                |
| `ENABLE_JSON_API`         | `["on", "off"]`  | `off`                   | Exposes the read-only JSON API at `/api/reddit/*`. See [JSON API](#json-api).                                |
| `API_CORS_ORIGIN`         | String           | (empty)                 | `Access-Control-Allow-Origin` value for `/api/reddit/*`. Unset means no CORS header (same-origin only).      |

## Default user settings

Set with `REDLIB_DEFAULT_{Y}`:

| Name                                | Possible values                                                                                                                                                                                                                 | Default value |
|-------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| `THEME`                             | `["system", "light", "dark", "black", "dracula", "nord", "laserwave", "violet", "gold", "rosebox", "gruvboxdark", "gruvboxlight", "tokyoNight", "icebergDark", "doomone", "libredditBlack", "libredditDark", "libredditLight"]` | `system`      |
| `FRONT_PAGE`                        | `["default", "popular", "all"]`                                                                                                                                                                                                 | `default`     |
| `LAYOUT`                            | `["card", "clean", "compact", "voyager"]`                                                                                                                                                                                       | `card`        |
| `WIDE`                              | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |
| `POST_SORT`                         | `["hot", "new", "top", "rising", "controversial"]`                                                                                                                                                                              | `hot`         |
| `COMMENT_SORT`                      | `["confidence", "top", "new", "controversial", "old"]`                                                                                                                                                                          | `confidence`  |
| `BLUR_SPOILER`                      | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |
| `SHOW_NSFW`                         | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |
| `BLUR_NSFW`                         | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |
| `USE_HLS`                           | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |
| `HIDE_HLS_NOTIFICATION`             | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |
| `AUTOPLAY_VIDEOS`                   | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |
| `SUBSCRIPTIONS`                     | `+`-delimited list of subreddits (`sub1+sub2+sub3+...`)                                                                                                                                                                         | _(none)_      |
| `HIDE_AWARDS`                       | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |
| `DISABLE_VISIT_REDDIT_CONFIRMATION` | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |
| `HIDE_SCORE`                        | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |
| `HIDE_SIDEBAR_AND_SUMMARY`          | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |
| `FIXED_NAVBAR`                      | `["on", "off"]`                                                                                                                                                                                                                 | `on`          |
| `REMOVE_DEFAULT_FEEDS`              | `["on", "off"]`                                                                                                                                                                                                                 | `off`         |

## Voyager layout & PWA

Set `voyager` as the layout (per-user in Settings, or instance-wide via `REDLIB_DEFAULT_LAYOUT=voyager`) to get a mobile-first, Apollo/Voyager-inspired skin: a sticky top bar, a bottom tab bar (Home/Popular/All/Search/Settings), and inline comment scores. It's purely presentational — CSS and template conditionals scoped to `body.voyager` — and doesn't change routing, data, or behavior for other layouts.

Regardless of layout, the instance registers a service worker (`/sw.js`) and serves a web app manifest (`/manifest.json`), so the site can be installed and used offline:

- Static assets (CSS/JS/fonts/icons) are cached and revalidated in the background.
- Proxied media (`/img`, `/thumb`, `/preview`, etc.) is cached as immutable, content-addressed data, capped in size.
- HTML navigations are network-first (preferences live in cookies, so a stale cached page could show the wrong theme/feed) with an offline fallback page (`/offline.html`).
- Cache names include the crate version, so each release prunes old caches on activation.

No configuration is required to enable the PWA layer; it's part of the base install.

## JSON API

`GET /api/reddit/*path` forwards `path` (plus query string) to Reddit as `https://reddit's-oauth-endpoint/{path}.json`, through this instance's existing `client::json`, inheriting its OAuth token, rate-limit accounting, and retry behavior. The browser never talks to Reddit directly.

- **Disabled by default.** Set `REDLIB_ENABLE_JSON_API=on` to enable it.
- **Allowlisted, not an open proxy.** Only these path prefixes are forwarded: `r/`, `user/`, `comments/`, `subreddits/`, `api/info`, `by_id/`, `search`, `duplicates/`, `api/morechildren`. Path traversal (`..`) and absolute paths are rejected.
- **Rate limit cost.** This serves the same public data the HTML frontend already renders, but it's far easier to script against, so it's opt-in and spends the instance's Reddit rate limit like any other request.
- **CORS.** Unset by default (same-origin only). Set `REDLIB_API_CORS_ORIGIN` to a single origin (e.g. `http://localhost:5173`) to allow a separate frontend to call it directly; `OPTIONS` preflight is handled automatically when an origin is configured.
- **No response translation.** Responses are raw Reddit JSON; mapping to a client's own types is left to that client.

This exists as groundwork for building a JS-based frontend against a Redlib instance (e.g. one using the raw numeric fields Reddit returns, rather than the pre-formatted strings the HTML templates render) without that frontend needing its own Reddit credentials.

## Forward Proxies

Redlib [supports](https://docs.rs/wreq/latest/wreq/#proxies) proxy usage via the standard `HTTP_PROXY` and `HTTPS_PROXY` environment variables. Use `ALL_PROXY` to set both at once.

- `http://` — HTTP proxy
- `https://` — HTTPS proxy
- `socks4://` / `socks4a://` — SOCKS4(a) proxy
- `socks5://` / `socks5h://` — SOCKS5(h) proxy

---

# Security

This project uses [BoringSSL](https://boringssl.googlesource.com/boringssl/), built from source with patches from the [wreq](https://github.com/0x676e67/wreq) project. Certificates are validated against the embedded Mozilla trust store.

# Building

Redlib uses [`boring-sys2`](https://crates.io/crates/boring-sys2), so building it requires building BoringSSL from source.

## Linux/macOS

See the [BoringSSL build docs](https://github.com/google/boringssl/blob/main/BUILDING.md) for dependencies.

## Windows

Install MSVC (likely already present for Rust), then:

```pwsh
# Make sure to update your PATH; some installers don't do that by default, hence -i (interactive mode).
winget install -i Kitware.CMake
winget install -i NASM.NASM
winget install -i LLVM.LLVM

# For tests.
winget install GoLang.Go
```
