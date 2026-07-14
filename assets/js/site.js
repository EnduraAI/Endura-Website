(function () {
  "use strict";
  const root = document.documentElement,
    body = document.body,
    reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = document.querySelector(".site-nav"),
    progress = document.querySelector(".progress"),
    menu = document.querySelector(".menu-btn"),
    navLinks = document.querySelector(".nav-links");
  const closeMenu = () => {
    body.classList.remove("nav-open");
    menu?.setAttribute("aria-expanded", "false");
  };
  menu?.addEventListener("click", () => {
    const open = body.classList.toggle("nav-open");
    menu.setAttribute("aria-expanded", String(open));
  });
  navLinks
    ?.querySelectorAll("a")
    .forEach((a) => a.addEventListener("click", closeMenu));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  function setTheme(theme, button) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem("endura-theme", theme);
    } catch (e) {}
    document.querySelectorAll(".theme-btn").forEach((b) => {
      b.setAttribute("aria-pressed", String(theme === "dark"));
      b.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      );
      b.title =
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    });
  }
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
    btn.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      if (document.startViewTransition && !reduce) {
        document.startViewTransition(() => setTheme(next, btn));
      } else setTheme(next, btn);
    });
  });
  const updateScroll = () => {
    nav?.classList.toggle("scrolled", scrollY > 8);
    if (progress) {
      const d = document.documentElement,
        max = d.scrollHeight - d.clientHeight;
      progress.style.width = (max ? (d.scrollTop / max) * 100 : 0) + "%";
    }
  };
  addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();
  const revealObs = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          revealObs.unobserve(e.target);
        }
      }),
    { threshold: 0.08, rootMargin: "0px 0px -4%" },
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));
  // Decision console
  const stageData = [
    {
      k: "Question",
      title: "Frame the decision",
      copy: "Define the asset boundary, decision gate, commercial driver and required outcome.",
      out: "Output: scope brief and decision criteria",
    },
    {
      k: "Evidence",
      title: "Test the basis",
      copy: "Review source records, assumptions, interfaces and the information gaps that materially affect the programme.",
      out: "Output: evidence map and assumptions register",
    },
    {
      k: "Options",
      title: "Compare credible pathways",
      copy: "Evaluate technical, regulatory, environmental, schedule and cost effects on a consistent basis.",
      out: "Output: comparative assessment and business case",
    },
    {
      k: "Action",
      title: "Move the programme forward",
      copy: "Translate the findings into a defined next step, ownership path and review-ready decision package.",
      out: "Output: decision pack and next-gate plan",
    },
  ];
  const tabs = [...document.querySelectorAll(".stage-tab")],
    sk = document.querySelector("[data-stage-k]"),
    st = document.querySelector("[data-stage-title]"),
    sc = document.querySelector("[data-stage-copy]"),
    so = document.querySelector("[data-stage-output]"),
    sp = document.querySelector(".console-progress span");
  let si = 0,
    timer = 0,
    progressRaf = 0,
    start = 0,
    visible = true;
  function activateStage(i, manual = false) {
    si = i;
    tabs.forEach((b, n) => {
      const a = n === i;
      b.classList.toggle("active", a);
      b.setAttribute("aria-selected", String(a));
      b.tabIndex = a ? 0 : -1;
    });
    const d = stageData[i];
    if (sk) sk.textContent = d.k;
    if (st) st.textContent = d.title;
    if (sc) sc.textContent = d.copy;
    if (so) so.textContent = d.out;
    if (sp) {
      sp.style.transition = "none";
      sp.style.width = "0";
      requestAnimationFrame(() => {
        sp.style.transition = "width 4.8s linear";
        sp.style.width = "100%";
      });
    }
    if (manual) restartStageTimer();
  }
  function restartStageTimer() {
    clearInterval(timer);
    if (!reduce && visible)
      timer = setInterval(
        () => activateStage((si + 1) % stageData.length),
        5000,
      );
  }
  tabs.forEach((b, i) => {
    b.addEventListener("click", () => activateStage(i, true));
    b.addEventListener("keydown", (e) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      let n = i;
      if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") n = 0;
      if (e.key === "End") n = tabs.length - 1;
      tabs[n].focus();
      activateStage(n, true);
    });
  });
  if (tabs.length) {
    activateStage(0);
    restartStageTimer();
    const panel = document.querySelector(".decision-panel");
    new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          visible = e.isIntersecting && !document.hidden;
          if (visible) restartStageTimer();
          else clearInterval(timer);
        }),
      { threshold: 0.08 },
    ).observe(panel);
  }
  // Canvas data field
  const canvas = document.querySelector(".decision-canvas");
  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    let pts = [],
      raf = 0,
      show = true;
    function size() {
      const r = canvas.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio || 1, 1.6);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: r.width < 600 ? 26 : 44 }, () => ({
        x: Math.random() * r.width,
        y: Math.random() * r.height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: 1 + Math.random() * 1.8,
        p: Math.random() * 6.28,
      }));
    }
    function draw(t) {
      if (!show) return;
      const w = canvas.clientWidth,
        h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j],
            dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 115) {
            ctx.strokeStyle = `rgba(30,123,115,${(1 - dist / 115) * 0.16})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(231,118,34,${0.35 + 0.35 * Math.sin(t * 0.001 + a.p)})`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    size();
    addEventListener("resize", size);
    const obs = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          show = e.isIntersecting && !document.hidden;
          cancelAnimationFrame(raf);
          if (show) raf = requestAnimationFrame(draw);
        }),
      { threshold: 0.02 },
    );
    obs.observe(canvas);
    raf = requestAnimationFrame(draw);
    document.addEventListener("visibilitychange", () => {
      show = !document.hidden;
      cancelAnimationFrame(raf);
      if (show) raf = requestAnimationFrame(draw);
    });
  }
  // Process animation
  const pw = document.querySelector(".process-wrap"),
    fill = document.querySelector(".process-line span");
  if (pw && fill)
    new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            fill.style.width = "100%";
            pw.querySelectorAll(".process-step").forEach((s, i) =>
              setTimeout(() => s.classList.add("in-view"), i * 180),
            );
          }
        }),
      { threshold: 0.28 },
    ).observe(pw);
  // Platform domain controls
  const domainData = {
    "P&IDs": [
      "P&IDs and isolation logic",
      "Checks revision alignment, tie-ins, isolation philosophy and whether the process basis reflects the current asset.",
      68,
    ],
    "As-builts": [
      "As-built drawings",
      "Locates modification drift, missing packages and configuration changes affecting scope confidence.",
      55,
    ],
    Inspection: [
      "Inspection records",
      "Connects current condition evidence to access, lifting, dismantling and temporary-state assumptions.",
      74,
    ],
    Hazmat: [
      "Hazardous materials",
      "Tests whether registers, surveys and sampling history support packaging and disposal planning.",
      46,
    ],
    Waste: [
      "Waste classification",
      "Reviews expected waste streams, classifications, routing assumptions and evidence gaps.",
      62,
    ],
    "Well P&A": [
      "Well P&A",
      "Separates well-scope confidence from facility scope and exposes unresolved suspended-well information.",
      71,
    ],
    Structural: [
      "Structural data",
      "Checks degradation, temporary states and the basis supporting removal method development.",
      39,
    ],
    Weight: [
      "Weight control",
      "Reconciles weight reports, modifications and allowances before lift or transport strategies harden.",
      81,
    ],
    Isolation: [
      "Isolation and containment",
      "Reviews isolation records, retained inventories and boundary conditions affecting safe preparation.",
      52,
    ],
  };
  const db = [...document.querySelectorAll(".domain-btn")],
    dt = document.querySelector("[data-readout-title]"),
    dc = document.querySelector("[data-readout-copy]"),
    dm = document.querySelector("[data-meter]");
  function setDomain(k) {
    const d = domainData[k];
    if (!d) return;
    db.forEach((b) => {
      const a = b.dataset.domain === k;
      b.classList.toggle("active", a);
      b.setAttribute("aria-selected", String(a));
      b.tabIndex = a ? 0 : -1;
    });
    if (dt) dt.textContent = d[0];
    if (dc) dc.textContent = d[1];
    if (dm) dm.style.width = d[2] + "%";
  }
  db.forEach((b, i) => {
    b.addEventListener("click", () => setDomain(b.dataset.domain));
    b.addEventListener("keydown", (e) => {
      if (
        ![
          "ArrowRight",
          "ArrowLeft",
          "ArrowDown",
          "ArrowUp",
          "Home",
          "End",
        ].includes(e.key)
      )
        return;
      e.preventDefault();
      let n = i;
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        n = (i + 1) % db.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        n = (i - 1 + db.length) % db.length;
      if (e.key === "Home") n = 0;
      if (e.key === "End") n = db.length - 1;
      db[n].focus();
      setDomain(db[n].dataset.domain);
    });
  });
  if (db[0]) setDomain(db[0].dataset.domain);
  // Modules and Ask dataset
  const modules = {
    A: [
      "Asset Data Integrity Index",
      "Scores documentation integrity across the nine canonical domains and preserves source traceability.",
    ],
    B: [
      "Variance and Sensitivity",
      "Shows which information gaps and cost drivers are most influential without exposing proprietary weighting logic.",
    ],
    C: [
      "Jurisdiction and Regulatory Overlay",
      "Maps applicable obligations and evidence status against the asset basis.",
    ],
    D: [
      "Regulatory and Environmental Cost Influence",
      "Connects regulatory and environmental obligations to cost influence and timing.",
    ],
    E: [
      "SECE and Operational Readiness",
      "Provides a structured view of safety-critical elements and late-life execution dependencies.",
    ],
    F: [
      "Permit Relinquishment and Regulatory Closure",
      "Tracks evidence and obligations supporting relinquishment and regulatory close-out.",
    ],
  };
  const mb = [...document.querySelectorAll(".module-btn")],
    mt = document.querySelector("[data-module-title]"),
    mc = document.querySelector("[data-module-copy]");
  function setModule(k) {
    const d = modules[k];
    if (!d) return;
    mb.forEach((b) => {
      const a = b.dataset.module === k;
      b.classList.toggle("active", a);
      b.setAttribute("aria-selected", String(a));
      b.tabIndex = a ? 0 : -1;
    });
    if (mt) mt.textContent = d[0];
    if (mc) mc.textContent = d[1];
  }
  mb.forEach((b, i) => {
    b.addEventListener("click", () => setModule(b.dataset.module));
    b.addEventListener("keydown", (e) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      let n = i;
      if (e.key === "ArrowRight") n = (i + 1) % mb.length;
      if (e.key === "ArrowLeft") n = (i - 1 + mb.length) % mb.length;
      if (e.key === "Home") n = 0;
      if (e.key === "End") n = mb.length - 1;
      mb[n].focus();
      setModule(mb[n].dataset.module);
    });
  });
  if (mb[0]) setModule(mb[0].dataset.module);
  const answers = {
    "Which gaps are driving uncertainty?":
      "Structural data, hazardous materials and isolation records are the highest-priority review areas in this sanitised demonstration. The next action is source validation, not an automatic estimate adjustment.",
    "What should be remediated first?":
      "Start with gaps affecting multiple downstream decisions. Verify structural and weight-control records, then close the hazardous-material and isolation evidence needed for scope definition.",
    "Can the estimate basis be tightened?":
      "Potentially, for targeted cost drivers. Any movement in estimate maturity must be supported by scope definition, source quality and engineering review.",
  };
  const qb = [...document.querySelectorAll("[data-question]")],
    qq = document.querySelector("[data-ask-question]"),
    qa = document.querySelector("[data-ask-answer]");
  qb.forEach((b) =>
    b.addEventListener("click", () => {
      const q = b.dataset.question;
      if (qq) qq.textContent = q;
      if (qa) {
        qa.classList.remove("show");
        requestAnimationFrame(() => {
          qa.textContent = answers[q];
          qa.classList.add("show");
        });
      }
    }),
  );
  // Formspree contact form validation and progressive enhancement
  const form = document.getElementById("contactForm");
  if (form) {
    const status = form.querySelector(".form-status");
    const submitButton = form.querySelector('[type="submit"]');
    form.addEventListener("submit", async (e) => {
      const invalid = [...form.elements].find(
        (x) => x.willValidate && !x.checkValidity(),
      );
      if (invalid) {
        e.preventDefault();
        invalid.focus();
        if (status) status.textContent = "Please complete the highlighted required fields.";
        return;
      }
      if (!window.fetch) {
        if (status) status.textContent = "Submitting securely…";
        if (submitButton) submitButton.disabled = true;
        return;
      }
      e.preventDefault();
      if (status) status.textContent = "Submitting securely…";
      if (submitButton) submitButton.disabled = true;
      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          let message = "The form could not be submitted. Please email jed@enduradecom.com.";
          try {
            const payload = await response.json();
            if (payload?.errors?.length)
              message = payload.errors.map((item) => item.message).join(" ");
          } catch (error) {}
          throw new Error(message);
        }
        const next =
          form.dataset.successUrl ||
          form.querySelector('[name="_next"]')?.value ||
          "thanks.html";
        window.location.assign(next);
      } catch (error) {
        if (status)
          status.textContent =
            error?.message ||
            "The form could not be submitted. Please email jed@enduradecom.com.";
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
})();
