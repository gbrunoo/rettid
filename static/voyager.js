/*
 * Search toggle for the Voyager layout, driven from the bottom tab bar.
 *
 * The top bar's search form (#searchbox) is hidden by default (see
 * voyager.css). Tapping the Search icon in the bottom tab bar reveals it and
 * focuses the input; tapping it again, pressing Escape, or clicking/tapping
 * anywhere outside the top bar closes it again. Kept in its own file — like
 * register_sw.js — because the Content-Security-Policy only allows scripts
 * from 'self', so this can't be an inline <script>, and it is only loaded
 * when prefs.layout == "voyager".
 *
 * Non-fatal by design: if #tab_search_toggle or #searchbox are missing for
 * any reason, this just does nothing, and the <noscript> fallback link to
 * /search in the tab bar (hidden here once this script confirms it is
 * running) remains the way to reach search.
 */
(function () {
	"use strict";

	var toggle = document.getElementById("tab_search_toggle");
	var searchbox = document.getElementById("searchbox");
	var topNav = searchbox ? searchbox.closest("nav") : null;

	if (!toggle || !searchbox || !topNav) return;

	function isOpen() {
		return topNav.classList.contains("search_open");
	}

	function open() {
		topNav.classList.add("search_open");
		toggle.setAttribute("aria-expanded", "true");
		var input = searchbox.querySelector("input[type='text']");
		if (input) input.focus();
	}

	function close() {
		topNav.classList.remove("search_open");
		toggle.setAttribute("aria-expanded", "false");
	}

	toggle.addEventListener("click", function (event) {
		event.stopPropagation();
		if (isOpen()) {
			close();
		} else {
			open();
		}
	});

	document.addEventListener("click", function (event) {
		if (!isOpen()) return;
		/* Clicks on the toggle itself are handled above and must not also
		 * trigger this close — stopPropagation on the toggle's own listener
		 * already prevents that, so nothing extra is needed here. Clicks
		 * inside the (now open) top bar must not close it either. */
		if (topNav.contains(event.target)) return;
		close();
	});

	document.addEventListener("keydown", function (event) {
		if (event.key === "Escape" && isOpen()) close();
	});
})();
