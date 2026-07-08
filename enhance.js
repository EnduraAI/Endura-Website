// ENDURA — enhancement layer (maximal showcase)
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- HERO SONAR CANVAS ---------- */
  function heroCanvas() {
    var c = document.getElementById('heroCanvas');
    if (!c) return;
    var ctx = c.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, pts = [], sweep = 0, cx, cy;

    function resize() {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * DPR; c.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = w * 0.5; cy = h * 0.5;
      build();
    }
    function build() {
      pts = [];
      var n = Math.floor((w * h) / 14000); // density
      n = Math.max(60, Math.min(n, 220));
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * Math.PI * 2;
        var rad = Math.pow(Math.random(), 0.62) * Math.min(w, h) * 0.62;
        pts.push({
          a: ang, r: rad,
          x: cx + Math.cos(ang) * rad,
          y: cy + Math.sin(ang) * rad,
          base: 0.10 + Math.random() * 0.18,   // resting opacity
          lit: 0,                                 // sweep glow
          jitter: 2 + Math.random() * 5,         // uncertainty wobble
          phase: Math.random() * Math.PI * 2,
          resolved: 0,                            // 0 uncertain -> 1 resolved
          depth: 0.25 + Math.random() * 0.75      // (1) parallax depth: far .25 -> near 1
        });
      }
    }
    var t = 0;
    window.__heroParallax = { x: 0, y: 0 };
    var pcx = 0, pcy = 0;
    function frame() {
      t += 0.006;
      ctx.clearRect(0, 0, w, h);
      // ease center toward cursor parallax (subtle)
      var tx = (window.__heroParallax.x || 0) * w * 0.05;
      var ty = (window.__heroParallax.y || 0) * h * 0.05;
      pcx += (tx - pcx) * 0.06; pcy += (ty - pcy) * 0.06;
      cx = w * 0.5 + pcx; cy = h * 0.5 + pcy;
      // sweep angle
      sweep += 0.012;
      if (sweep > Math.PI * 2) sweep -= Math.PI * 2;

      // faint connecting filaments near center
      var par = window.__heroParallax || { x: 0, y: 0 };
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k];
        // angular distance from sweep
        var da = Math.abs(((p.a - sweep + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (da < 0.34) { p.lit = Math.max(p.lit, 1 - da / 0.34); p.resolved = Math.min(1, p.resolved + 0.02); }
        p.lit *= 0.965;
        // position: uncertain points wobble, resolved points settle toward a clean radial line
        var wob = (1 - p.resolved) * p.jitter;
        // (1) depth parallax: nearer points (higher depth) shift more with cursor
        var px = par.x * 46 * p.depth, py = par.y * 30 * p.depth;
        p.x = cx + Math.cos(p.a) * p.r + Math.cos(t * 1.3 + p.phase) * wob + px;
        p.y = cy + Math.sin(p.a) * p.r + Math.sin(t * 1.1 + p.phase) * wob + py;
      }

      // draw sweep wedge
      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.62);
      grad.addColorStop(0, 'rgba(200,116,26,0.10)');
      grad.addColorStop(1, 'rgba(200,116,26,0)');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, Math.min(w, h) * 0.62, sweep - 0.34, sweep + 0.02);
      ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      // leading edge line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * Math.min(w, h) * 0.62, cy + Math.sin(sweep) * Math.min(w, h) * 0.62);
      ctx.strokeStyle = 'rgba(232,162,74,0.28)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();

      // draw points
      for (var i = 0; i < pts.length; i++) {
        var q = pts[i];
        var op = (q.base + q.lit * 0.7) * (0.5 + q.depth * 0.5);
        var size = (1 + q.lit * 2.2 + q.resolved * 0.4) * (0.6 + q.depth * 0.8);
        // colour shifts from steel (uncertain) to amber (lit) to teal-ish (resolved & calm)
        var col;
        if (q.lit > 0.25) col = 'rgba(232,162,74,' + op.toFixed(3) + ')';
        else if (q.resolved > 0.6) col = 'rgba(124,139,151,' + (op * 0.9).toFixed(3) + ')';
        else col = 'rgba(120,150,170,' + op.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(q.x, q.y, size, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    window.addEventListener('resize', resize);
    resize();
    if (reduce) {
      // static: draw one frame, points resolved
      pts.forEach(function (p) { p.resolved = 1; });
      ctx.clearRect(0, 0, w, h);
      pts.forEach(function (p) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120,150,170,' + p.base.toFixed(3) + ')'; ctx.fill();
      });
    } else { frame(); }
  }

  /* ---------- COUNTERS ---------- */
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1300, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = (target * eased).toFixed(dec);
      el.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toFixed(dec) + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------- INIT ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    heroCanvas();

    // stagger + reveal + counters + funnel via observer
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in', 'in-view');
          // counters inside
          e.target.querySelectorAll('.count').forEach(function (c) {
            if (!c.dataset.done) { c.dataset.done = '1'; runCounter(c); }
          });
          io.unobserve(e.target);
        });
      }, { threshold: 0.2 });
      document.querySelectorAll('.stagger,.funnel-band,.has-count').forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll('.count').forEach(runCounter);
    }
  });
})();

