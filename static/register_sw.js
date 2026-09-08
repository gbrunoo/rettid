/*
 * Registers the Redlib service worker.
 *
 * Kept in its own file because the Content-Security-Policy only allows
 * scripts from 'self' — no inline script tags.
 */
(function () {
	"use strict";

	if (!("serviceWorker" in navigator)) return;

	window.addEventListener("load", function () {
		navigator.serviceWorker
			.register("/sw.js", { scope: "/" })
			.then(function (registration) {
				/* Apply an updated worker as soon as it is ready. */
				registration.addEventListener("updatefound", function () {
					var installing = registration.installing;
					if (!installing) return;

					installing.addEventListener("statechange", function () {
						if (installing.state === "installed" && navigator.serviceWorker.controller) {
							installing.postMessage("skip-waiting");
						}
					});
				});
			})
			.catch(function (error) {
				/* Registration failures are non-fatal: the site works without it. */
				console.warn("Service worker registration failed:", error);
			});
	});
})();
