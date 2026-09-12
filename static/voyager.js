/*
 * Collapsible search toggle for the Voyager layout.
 *
 * The search form (#searchbox) starts collapsed; tapping the search icon in
 * the top bar reveals it and focuses the input, tapping it again, pressing
 * Escape, or clicking/tapping anywhere outside the bar closes it. Kept in
 * its own file — like register_sw.js — because the Content-Security-Policy
 * only allows scripts from 'self', so this can't be an inline <script>, and
 * it is only loaded when prefs.layout == "voyager".
 *
 * Non-fatal by design: if #search_toggle or #searchbox are missing for any
 * reason, this just does nothing. The search form still works as a normal,
 * always-visible form without it.
 */
(function () {
	"use strict";

	var toggle = document.getElementById("search_toggle");
	var nav = toggle ? toggle.closest("nav") : null;
	var searchbox = document.getElementById("searchbox");

	if (!toggle || !nav || !searchbox) return;

	/* Only collapse the search row once this script is confirmed running;
	 * see the matching comment on nav.js_search in voyager.css. */
	nav.classList.add("js_search");

	function isOpen() {
		return nav.classList.contains("search_open");
	}

	function open() {
		nav.classList.add("search_open");
		toggle.setAttribute("aria-expanded", "true");
		var input = searchbox.querySelector("input[type='text']");
		if (input) input.focus();
	}

	function close() {
		nav.classList.remove("search_open");
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
		if (nav.contains(event.target)) return;
		close();
	});

	document.addEventListener("keydown", function (event) {
		if (event.key === "Escape" && isOpen()) close();
	});
})();