/* ============================================================
   INTERACTIVE "COMPRESS THE RANGE" DEMO
   ============================================================ */
(function () {
  function initDemo() {
    var demo = document.getElementById('aroDemo');
    if (!demo) return;
    // domains with weight (how much each drives ARO) and current quality 0..1
    var domains = [
      { id: 'struct', label: 'Structural Data', weight: 0.28, q: 0.38 },
      { id: 'hazmat', label: 'Hazardous Materials', weight: 0.22, q: 0.41 },
      { id: 'isol', label: 'Isolation & Containment', weight: 0.16, q: 0.44 },
      { id: 'asbuilt', label: 'As-Built Drawings', weight: 0.14, q: 0.55 },
      { id: 'pid', label: 'P&IDs', weight: 0.10, q: 0.62 },
      { id: 'other', label: 'Remaining domains', weight: 0.10, q: 0.78 }
    ];
    var CENTER = 480; // illustrative central estimate; inherited docs => ±$360M band, matching the demo-asset story

    function compute() {
      // weighted average quality 0..1
      var wq = 0, wsum = 0;
      domains.forEach(function (d) { wq += d.q * d.weight; wsum += d.weight; });
      wq = wq / wsum;
      // poor docs -> wide asymmetric range (-50%/+100%); perfect -> tight (-7%/+9%)
      // tuned so the inherited-docs preset sits at AACE Class 5 (-50/+100 => ±$360M here)
      // and post-remediation lands near ±$80M, matching the demo-asset story
      var up = Math.max(20, Math.min(100, 193 - wq * 219));
      var down = Math.max(13.3, Math.min(50, 96.6 - wq * 109.6));
      var adi = Math.round(wq * 100);
      var lo = CENTER * (1 - down / 100);
      var hi = CENTER * (1 + up / 100);
      var band = (hi - lo) / 2;
      return { up: up, down: down, adi: adi, lo: lo, hi: hi, band: band };
    }

    function render() {
      var r = compute();
      demo.querySelector('#dmLo').textContent = '$' + Math.round(r.lo) + 'M – ';
      demo.querySelector('#dmHi').textContent = '$' + Math.round(r.hi) + 'M';
      var bd = demo.querySelector('#dmBandVal'); if (bd) bd.textContent = '±$' + Math.round(r.band) + 'M';
      demo.querySelector('#dmSpread').innerHTML =
        '<span style="color:#D96A55">−' + r.down.toFixed(0) + '%</span> &nbsp;/&nbsp; <span style="color:#3DA18C">+' + r.up.toFixed(0) + '%</span>';
      var adiEl = demo.querySelector('#dmAdi');
      adiEl.innerHTML = 'Data integrity: <b>' + r.adi + '</b> / 100';
      // band position on the rangebar: full scale represents -50%..+100% of center
      var scaleLo = CENTER * 0.5, scaleHi = CENTER * 2.0, span = scaleHi - scaleLo;
      var leftPct = ((r.lo - scaleLo) / span) * 100;
      var rightPct = 100 - ((r.hi - scaleLo) / span) * 100;
      var band = demo.querySelector('#dmBand');
      band.style.left = Math.max(0, leftPct) + '%';
      band.style.right = Math.max(0, rightPct) + '%';
    }

    // build sliders
    var box = demo.querySelector('#dmSliders');
    domains.forEach(function (d) {
      var row = document.createElement('div');
      row.className = 'sl';
      row.innerHTML = '<label>' + d.label + '</label>' +
        '<input type="range" min="0" max="100" value="' + Math.round(d.q * 100) + '" data-id="' + d.id + '" aria-label="' + d.label + ' documentation quality">' +
        '<span class="pct" data-pct="' + d.id + '">' + Math.round(d.q * 100) + '%</span>';
      box.appendChild(row);
    });
    box.addEventListener('input', function (e) {
      var id = e.target.getAttribute('data-id');
      if (!id) return;
      var d = domains.find(function (x) { return x.id === id; });
      d.q = e.target.value / 100;
      demo.querySelector('[data-pct="' + id + '"]').textContent = e.target.value + '%';
      render();
    });

    // presets
    demo.querySelectorAll('.demo-presets button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-preset');
        domains.forEach(function (d) {
          if (mode === 'inherited') d.q = 0.30 + Math.random() * 0.20;
          else if (mode === 'typical') d.q = 0.50 + Math.random() * 0.18;
          else if (mode === 'remediated') d.q = 0.82 + Math.random() * 0.14;
        });
        // reflect in sliders
        demo.querySelectorAll('input[type=range]').forEach(function (inp) {
          var d = domains.find(function (x) { return x.id === inp.getAttribute('data-id'); });
          inp.value = Math.round(d.q * 100);
          demo.querySelector('[data-pct="' + d.id + '"]').textContent = Math.round(d.q * 100) + '%';
        });
        render();
      });
    });

    render();
  }

  /* ---------- CURSOR-REACTIVE HERO (parallax on canvas center) ---------- */
  function cursorHero() {
    var hero = document.querySelector('.hero');
    var canvas = document.getElementById('heroCanvas');
    if (!hero || !canvas || window.__reduceMotion) return;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      window.__heroParallax = { x: dx, y: dy };
    });
    hero.addEventListener('pointerleave', function () { window.__heroParallax = { x: 0, y: 0 }; });
  }

  /* ---------- SCROLL PROGRESS BAR ---------- */
  function progressBar() {
    var bar = document.createElement('div');
    bar.className = 'progress';
    document.body.appendChild(bar);
    function upd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = p + '%';
    }
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* ---------- SCROLL-DRIVEN FUNNEL (compress as you scroll through) ---------- */
  function scrollFunnel() {
    var band = document.querySelector('.funnel-band');
    if (!band) return;
    var poly = band.querySelector('polygon.ffade');
    var midline = band.querySelector('line.fdraw');
    if (!poly) return;
    if (window.__reduceMotion) { return; }
    // (2) compress the funnel live as the section scrolls through the viewport
    // wide start:  points "90,30 90,200 800,95 800,135"
    // we animate the LEFT edge (the wide, uncertain end) narrowing toward the centre line (115)
    function update() {
      var r = band.getBoundingClientRect();
      var vh = window.innerHeight;
      // begin compressing when the band's top reaches ~85% down the viewport,
      // finish when it reaches ~25% — a long, visible travel
      var prog = (vh * 0.85 - r.top) / (vh * 0.6);
      prog = Math.max(0, Math.min(1, prog));
      var topY = 30 + (92 - 30) * prog;
      var botY = 200 - (200 - 138) * prog;
      poly.setAttribute('points', '90,' + topY.toFixed(1) + ' 90,' + botY.toFixed(1) + ' 800,95 800,135');
      band.style.setProperty('--fprog', prog.toFixed(3));
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    window.__reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    initDemo();
    cursorHero();
    scrollFunnel();
  });
})();

