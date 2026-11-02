/* decomm.ai pulse (7.1): the supplied icon (429 dots, ember centre), alive for a moment.
   "A single pulse inside the ring. The asset, centred." When the icon first comes into view, two
   stippled ripples leave the ember centre and the ring answers as they pass (about 4.3 s in all).
   Then it rests as the still icon. Hovering or tapping the icon plays it once more.
   Reduced motion: the icon, still. No script: the SVG icon in the page. */
(function () {
  "use strict";
  var hosts = document.querySelectorAll("[data-pulse]");
  if (!hosts.length || !window.requestAnimationFrame) return;
  var DAI = {"W":1200,"d":"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","ember":[600.0,600.0,66.4]};
  if (!DAI) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TAU = Math.PI * 2, C = DAI.W / 2;
  // ring dots, packed as little-endian uint16 triples: x*10, y*10, r*100
  var bin = atob(DAI.d), ring = [], mean = 0;
  for (var j = 0; j + 5 < bin.length; j += 6) {
    var x = (bin.charCodeAt(j) | bin.charCodeAt(j + 1) << 8) / 10, y = (bin.charCodeAt(j + 2) | bin.charCodeAt(j + 3) << 8) / 10;
    var rad = Math.hypot(x - C, y - C);
    ring.push({ x: x, y: y, r: (bin.charCodeAt(j + 4) | bin.charCodeAt(j + 5) << 8) / 100, rad: rad });
    mean += rad;
  }
  mean /= ring.length;
  var RIP = 110, ripple = [];
  for (var i = 0; i < RIP; i++) { var a = i / RIP * TAU; ripple.push({ a: a + Math.sin(i * 7.3) * 0.02, j: Math.sin(i * 12.9898) * 0.5 }); }
  var GAP = 1700, TRAVEL = 2600, RUN = GAP + TRAVEL;   // two fronts, 1.7 s apart; the run ends after 4.3 s

  Array.prototype.forEach.call(hosts, function (host) {
    var canvas = host.querySelector("canvas"), ctx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;
    var size = 1, dpr = 1, s = 1, ink = "#F3F0EA", visible = false, running = false, played = false, start = -1;
    function readInk() { ink = getComputedStyle(host).getPropertyValue("--pulse-ink").trim() || "#F3F0EA"; }
    function resize() {
      size = Math.max(1, Math.round(host.getBoundingClientRect().width));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.height = Math.round(size * dpr);
      s = size / DAI.W * dpr;
    }
    function draw(t) {                                // t: ms into the current run; -1 draws the resting icon
      var live = t >= 0 && t < RUN;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var fronts = [];
      if (live) for (var k = 0; k < 2; k++) {
        var ph = t - k * GAP;
        if (ph >= 0 && ph < TRAVEL) fronts.push(ph / TRAVEL);
      }
      // ring
      ctx.fillStyle = ink; ctx.beginPath();
      for (var i = 0; i < ring.length; i++) {
        var d = ring[i], boost = 1;
        for (var f = 0; f < fronts.length; f++) {
          var R = 70 + fronts[f] * (mean + 40 - 70), gap = Math.abs(d.rad - R);
          if (gap < 46) boost = Math.max(boost, 1 + 0.55 * (1 - gap / 46));
        }
        var rr = Math.max(0.45 * dpr, d.r * s * boost);
        ctx.moveTo(d.x * s + rr, d.y * s); ctx.arc(d.x * s, d.y * s, rr, 0, TAU);
      }
      ctx.fill();
      // ripples: stippled circles leaving the centre
      for (var f2 = 0; f2 < fronts.length; f2++) {
        var p = fronts[f2], R2 = 70 + p * (mean + 40 - 70);
        ctx.globalAlpha = Math.max(0, (1 - p) * 0.75);
        ctx.beginPath();
        for (var q = 0; q < ripple.length; q++) {
          var w = ripple[q], rr2 = R2 + w.j * 8 * p, px = C + Math.cos(w.a) * rr2, py = C + Math.sin(w.a) * rr2, rd = Math.max(0.4 * dpr, 2.6 * s);
          ctx.moveTo(px * s + rd, py * s); ctx.arc(px * s, py * s, rd, 0, TAU);
        }
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // the ember: one breath per run, then still
      var e = DAI.ember, pr = live ? 1 + 0.05 * Math.sin(t / RUN * TAU) : 1;
      ctx.fillStyle = "#E87722"; ctx.beginPath(); ctx.arc(e[0] * s, e[1] * s, e[2] * s * pr, 0, TAU); ctx.fill();
      return live;
    }
    var last = 0;
    function loop(now) {
      if (!visible || document.hidden) { running = false; draw(-1); return; }
      if (start < 0) { start = now; last = 0; }        // the run's clock starts on its first frame
      if (now - last >= 33) { last = now; if (!draw(now - start)) { running = false; return; } }   // about 30 fps, only during a run
      requestAnimationFrame(loop);
    }
    function play() {
      if (reduce || running) return;
      start = -1; played = true; running = true; requestAnimationFrame(loop);
    }
    readInk(); resize(); draw(-1);                    // the still icon, straight away
    host.classList.add("pulse-live");
    if (!reduce) {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          var e = en[en.length - 1];                    // entries can arrive batched; the last one is current
          visible = e.isIntersecting;
          if (visible && !played && e.intersectionRatio >= 0.45) play();
          if (!visible && running) { running = false; draw(-1); }   // left the screen mid-run: rest
        }, { threshold: [0, 0.45] }).observe(host);
      } else { visible = true; play(); }
      host.addEventListener("pointerenter", function () { if (visible) play(); });
      host.addEventListener("click", function () { if (visible) play(); });
    }
    var rt = 0;
    addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (!running) draw(-1); }, 120); }, { passive: true });
    new MutationObserver(function () { readInk(); if (!running) draw(-1); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  });
})();
