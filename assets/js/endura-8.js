/* Endura 8.0 behaviour: the header turns from clear (over the photograph or title band) to a solid bar once the page moves. No dependencies. */
(function () {
  "use strict";
  var header = document.querySelector(".hd");
  if (header) {
    var frame = 0;
    var update = function () { frame = 0; header.classList.toggle("is-scrolled", window.scrollY > 24); };
    var queue = function () { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue, { passive: true });
    update();
  }
})();
/* the scope finder moves focus to its result, so keyboard and screen reader users land on it */
(function () {
  var form = document.getElementById("scopeFinderForm"), title = document.getElementById("scopeResultTitle"), box = document.getElementById("scopeFinderResult");
  if (!form || !title || !box) return;
  title.setAttribute("tabindex", "-1");
  form.addEventListener("submit", function () { setTimeout(function () { if (!box.hidden) title.focus(); }, 0); });
})();