/* ============================================================
   WOW LAYER — preloader, magnetic buttons, nav scroll
   ============================================================ */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // preloader removed: instant load reads more premium

  document.addEventListener('DOMContentLoaded', function () {
    // nav scrolled shadow
    var nav = document.querySelector('.nav');
    if (nav) {
      window.addEventListener('scroll', function () {
        nav.classList.toggle('scrolled', window.scrollY > 20);
      }, { passive: true });
    }

      });
})();

/* ============================================================
   FINAL POLISH — active-section nav, section accent triggers
   ============================================================ */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // trigger the sec-head accent line when its section reveals
    if ('IntersectionObserver' in window) {
      var hio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); }
        });
      }, { threshold: 0.5 });
      document.querySelectorAll('.sec-head').forEach(function (h) { hio.observe(h); });
    } else {
      document.querySelectorAll('.sec-head').forEach(function (h) { h.classList.add('in'); });
    }
  });
})();


/* ════ V16: spotlight, terminal typer, hero-app animation, clock ════ */
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    // ⑤ cursor spotlight (delegated, cheap)
    document.addEventListener('pointermove', function(e){
      var t = e.target.closest('.card,.std');
      if(!t) return;
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100)+'%');
      t.style.setProperty('--my', ((e.clientY-r.top)/r.height*100)+'%');
    }, {passive:true});

    // ④ hero app: animate gauge + bars once visible
    var app = document.querySelector('.hero-app .appwin');
    if(app){
      app.querySelectorAll('.ha-bar i').forEach(function(b){ b.style.setProperty('--w', b.getAttribute('style').match(/width:\s*([\d.]+%)/)[1]); });
      setTimeout(function(){ app.classList.add('ha-animated'); }, 350);
    }

    // ③ terminal typer in hero app
    var term = document.getElementById('haTerm');
    if(term && !(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
      var lines = [
        'ingest: 2,847 source documents parsed',
        'adii: structural 38 · hazmat 41 · isolation 44',
        'module B: 10,000 monte carlo iterations… done',
        'sensitivity: ±$360M → remediation path found',
        'traceability check: 100% · readout ready'
      ];
      var li=0, ci=0, hold=0;
      (function type(){
        var line = lines[li];
        if(ci <= line.length){ term.textContent = line.slice(0,ci); ci++; }
        else if(hold < 28){ hold++; }
        else { li=(li+1)%lines.length; ci=0; hold=0; }
        setTimeout(type, ci<=line.length ? 26 : 60);
      })();
    }

    // ⑱ live clock in footer status
    var clk = document.getElementById('ftClock');
    if(clk){
      function tick(){
        var d = new Date();
        clk.textContent = d.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',hour12:false}) + ' AEST';
      }
      tick(); setInterval(tick, 30000);
    }
  });
})();


