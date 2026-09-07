/*
 * Redlib service worker
 * ------------------------------------------------------------------
 * Makes the instance installable and usable offline.
 *
 * The `__VERSION__` placeholder is substituted with the crate version
 * when this file is served, so every release gets fresh caches and
 * old ones are pruned automatically on activate.
 *
 * Strategies:
 *   app shell (css/js/font/icons)  cache-first, revalidated in background
 *   proxied media (/img, /thumb…)  cache-first, immutable, capped
 *   navigations (HTML)             network-first, offline fallback
 *
 * Anything that is not a same-origin GET is passed straight through.
 */

const VERSION = "__VERSION__";
const STATIC_CACHE = `redlib-static-${VERSION}`;
const MEDIA_CACHE = `redlib-media-${VERSION}`;
const PAGES_CACHE = `redlib-pages-${VERSION}`;

const OFFLINE_URL = "/offline.html";

/* Kept small on purpose: these are the files every page needs. */
const APP_SHELL = [
	OFFLINE_URL,
	"/style.css",
	"/voyager.css",
	"/manifest.json",
	"/favicon.ico",
	"/logo.png",
	"/apple-touch-icon.png",
	"/touch-icon-iphone.png",
	"/Inter.var.woff2",
];

/* Cache size ceilings, so a long browsing session cannot grow forever. */
const MEDIA_LIMIT = 220;
const PAGES_LIMIT = 60;

/* Never cache these: preferences round-trips and streaming media. */
const BYPASS = [/^\/settings/, /^\/vid\//, /^\/hls\//, /^\/sw\.js$/, /^\/register_sw\.js$/];

/* Reddit media proxied through this instance is content-addressed. */
const MEDIA_PATHS = [/^\/img\//, /^\/thumb\//, /^\/emoji\//, /^\/emote\//, /^\/preview\//, /^\/style\/award_images\//];

self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(STATIC_CACHE);
			/* Individually, so one 404 cannot fail the whole install. */
			await Promise.allSettled(APP_SHELL.map((url) => cache.add(new Request(url, { cache: "reload" }))));
			await self.skipWaiting();
		})(),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const keep = [STATIC_CACHE, MEDIA_CACHE, PAGES_CACHE];
			const names = await caches.keys();
			await Promise.all(names.filter((name) => name.startsWith("redlib-") && !keep.includes(name)).map((name) => caches.delete(name)));

			await self.clients.claim();
		})(),
	);
});

/* Lets the page tell a waiting worker to take over immediately. */
self.addEventListener("message", (event) => {
	if (event.data === "skip-waiting") {
		self.skipWaiting();
	}
});

self.addEventListener("fetch", (event) => {
	const { request } = event;

	if (request.method !== "GET") return;

	/* Range requests (video seeking) must not be served from the cache. */
	if (request.headers.has("range")) return;

	let url;
	try {
		url = new URL(request.url);
	} catch {
		return;
	}

	if (url.origin !== self.location.origin) return;
	if (BYPASS.some((pattern) => pattern.test(url.pathname))) return;

	if (request.mode === "navigate") {
		event.respondWith(handleNavigation(request));
		return;
	}

	if (MEDIA_PATHS.some((pattern) => pattern.test(url.pathname))) {
		event.respondWith(cacheFirst(request, MEDIA_CACHE, MEDIA_LIMIT));
		return;
	}

	if (["style", "script", "font", "image", "manifest"].includes(request.destination)) {
		event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
	}
});

/*
 * HTML is network-first: preferences live in cookies, so a stale page
 * could show the wrong theme or feed. The cache is only a safety net.
 */
async function handleNavigation(request) {
	const cache = await caches.open(PAGES_CACHE);

	try {
		const response = await fetch(request);

		if (response.ok && response.type === "basic") {
			cache.put(request, response.clone()).then(() => trimCache(PAGES_CACHE, PAGES_LIMIT));
		}

		return response;
	} catch {
		const cached = await cache.match(request, { ignoreSearch: false });
		if (cached) return cached;

		const staticCache = await caches.open(STATIC_CACHE);
		const offline = await staticCache.match(OFFLINE_URL);
		if (offline) return offline;

		return new Response("You are offline.", {
			status: 503,
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	}
}

/* Immutable assets: answer from cache, fall back to the network. */
async function cacheFirst(request, cacheName, limit) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	if (cached) return cached;

	const response = await fetch(request);
	if (response.ok) {
		cache.put(request, response.clone()).then(() => trimCache(cacheName, limit));
	}
	return response;
}

/*
 * App shell: serve instantly from cache while refreshing in the
 * background. Versioned query strings mean a new release simply
 * misses the cache and repopulates it.
 */
async function staleWhileRevalidate(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request, { ignoreSearch: true });

	const network = fetch(request)
		.then((response) => {
			if (response.ok) cache.put(request, response.clone());
			return response;
		})
		.catch(() => undefined);

	return cached || (await network) || Response.error();
}

/* Crude FIFO eviction: Cache Storage keeps insertion order. */
async function trimCache(cacheName, limit) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	if (keys.length <= limit) return;

	for (const key of keys.slice(0, keys.length - limit)) {
		await cache.delete(key);
	}
}
