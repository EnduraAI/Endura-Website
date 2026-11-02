/* Endura 7.0 behaviour: header state, scroll reveals. No dependencies. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header: hairline state once the page scrolls. */
  var header = document.querySelector(".site-nav");
  var cover = document.querySelector("[data-cover], .page-hero, .article-header");
  var coverPage = document.body.classList.contains("has-cover") || document.body.classList.contains("page-home");
  if (header && cover && coverPage) {
    var frame = 0;
    var update = function () {
      frame = 0;
      var hb = header.getBoundingClientRect().height;
      var c = document.querySelector("[data-cover]") || cover;
      if (!c) return;
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    var queue = function () { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue, { passive: true });
    update();
  }

  /* Reveal on scroll. Content stays visible if anything here fails. */
  var items = document.querySelectorAll("[data-reveal]");
  if (items.length && "IntersectionObserver" in window && !reduce) {
    doc.classList.add("js-reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add("is-in");
      io.observe(el);
    });
    addEventListener("beforeprint", function () { items.forEach(function (el) { el.classList.add("is-in"); }); });
  }
})();