/* ============================================================
   SIGNATURE — the integrity scan (decomm.ai readout)
   Sequential domain draw · counting values · critical pulse ·
   badge stamp. Reduced motion / no-IO: instant final state.
   ============================================================ */
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var wrapEl = document.querySelector('.dashwrap');
    if(!wrapEl) return;
    var doms = [].slice.call(wrapEl.querySelectorAll('.dom'));
    var gaugeV = wrapEl.querySelector('.score .v');
    var badge = wrapEl.querySelector('.badge');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function finals(){
      doms.forEach(function(d){
        var f=d.querySelector('.fill'); if(f) f.style.width=f.getAttribute('data-w');
      });
      wrapEl.classList.add('scanned');
    }
    function countTo(el, dur){
      var fin = el.textContent;                    /* exact authored figure */
      var n = parseFloat(fin.replace(/[^\d.]/g,''));
      if(isNaN(n)){ return; }
      var t0 = performance.now();
      (function step(ts){
        var u = Math.min(1,(ts-t0)/dur); u = 1-Math.pow(1-u,3);
        el.textContent = String(Math.round(n*u));
        if(u<1) requestAnimationFrame(step); else el.textContent = fin;
      })(t0);
      setTimeout(function(){ el.textContent = fin; }, dur+220);  /* restore-exact belt */
    }
    function scan(){
      wrapEl.classList.add('scan');
      if(gaugeV) countTo(gaugeV, 1500);
      doms.forEach(function(d, i){
        setTimeout(function(){
          d.style.opacity = 1;
          var f=d.querySelector('.fill'); if(f) f.style.width=f.getAttribute('data-w');
          var v=d.querySelector('.dv'); if(v) countTo(v, 900);
          if(f && f.classList.contains('f-low')){
            setTimeout(function(){ d.classList.add('crit','pulse');
              setTimeout(function(){ d.classList.remove('pulse'); }, 650); }, 950);
          }
        }, 260 + i*95);
      });
      setTimeout(function(){
        wrapEl.classList.add('scanned');
        if(badge){ badge.classList.add('stamp');
          setTimeout(function(){ badge.classList.remove('stamp'); }, 900); }
      }, 260 + doms.length*95 + 1050);
    }
    /* hover re-pulse after the scan */
    doms.forEach(function(d){
      d.addEventListener('mouseenter', function(){
        if(!wrapEl.classList.contains('scanned')) return;
        d.classList.add('pulse');
        setTimeout(function(){ d.classList.remove('pulse'); }, 520);
      });
    });
    if(reduce || !('IntersectionObserver' in window)){ finals(); return; }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){ io.disconnect(); scan(); }
      });
    }, { threshold: 0.35 });
    io.observe(wrapEl);
    /* safety: never leave it unlit */
    setTimeout(function(){ if(!wrapEl.classList.contains('scan')) finals(); }, 6000);
  });
})();

