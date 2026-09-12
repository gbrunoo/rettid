//! Read-only Reddit JSON API.
//!
//! Exposes the same public data the HTML frontend already renders, but as raw
//! Reddit JSON, so a JavaScript client (the Voyager-based frontend) can consume
//! it. Requests go through [`crate::client::json`], which means they inherit the
//! instance's OAuth token, rate-limit accounting and retry behaviour — the
//! browser never talks to Reddit directly.
//!
//! Translation into the shape the frontend wants is deliberately *not* done
//! here. This stays a thin, authenticated passthrough; the mapping lives in the
//! frontend where its types are defined.
//!
//! Disabled unless `REDLIB_ENABLE_JSON_API=on`, because it spends the
//! instance's Reddit rate limit and, unlike the HTML pages, is convenient to
//! script against.

use crate::client::json;
use crate::config::get_setting;
use crate::server::RequestExt;
use hyper::{Body, Request, Response, StatusCode};

/// Reddit path prefixes this endpoint is willing to forward.
///
/// An allowlist rather than an open proxy: it keeps the surface to public
/// listings and comment threads, and stops the endpoint being used to reach
/// arbitrary Reddit endpoints with the instance's credentials.
const ALLOWED_PREFIXES: [&str; 9] = [
	"r/",               // subreddit listings, comments, about, search
	"user/",            // profile listings
	"comments/",        // permalinks without a subreddit
	"subreddits/",      // subreddit discovery
	"api/info",         // lookup by fullname
	"by_id/",           // lookup by fullname
	"search",           // site-wide search
	"duplicates/",      // other discussions
	"api/morechildren", // "load more comments" expansion
];

pub fn is_enabled() -> bool {
	matches!(get_setting("REDLIB_ENABLE_JSON_API").as_deref(), Some("on"))
}

fn cors_origin() -> Option<String> {
	get_setting("REDLIB_API_CORS_ORIGIN")
}

/// Attach CORS headers when an allowed origin is configured.
fn with_cors(mut res: Response<Body>) -> Response<Body> {
	if let Some(origin) = cors_origin() {
		let headers = res.headers_mut();
		if let Ok(val) = origin.parse() {
			headers.insert("Access-Control-Allow-Origin", val);
		}
		if let Ok(val) = "GET, OPTIONS".parse() {
			headers.insert("Access-Control-Allow-Methods", val);
		}
		if let Ok(val) = "Vary".parse() {
			// Caches must not share a CORS-enabled response across origins.
			headers.insert("Vary", val);
		}
	}
	res
}

fn error(status: StatusCode, message: &str) -> Response<Body> {
	let body = serde_json::json!({ "error": message }).to_string();

	with_cors(
		Response::builder()
			.status(status)
			.header("content-type", "application/json")
			.body(body.into())
			.unwrap_or_default(),
	)
}

/// Preflight handler, needed once a CORS origin is configured.
pub async fn preflight(_req: Request<Body>) -> Result<Response<Body>, String> {
	Ok(with_cors(Response::builder().status(StatusCode::NO_CONTENT).body(Body::empty()).unwrap_or_default()))
}

/// `GET /api/reddit/*path` — forward `path` (plus query string) to Reddit.
pub async fn reddit_json(req: Request<Body>) -> Result<Response<Body>, String> {
	if !is_enabled() {
		return Ok(error(
			StatusCode::NOT_FOUND,
			"The JSON API is disabled on this instance. Set REDLIB_ENABLE_JSON_API=on to enable it.",
		));
	}

	let path = req.param("path").unwrap_or_default();

	// Reject traversal and protocol-relative trickery before anything else.
	if path.contains("..") || path.starts_with('/') {
		return Ok(error(StatusCode::BAD_REQUEST, "Invalid path"));
	}

	if !ALLOWED_PREFIXES.iter().any(|prefix| path.starts_with(prefix)) {
		return Ok(error(StatusCode::FORBIDDEN, "That Reddit path is not exposed by this endpoint"));
	}

	let query = req.uri().query().unwrap_or_default();
	let separator = if query.is_empty() { "" } else { "?" };

	// `json` expects a leading slash and Reddit's .json suffix.
	let upstream = format!("/{path}.json{separator}{query}");

	match json(upstream, false).await {
		Ok(value) => Ok(with_cors(
			Response::builder()
				.status(StatusCode::OK)
				.header("content-type", "application/json")
				// Short cache: feeds move fast, but this absorbs the
				// duplicate requests a client makes while navigating.
				.header("Cache-Control", "public, max-age=30")
				.body(value.to_string().into())
				.unwrap_or_default(),
		)),
		Err(msg) => Ok(error(StatusCode::BAD_GATEWAY, &msg)),
	}
}
