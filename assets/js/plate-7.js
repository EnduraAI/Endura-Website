/* Endura 7.1 hero plate: an offshore platform in elevation, stippled, inside the Endura ring.
   The ring, arc and ember point are the supplied mark (mark-geometry.json, 521 dots).
   The platform is a weighted-Voronoi stipple of a generic fixed platform (illustrative only).
   Intro (2.5 s): the ring is plotted clockwise, the platform streams in from the ring, the ember
   point closes it. Then the plate settles and the loop stops: nothing moves unless the visitor
   moves the pointer over it, scrolls, or presses Replay. Reduced motion: the finished plate, still.
   No canvas: the static plate (ring + stippled platform image) stays in place. */
(function () {
  "use strict";
  var host = document.querySelector("[data-plate]");
  var root = document.documentElement;
  function giveUp() { root.classList.remove("ring-intro"); if (host) host.classList.add("plate-static"); }
  if (!host || !window.Path2D) { giveUp(); return; }
  var canvas = host.querySelector("canvas");
  var ctx = canvas && canvas.getContext && canvas.getContext("2d");
  if (!ctx) { giveUp(); return; }
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var seen = false;
  try { seen = sessionStorage.getItem("endura-ring") === "1"; } catch (e) {}

  var GEOMETRY = {"d":"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","arc":"M250.1 65.2 A240 240 0 0 1 420.0 92.2","arcStroke":9.6,"accent":[462.4,123.3,19.0]};
  var PLATE = {"d":"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","sea":572,"bed":780,"deck":452};
  try { start(GEOMETRY, PLATE); } catch (e) { giveUp(); }

  function rand(seed) { var x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeBack(t) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

  function u16s(b64) {                              // little-endian uint16 triples -> [[a, b, c], ...]
    var s = atob(b64), out = [];
    for (var j = 0; j + 5 < s.length; j += 6) {
      out.push([s.charCodeAt(j) | s.charCodeAt(j + 1) << 8, s.charCodeAt(j + 2) | s.charCodeAt(j + 3) << 8, s.charCodeAt(j + 4) | s.charCodeAt(j + 5) << 8]);
    }
    return out;
  }

  function start(g, plate) {
    var K = 1000 / 600, CX = 500, CY = 500, RR = 400, TAU = Math.PI * 2;
    // ---- ring dots (the mark), in plate space; packed as x*10, y*10, r*100 ----
    var ring = u16s(g.d).map(function (d, i) {
      var x = d[0] / 10 * K, y = d[1] / 10 * K, ang = Math.atan2(y - CY, x - CX);
      var order = ((ang + Math.PI / 2 + TAU) % TAU) / TAU;      // clockwise from 12 o'clock
      return { x: x, y: y, r: d[2] / 100 * K, a: ang, delay: 80 + order * 1050 + rand(i + 3) * 160 };
    });
    // ---- platform dots: per group, rows of 8 plate units sorted by x, as varint deltas ----
    // marker 0 starts a row (row step, first x); otherwise x step + 1; then one byte: y-in-row << 3 | radius level
    var bin = atob(plate.d), at = 0;
    function vi() { var v = 0, sh = 0, c; do { c = bin.charCodeAt(at++); v |= (c & 127) << sh; sh += 7; } while (c & 128); return v; }
    var SEA = plate.sea, BED = plate.bed, DECK = plate.deck;
    var pts = [], i = 0;
    for (var grp = 0; grp < 5; grp++) {
      var cnt = vi(), row = 0, qx = 0;
      for (var q = 0; q < cnt; q++, i++) {
        var m = vi();
        if (m === 0) { row += vi(); qx = vi(); } else qx += m - 1;
        var c = bin.charCodeAt(at++);
        var x = qx / 4, y = (row * 32 + (c >> 3)) / 4, r = 1 + (c & 7) / 7 * 1.25;
        var dx = x - CX, dy = y - CY, dd = Math.sqrt(dx * dx + dy * dy) || 1;
        var delay;
        if (grp === 0) delay = 420 + rand(i) * 380;                                   // seabed
        else if (grp === 1) delay = 520 + rand(i) * 520;                              // water column
        else if (grp === 2) delay = 760 + (x / 1000) * 360;                           // surface, left to right
        else if (grp === 3) delay = 700 + clamp((BED - y) / (BED - DECK), 0, 1) * 620 + rand(i) * 120;   // jacket, up from the mudline
        else delay = 1240 + clamp((DECK - y) / (DECK - 230), 0, 1) * 420 + rand(i) * 140;              // topsides, deck upward
        pts.push({ x: x, y: y, r: r, g: grp, sx: CX + dx / dd * RR, sy: CY + dy / dd * RR, delay: delay });
      }
    }
    var arcPath = new Path2D(g.arc), ACC = g.accent, arcStroke = g.arcStroke || 9.6;

    var ink = "#1A1A1A", ember = "#E87722";
    function readInk() { ink = getComputedStyle(host).getPropertyValue("--plate-ink").trim() || "#1A1A1A"; }
    readInk();

    var size = 0, dpr = 1, s = 1, boost = 1, ringK = 1;
    var base = document.createElement("canvas"), tops = document.createElement("canvas");
    var bctx = base.getContext("2d"), tctx = tops.getContext("2d");
    var epoch = 1, landDirty = true, landed = 0;      // intro: dots that have landed go straight into the settled layers
    function resize() {
      var rect = host.getBoundingClientRect();
      size = Math.max(1, Math.round(rect.width));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = base.width = tops.width = Math.round(size * dpr);
      canvas.height = base.height = tops.height = Math.round(size * dpr);
      landDirty = true;
      s = size / 1000;
      boost = clamp(760 / size, 1, 1.7);           // small plates: slightly heavier dots so the stipple holds
      ringK = clamp(0.5 + 130 / size, 0.62, 1);     // large plates: the mark's dots drawn finer (optical size)
      layersDirty = true;
    }

    // ---- drawing helpers: dots batched into one Path2D per alpha bucket, no per-dot allocation ----
    var SV = [0, 0, 0, 0], DP = [0, 0];
    function v4(x, y, r, a) { SV[0] = x; SV[1] = y; SV[2] = r; SV[3] = a; return SV; }
    function dotsPath(list, fx) {                   // fx(dot) -> v4(x, y, r, alpha) or null
      var P = [null, null, null, null, null, null];
      for (var i = 0; i < list.length; i++) {
        var v = fx(list[i], i);
        if (!v || v[3] <= 0.02 || v[2] <= 0.02) continue;
        var k = Math.min(5, Math.floor(v[3] * 5.999)), p = P[k] || (P[k] = new Path2D());
        p.moveTo(v[0] + v[2], v[1]); p.arc(v[0], v[1], v[2], 0, TAU);
      }
      return P;
    }
    function fillBuckets(c, P, colour) {
      c.fillStyle = colour;
      for (var k = 0; k < 6; k++) { if (!P[k]) continue; c.globalAlpha = (k + 1) / 6; c.fill(P[k]); }
      c.globalAlpha = 1;
    }
    function px(v) { return v * s * dpr; }
    function rad(r, isRing) { return Math.max(0.5 * dpr, r * s * dpr * (isRing ? ringK * Math.min(boost, 1.35) : boost)); }

    function drawArc(c, frac) {
      c.save(); c.scale(s * dpr * K, s * dpr * K);
      c.strokeStyle = ink; c.lineWidth = arcStroke * (0.35 + 0.65 * ringK); c.lineCap = "round";
      if (frac < 1) { var L = 180; c.setLineDash([L * frac, L]); }
      c.stroke(arcPath); c.restore();
    }
    function drawEmber(c, k) {
      if (k <= 0) return;
      c.fillStyle = ember; c.beginPath();
      c.arc(px(ACC[0] * K), px(ACC[1] * K), Math.max(0, px(ACC[2] * K) * (0.62 + 0.38 * ringK) * k), 0, TAU); c.fill();
    }

    var layersDirty = true;
    function buildLayers() {
      var b = base.getContext("2d"), t = tops.getContext("2d");
      b.setTransform(1, 0, 0, 1, 0, 0); t.setTransform(1, 0, 0, 1, 0, 0);
      b.clearRect(0, 0, base.width, base.height); t.clearRect(0, 0, tops.width, tops.height);
      fillBuckets(b, dotsPath(pts, function (d) { return d.g === 4 ? null : v4(px(d.x), px(d.y), rad(d.r), 1); }), ink);
      fillBuckets(t, dotsPath(pts, function (d) { return d.g === 4 ? v4(px(d.x), px(d.y), rad(d.r), 1) : null; }), ink);
      fillBuckets(b, dotsPath(ring, function (d) { return v4(px(d.x), px(d.y), rad(d.r, true), 1); }), ink);
      drawArc(b, 1); drawEmber(b, 1);
      layersDirty = false;
    }

    // ---- state ----
    var t0 = performance.now();
    var intro = reduce || seen ? 0 : 1;
    var INTRO = 2500;                                // ends when the last dot has landed (about 2.8 s)
    ring.forEach(function (d) { INTRO = Math.max(INTRO, d.delay + 420); });
    pts.forEach(function (d) { INTRO = Math.max(INTRO, d.delay + 980); });
    function finishIntro() {
      intro = 0;
      try { sessionStorage.setItem("endura-ring", "1"); } catch (e) {}
      // the hero copy and notes finish their own fade just after the drawing; release the intro state then
      if (root.classList.contains("ring-intro")) setTimeout(function () { root.classList.remove("ring-intro"); }, 700);
    }
    var lift = 0, liftTarget = 0;                  // scroll: topsides lift (plate units)
    var pointer = { x: -9999, y: -9999, k: 0, kTarget: 0 };
    var visible = true, running = false;

    function displaced(d, isRing) {
      var x = d.x, y = d.y;
      if (d.g === 4) y -= lift;
      if (pointer.k > 0.001) {
        var dx = x - pointer.x, dy = y - pointer.y, dd = Math.sqrt(dx * dx + dy * dy);
        if (dd < 96 && dd > 0.001) { var f = (1 - dd / 96); f = f * f * 24 * pointer.k * (isRing ? 0.5 : 1); x += dx / dd * f; y += dy / dd * f; }
      }
      DP[0] = x; DP[1] = y; return DP;
    }

    function draw(now) {
      var t = now - t0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lift += (liftTarget - lift) * 0.12;
      pointer.k += (pointer.kTarget - pointer.k) * 0.08;

      if (intro) {
        // dots still travelling are drawn live each frame; a dot that has landed is drawn once, straight into
        // the settled layers, so the work per frame falls as the drawing completes and nothing is redrawn at the end
        if (landDirty) {
          bctx.setTransform(1, 0, 0, 1, 0, 0); tctx.setTransform(1, 0, 0, 1, 0, 0);
          bctx.clearRect(0, 0, base.width, base.height); tctx.clearRect(0, 0, tops.width, tops.height);
          epoch++; landed = 0; landDirty = false; layersDirty = true;
        }
        var P = [null, null, null, null, null, null], F = null, FT = null, i, d, k, e, x, y, r, a, b, q;
        for (i = 0; i < ring.length; i++) {            // the ring, plotted clockwise
          d = ring[i]; if (d.ln === epoch) continue;
          k = (t - d.delay) / 420; if (k <= 0) continue;
          if (k >= 1) { d.ln = epoch; landed++; F = F || new Path2D(); x = px(d.x); y = px(d.y); r = rad(d.r, true); F.moveTo(x + r, y); F.arc(x, y, r, 0, TAU); continue; }
          e = easeOut(k); a = (1 - e) * 14;
          x = px(d.x + Math.cos(d.a) * a); y = px(d.y + Math.sin(d.a) * a); r = rad(d.r, true) * (0.4 + 0.6 * e);
          if (e <= 0.02) continue;
          b = Math.min(5, Math.floor(e * 5.999)); q = P[b] || (P[b] = new Path2D()); q.moveTo(x + r, y); q.arc(x, y, r, 0, TAU);
        }
        for (i = 0; i < pts.length; i++) {             // the platform streams in from the ring
          d = pts[i]; if (d.ln === epoch) continue;
          k = (t - d.delay) / 980; if (k <= 0) continue;
          if (k >= 1) {
            d.ln = epoch; landed++; x = px(d.x); y = px(d.y); r = rad(d.r);
            if (d.g === 4) { FT = FT || new Path2D(); FT.moveTo(x + r, y); FT.arc(x, y, r, 0, TAU); }
            else { F = F || new Path2D(); F.moveTo(x + r, y); F.arc(x, y, r, 0, TAU); }
            continue;
          }
          e = easeOut(k); a = Math.min(1, k * 1.6);
          x = px(d.sx + (d.x - d.sx) * e); y = px(d.sy + (d.y - d.sy) * e); r = rad(d.r) * (0.55 + 0.45 * e);
          if (a <= 0.02) continue;
          b = Math.min(5, Math.floor(a * 5.999)); q = P[b] || (P[b] = new Path2D()); q.moveTo(x + r, y); q.arc(x, y, r, 0, TAU);
        }
        if (F) { bctx.fillStyle = ink; bctx.fill(F); }
        if (FT) { tctx.fillStyle = ink; tctx.fill(FT); }
        ctx.drawImage(base, 0, 0); ctx.drawImage(tops, 0, 0);
        fillBuckets(ctx, P, ink);
        drawArc(ctx, clamp((t - 1650) / 520, 0, 1));
        var ke = clamp((t - 2080) / 420, 0, 1);
        drawEmber(ctx, ke > 0 ? easeBack(ke) : 0);
        if (t > INTRO) {                               // every dot has landed: the layers are complete
          if (landed === ring.length + pts.length) { drawArc(bctx, 1); drawEmber(bctx, 1); layersDirty = false; }
          finishIntro();
        }
        return;
      }
      if (layersDirty) buildLayers();

      if (pointer.k > 0.01) {
        // live: every dot follows the pointer field
        fillBuckets(ctx, dotsPath(pts, function (d) { var p = displaced(d, false); return v4(px(p[0]), px(p[1]), rad(d.r), d.g === 4 ? 1 - lift / 260 : 1); }), ink);
        fillBuckets(ctx, dotsPath(ring, function (d) { var p = displaced(d, true); return v4(px(p[0]), px(p[1]), rad(d.r, true), 1); }), ink);
        drawArc(ctx, 1); drawEmber(ctx, 1);
        return;
      }
      // settled: cached layers, topsides lifted by scroll
      ctx.drawImage(base, 0, 0);
      if (lift > 0.3) { ctx.globalAlpha = clamp(1 - lift / 260, 0, 1); ctx.drawImage(tops, 0, -px(lift)); ctx.globalAlpha = 1; }
      else ctx.drawImage(tops, 0, 0);
    }

    // frames run only while something is changing; a settled plate costs nothing
    function busy() { return intro || Math.abs(pointer.kTarget - pointer.k) > 0.004 || Math.abs(liftTarget - lift) > 0.3; }
    var lastFrame = 0, slowRun = 0;
    function loop(now) {
      if (!visible || document.hidden) { running = false; lastFrame = 0; return; }
      // a device that cannot keep up (three frames in a row slower than about 16 fps, once the page has
      // loaded) is shown the finished plate at once instead of a stuttering drawing
      if (intro && lastFrame) {
        slowRun = now - lastFrame > 60 && now - t0 > 600 ? slowRun + 1 : 0;
        if (slowRun >= 3) { t0 -= INTRO; slowRun = 0; }
      }
      lastFrame = now;
      draw(now);
      if (busy()) requestAnimationFrame(loop); else { running = false; lastFrame = 0; }
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

    resize();
    host.classList.add("plate-live");
    kick();

    // Replay: draws the plate again, on request (CSS hides it without JavaScript or canvas, or with reduced motion)
    var replay = document.querySelector("[data-plate-replay]");
    if (replay && !reduce) {
      replay.addEventListener("click", function () { t0 = performance.now(); intro = 1; slowRun = 0; landDirty = true; kick(); });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[e.length - 1].isIntersecting; if (visible) kick(); }, { threshold: 0 }).observe(host);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) kick(); });

    // scroll: the topsides lift as the plate leaves the screen
    function onScroll() {
      if (reduce) return;
      var h = host.getBoundingClientRect();          // the lift starts once the plate itself begins to leave the screen
      var target = clamp(-h.top / (h.height * 0.85), 0, 1) * 170;
      if (target !== liftTarget) { liftTarget = target; kick(); }
    }
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (fine && !reduce) {
      host.addEventListener("pointermove", function (e) {
        var r = host.getBoundingClientRect();
        pointer.x = (e.clientX - r.left) / r.width * 1000; pointer.y = (e.clientY - r.top) / r.height * 1000;
        pointer.kTarget = 1; kick();
      }, { passive: true });
      host.addEventListener("pointerleave", function () { pointer.kTarget = 0; kick(); }, { passive: true });
    }
    var rt = 0;
    addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { resize(); draw(performance.now()); kick(); }, 120); }, { passive: true });
    new MutationObserver(function () { readInk(); layersDirty = landDirty = true; draw(performance.now()); kick(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
})();