/* ============================================================
   CUSTOM CURSOR — global, all pages. Fine-pointer + motion-safe.
   ============================================================ */
(function(){
  var fine = window.matchMedia('(pointer:fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(!fine || reduce) return;

  var ring = document.createElement('div'); ring.className = 'ec-ring';
  var dot  = document.createElement('div'); dot.className  = 'ec-dot';
  document.body.appendChild(ring); document.body.appendChild(dot);
  document.documentElement.classList.add('has-cursor');

  var rx=innerWidth/2, ry=innerHeight/2, dx=rx, dy=ry, tx=rx, ty=ry;
  window.addEventListener('mousemove', function(e){ tx=e.clientX; ty=e.clientY; }, {passive:true});

  (function loop(){
    rx += (tx-rx)*0.18; ry += (ty-ry)*0.18;   // ring eases (trailing)
    dx += (tx-dx)*0.55; dy += (ty-dy)*0.55;    // dot snappier
    ring.style.transform = 'translate('+rx+'px,'+ry+'px) translate(-50%,-50%)';
    dot.style.transform  = 'translate('+dx+'px,'+dy+'px) translate(-50%,-50%)';
    requestAnimationFrame(loop);
  })();

  // grow on interactive elements
  var growSel = 'a,button,input,select,textarea,label,[role="button"],.card,summary';
  document.addEventListener('mouseover', function(e){
    if(e.target.closest(growSel)) ring.classList.add('grow');
  });
  document.addEventListener('mouseout', function(e){
    if(e.target.closest(growSel)) ring.classList.remove('grow');
  });
  // hide the ring over the live data instruments so it doesn't fight the readout
  var hideSel = '.readout,.instrument,.demo,.gauge,svg';
  document.addEventListener('mouseover', function(e){
    if(e.target.closest(hideSel)) ring.classList.add('hide');
  });
  document.addEventListener('mouseout', function(e){
    if(e.target.closest(hideSel)) ring.classList.remove('hide');
  });
  // hide when leaving the window
  document.addEventListener('mouseleave', function(){ ring.classList.add('hide'); dot.style.opacity='0'; });
  document.addEventListener('mouseenter', function(){ ring.classList.remove('hide'); dot.style.opacity='1'; });
})();
