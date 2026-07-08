/* ============================================================
   ENDURA — Rapid Liability Self-Check
   Eight weighted questions -> indicative ADI score + range.
   Runs entirely client-side. Illustrative, not a real estimate.
   ============================================================ */
(function () {
  // Each question maps to a domain weight. Options carry a 0..1 quality value.
  var QUESTIONS = [
    {
      q: 'How many times has this asset changed operator?',
      hint: 'Each transfer tends to fragment the documentation trail.',
      domain: 'Provenance', weight: 1.2,
      opts: [
        { t: 'Original operator, never transferred', d: 'Documentation lineage intact', v: 0.95 },
        { t: 'Transferred once', d: 'Some migration risk', v: 0.65 },
        { t: 'Two or more transfers', d: 'High fragmentation risk', v: 0.35 },
        { t: 'Unknown / acquired as a portfolio', d: 'Lineage unclear', v: 0.2 }
      ]
    },
    {
      q: 'Do you hold verified structural as-builts?',
      hint: 'Primary-steel records drive severance, lift weights and rigging.',
      domain: 'Structural Data', weight: 1.6,
      opts: [
        { t: 'Yes — recently verified against survey', d: '', v: 0.95 },
        { t: 'Yes — but not verified against current condition', d: '', v: 0.55 },
        { t: 'Partial or original-build only', d: '', v: 0.35 },
        { t: 'No / unsure', d: '', v: 0.15 }
      ]
    },
    {
      q: 'Is there a current hazardous-material & NORM inventory?',
      hint: 'Drives disposal routing, PPE regime and waste-slot booking.',
      domain: 'Hazardous Materials', weight: 1.4,
      opts: [
        { t: 'Yes — current and classified', d: '', v: 0.95 },
        { t: 'Older survey, not fully current', d: '', v: 0.5 },
        { t: 'Partial / suspected materials only', d: '', v: 0.3 },
        { t: 'No inventory', d: '', v: 0.1 }
      ]
    },
    {
      q: 'How complete is your isolation philosophy & line-status record?',
      hint: 'Drives make-safe scope and offshore/site campaign duration.',
      domain: 'Isolation', weight: 1.2,
      opts: [
        { t: 'Documented and current', d: '', v: 0.9 },
        { t: 'Documented but ageing', d: '', v: 0.55 },
        { t: 'Fragmented', d: '', v: 0.3 },
        { t: 'Not available', d: '', v: 0.15 }
      ]
    },
    {
      q: 'Are P&IDs complete and revision-controlled?',
      hint: 'Drives flushing / cleaning scope and hydrocarbon inventory.',
      domain: 'P&IDs', weight: 1.0,
      opts: [
        { t: 'Complete, current, revision-controlled', d: '', v: 0.9 },
        { t: 'Mostly complete, some unreconciled', d: '', v: 0.6 },
        { t: 'Partial set', d: '', v: 0.35 },
        { t: 'Largely missing', d: '', v: 0.15 }
      ]
    },
    {
      q: 'How recent is your inspection / integrity data?',
      hint: 'Recent inspection materially de-risks the assessment.',
      domain: 'Inspection Records', weight: 1.0,
      opts: [
        { t: 'Within the last 2 years', d: '', v: 0.9 },
        { t: '2–5 years old', d: '', v: 0.6 },
        { t: 'Older than 5 years', d: '', v: 0.35 },
        { t: 'No recent inspection', d: '', v: 0.15 }
      ]
    },
    {
      q: 'Is there an existing decommissioning cost estimate with a documented basis?',
      hint: 'A basis you can trace is the foundation of a defensible ARO.',
      domain: 'Cost basis', weight: 1.1,
      opts: [
        { t: 'Yes — with a documented basis of estimate', d: '', v: 0.9 },
        { t: 'Yes — but basis is thin or undocumented', d: '', v: 0.45 },
        { t: 'A high-level provision only', d: '', v: 0.3 },
        { t: 'No estimate yet', d: '', v: 0.2 }
      ]
    },
    {
      q: 'Who originally produced the cost basis you rely on?',
      hint: 'Knowledge tends to leave with the people who built the estimate.',
      domain: 'Continuity', weight: 0.9,
      opts: [
        { t: 'Current team, still in place', d: '', v: 0.85 },
        { t: 'Previous team, partially retained', d: '', v: 0.5 },
        { t: 'Previous operator / departed staff', d: '', v: 0.3 },
        { t: 'Unknown', d: '', v: 0.15 }
      ]
    }
  ];

  var answers = new Array(QUESTIONS.length).fill(null);
  var step = 0;
  var form = document.getElementById('dgForm');
  var progress = document.getElementById('dgProgress');
  var resultBox = document.getElementById('dgResult');

  // build progress segments
  QUESTIONS.forEach(function () {
    var s = document.createElement('div'); s.className = 'seg'; progress.appendChild(s);
  });

  function renderStep() {
    form.innerHTML = '';
    progress.querySelectorAll('.seg').forEach(function (s, i) { s.classList.toggle('on', i <= step); });
    var Q = QUESTIONS[step];
    var wrap = document.createElement('div'); wrap.className = 'step on';
    var html = '<div class="sl-q">Question ' + (step + 1) + ' of ' + QUESTIONS.length + '</div>' +
      '<h2>' + Q.q + '</h2><p class="hint">' + Q.hint + '</p><div class="opts">';
    Q.opts.forEach(function (o, i) {
      var sel = answers[step] === i ? ' sel' : '';
      html += '<div class="opt' + sel + '" data-i="' + i + '"><span class="rad"></span><span><span class="ot">' + o.t + '</span>' +
        (o.d ? '<span class="od">' + o.d + '</span>' : '') + '</span></div>';
    });
    html += '</div><div class="dg-nav">' +
      '<button class="btn btn-ghost" id="dgBack" style="color:var(--ink);border-color:var(--line-2)"' + (step === 0 ? ' disabled' : '') + '>← Back</button>' +
      '<button class="btn btn-primary" id="dgNext"' + (answers[step] === null ? ' disabled' : '') + '>' + (step === QUESTIONS.length - 1 ? 'See my result →' : 'Next →') + '</button>' +
      '</div>';
    wrap.innerHTML = html;
    form.appendChild(wrap);

    wrap.querySelectorAll('.opt').forEach(function (o) {
      o.addEventListener('click', function () {
        answers[step] = parseInt(o.getAttribute('data-i'), 10);
        wrap.querySelectorAll('.opt').forEach(function (x) { x.classList.remove('sel'); });
        o.classList.add('sel');
        wrap.querySelector('#dgNext').removeAttribute('disabled');
      });
    });
    wrap.querySelector('#dgBack').addEventListener('click', function () { if (step > 0) { step--; renderStep(); } });
    wrap.querySelector('#dgNext').addEventListener('click', function () {
      if (answers[step] === null) return;
      if (step < QUESTIONS.length - 1) { step++; renderStep(); }
      else showResult();
    });
  }

  function showResult() {
    form.style.display = 'none';
    progress.style.display = 'none';
    // weighted quality
    var wq = 0, wsum = 0, weakest = [];
    QUESTIONS.forEach(function (Q, i) {
      var v = Q.opts[answers[i]].v;
      wq += v * Q.weight; wsum += Q.weight;
      weakest.push({ domain: Q.domain, v: v, w: Q.weight, label: Q.opts[answers[i]].t });
    });
    var quality = wq / wsum;          // 0..1
    var adi = Math.round(quality * 100);
    // range: poor -> -50/+100, strong -> -8/+10
    var up = Math.round(100 - quality * 90);
    var down = Math.round(50 - quality * 42);
    var band = adi < 50 ? 'low' : adi < 72 ? 'mid' : 'ok';
    var confidence = adi < 50 ? 'Low confidence' : adi < 72 ? 'Moderate confidence' : 'Strong confidence';

    // findings: top 3 weakest weighted
    weakest.sort(function (a, b) { return (a.v * 1 / a.w) - (b.v * 1 / b.w); }); // weak & high-weight first
    weakest.sort(function (a, b) { return (a.v - a.w * 0.15) - (b.v - b.w * 0.15); });
    var lows = weakest.filter(function (x) { return x.v < 0.6; }).slice(0, 3);
    var strengths = weakest.filter(function (x) { return x.v >= 0.75; }).slice(-2);

    var bandLeft = Math.max(0, ((50 - down) / 150) * 100);
    var bandRight = Math.max(0, ((100 - up) / 150) * 100);

    var fh = '';
    lows.forEach(function (x) {
      fh += '<div class="finding"><span class="fi">GAP</span><span><b>' + x.domain + '</b> — ' + x.label.toLowerCase() + '. A high-influence gap worth closing early.</span></div>';
    });
    if (!lows.length) fh += '<div class="finding"><span class="fi ok">SOLID</span><span>No high-influence gaps flagged from these answers — a strong documentation position.</span></div>';
    strengths.forEach(function (x) {
      fh += '<div class="finding"><span class="fi ok">OK</span><span><b>' + x.domain + '</b> is a relative strength in this self-check.</span></div>';
    });

    var scoreColor = band === 'low' ? '#E07A5F' : band === 'mid' ? '#E8A24A' : '#3DA18C';

    resultBox.className = 'result on';
    resultBox.innerHTML =
      '<div class="res-card"><div class="grid-tex"></div><div class="in">' +
        '<div class="eyebrow" style="color:var(--amber-soft);margin-bottom:18px">Indicative self-check result · illustrative</div>' +
        '<div class="res-top">' +
          '<div class="res-score"><div class="big" style="color:' + scoreColor + '">' + adi + '</div><div class="of">/ 100 indicative ADI</div><div class="lbl" style="color:' + scoreColor + '">' + confidence + '</div></div>' +
          '<div class="res-meta"><div class="rk">Indicative estimate-confidence spread</div>' +
            '<div class="rng">−' + down + '% / +' + up + '%</div>' +
            '<div class="res-band"><span class="b" style="left:' + bandLeft + '%;right:' + bandRight + '%"></span><span class="m"></span></div>' +
            '<div class="sub">A wider spread means the documentation supports less confidence in the cost basis. Closing the high-influence gaps below is what tightens it.</div>' +
          '</div>' +
        '</div>' +
        '<div class="res-findings"><h3>What stands out</h3>' + fh + '</div>' +
      '</div></div>' +
      '<div class="res-cta"><h3>This is a 2-minute self-check — not a diagnostic.</h3>' +
        '<p>A decomm.ai diagnostic does this properly: ingesting your actual documentation, scoring nine engineering domains, and returning a costed, board-ready readout verified by a senior engineer. Take this result as the starting conversation.</p>' +
        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
          '<a href="contact.html" class="btn btn-primary">Request the full diagnostic →</a>' +
          '<button class="btn btn-dark print-hide" onclick="window.print()">Save / print this result</button>' +
          '<button class="btn btn-ghost print-hide" id="dgRestart" style="color:var(--ink);border-color:var(--line-2)">Start over</button>' +
        '</div>' +
        '<p style="font-size:11px;color:var(--mist);margin-top:16px">Illustrative only. Generated in your browser from your answers; nothing was sent or stored. Not a substitute for engineering assessment, and it does not compute an accounting ARO figure.</p>' +
      '</div>';
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var rs = document.getElementById('dgRestart');
    if (rs) rs.addEventListener('click', function () {
      answers = new Array(QUESTIONS.length).fill(null); step = 0;
      resultBox.className = 'result'; resultBox.innerHTML = '';
      form.style.display = ''; progress.style.display = 'flex';
      renderStep(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  renderStep();
})();
