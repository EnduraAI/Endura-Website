(function () {
  "use strict";
  const stage = document.getElementById("assetStage");
  const model = document.getElementById("assetModel");
  const hotspotLayer = document.getElementById("assetHotspots");
  const list = document.getElementById("explorerDomainList");
  if (!stage || !model || !hotspotLayer || !list) return;

  const domains = [
    {
      key: "Structural",
      title: "Structural Data",
      score: 38,
      copy: "Checks current condition, degradation, modification history and the temporary-state basis behind removal and support decisions.",
      impact: "Removal method, access, lifting, temporary support and sequence.",
      action: "Reconcile structural drawings, inspection evidence and modification records.",
      offshore: [43, 40],
      onshore: [43, 38],
    },
    {
      key: "Hazmat",
      title: "Hazardous Materials",
      score: 41,
      copy: "Tests whether hazardous-material and NORM registers, surveys and sampling history support packaging and disposal planning.",
      impact: "PPE, decontamination, waste routing, programme and cost.",
      action: "Validate the register against current areas, quantities and classifications.",
      offshore: [67, 50],
      onshore: [72, 56],
    },
    {
      key: "Isolation",
      title: "Isolation and Containment",
      score: 44,
      copy: "Reviews retained inventories, line status, isolation records and boundary conditions affecting safe preparation.",
      impact: "Make-safe scope, offshore exposure and execution interfaces.",
      action: "Reconcile the isolation philosophy to current P&IDs and field status.",
      offshore: [30, 56],
      onshore: [26, 60],
    },
    {
      key: "As-builts",
      title: "As-Built Drawings",
      score: 55,
      copy: "Locates modification drift, missing packages and configuration changes that affect the scope basis.",
      impact: "Quantities, access, interfaces and method definition.",
      action: "Prioritise drawings connected to high-consequence scope decisions.",
      offshore: [51, 26],
      onshore: [57, 30],
    },
    {
      key: "P&IDs",
      title: "P&IDs",
      score: 62,
      copy: "Checks revision alignment, tie-ins, process boundaries and whether the process basis reflects the current asset.",
      impact: "Isolation, residual inventory, cleaning and scope limits.",
      action: "Resolve revision conflicts and field-verify critical boundaries.",
      offshore: [58, 48],
      onshore: [42, 57],
    },
    {
      key: "Waste",
      title: "Waste Classification",
      score: 64,
      copy: "Reviews expected waste streams, classifications, routing assumptions and current disposal capacity.",
      impact: "Disposal route, logistics, permits, programme and recovery value.",
      action: "Connect material quantities to confirmed classifications and facilities.",
      offshore: [75, 65],
      onshore: [78, 68],
    },
    {
      key: "Well P&A",
      title: "Well P&A",
      score: 71,
      copy: "Separates well-scope confidence from facility scope and exposes unresolved suspended-well information.",
      impact: "Battery limits, schedule, regulatory pathway and liability allocation.",
      action: "Confirm well status, ownership, records and scope demarcation.",
      offshore: [38, 68],
      onshore: [20, 72],
    },
    {
      key: "Weight",
      title: "Weight Control",
      score: 79,
      copy: "Reconciles weight reports, modifications and allowances before lift or transport strategies harden.",
      impact: "Lift studies, transport, support design and contingency.",
      action: "Close the delta between weight reports, drawings and change records.",
      offshore: [52, 60],
      onshore: [61, 46],
    },
    {
      key: "Inspection",
      title: "Inspection Records",
      score: 84,
      copy: "Connects current condition evidence to access, dismantling and temporary-state assumptions.",
      impact: "Personnel access, plant selection, sequence and risk controls.",
      action: "Confirm the inspection basis remains current for the intended method.",
      offshore: [48, 74],
      onshore: [49, 72],
    },
  ];

  let asset = "offshore";
  let selected = domains[0].key;
  let rotateX = -7;
  let rotateY = 0;
  let scale = 1;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function qualityClass(score) {
    return score < 50 ? "critical" : score < 70 ? "moderate" : "good";
  }

  function renderLists() {
    list.innerHTML = domains
      .map(
        (domain) =>
          `<button type="button" role="tab" class="explorer-domain-btn ${domain.key === selected ? "active" : ""}" data-domain="${domain.key}" aria-selected="${domain.key === selected}"><span>${domain.title}</span><strong class="${qualityClass(domain.score)}">${domain.score}</strong></button>`,
      )
      .join("");
    hotspotLayer.innerHTML = domains
      .map((domain, index) => {
        const position = domain[asset];
        return `<button type="button" class="asset-hotspot ${qualityClass(domain.score)} ${domain.key === selected ? "active" : ""}" data-domain="${domain.key}" style="left:${position[0]}%;top:${position[1]}%" aria-label="${domain.title}, illustrative score ${domain.score}"><span>${index + 1}</span></button>`;
      })
      .join("");
    [...list.querySelectorAll("button"), ...hotspotLayer.querySelectorAll("button")].forEach(
      (button) => button.addEventListener("click", () => selectDomain(button.dataset.domain)),
    );
  }

  function selectDomain(key) {
    const domain = domains.find((item) => item.key === key);
    if (!domain) return;
    selected = key;
    document.getElementById("explorerDomainK").textContent = domain.key;
    document.getElementById("explorerDomainTitle").textContent = domain.title;
    document.getElementById("explorerDomainScore").textContent = domain.score;
    document.getElementById("explorerDomainMeter").style.width = `${domain.score}%`;
    document.getElementById("explorerDomainCopy").textContent = domain.copy;
    document.getElementById("explorerDomainImpact").textContent = domain.impact;
    document.getElementById("explorerDomainAction").textContent = domain.action;
    renderLists();
  }

  function applyTransform() {
    model.style.transform = `perspective(980px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
  }

  function setAsset(nextAsset) {
    asset = nextAsset;
    document
      .querySelector(".offshore-model")
      ?.toggleAttribute("hidden", asset !== "offshore");
    document
      .querySelector(".onshore-model")
      ?.toggleAttribute("hidden", asset !== "onshore");
    document.querySelectorAll("[data-asset]").forEach((button) => {
      const active = button.dataset.asset === asset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderLists();
  }

  document.querySelectorAll("[data-asset]").forEach((button) =>
    button.addEventListener("click", () => setAsset(button.dataset.asset)),
  );

  stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("dragging");
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    rotateY += (event.clientX - startX) * 0.18;
    rotateX -= (event.clientY - startY) * 0.12;
    rotateX = Math.max(-24, Math.min(18, rotateX));
    startX = event.clientX;
    startY = event.clientY;
    applyTransform();
  });
  function endDrag(event) {
    dragging = false;
    stage.classList.remove("dragging");
    if (event?.pointerId && stage.hasPointerCapture(event.pointerId))
      stage.releasePointerCapture(event.pointerId);
  }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      scale = Math.max(0.78, Math.min(1.35, scale - event.deltaY * 0.001));
      applyTransform();
    },
    { passive: false },
  );
  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") rotateY -= 5;
    else if (event.key === "ArrowRight") rotateY += 5;
    else if (event.key === "ArrowUp") rotateX -= 3;
    else if (event.key === "ArrowDown") rotateX += 3;
    else if (event.key === "+" || event.key === "=") scale = Math.min(1.35, scale + 0.08);
    else if (event.key === "-") scale = Math.max(0.78, scale - 0.08);
    else return;
    event.preventDefault();
    applyTransform();
  });
  document.getElementById("zoomIn")?.addEventListener("click", () => {
    scale = Math.min(1.35, scale + 0.1);
    applyTransform();
  });
  document.getElementById("zoomOut")?.addEventListener("click", () => {
    scale = Math.max(0.78, scale - 0.1);
    applyTransform();
  });
  document.getElementById("resetView")?.addEventListener("click", () => {
    rotateX = -7;
    rotateY = 0;
    scale = 1;
    applyTransform();
  });

  setAsset("offshore");
  selectDomain("Structural");
  applyTransform();
})();
