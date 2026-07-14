(function () {
  "use strict";
  const form = document.getElementById("liabilityDiagnostic");
  if (!form) return;

  const steps = [...form.querySelectorAll(".diagnostic-step")];
  const next = document.getElementById("diagnosticNext");
  const back = document.getElementById("diagnosticBack");
  const status = document.getElementById("diagnosticStatus");
  const progressLabel = document.getElementById("diagnosticProgressLabel");
  const progressBar = document.getElementById("diagnosticProgressBar");
  const result = document.getElementById("diagnosticResult");
  const restart = document.getElementById("diagnosticRestart");
  let current = 0;

  const questionLabels = {
    basis: "Basis of estimate and source traceability",
    drawings: "P&IDs and as-built drawings",
    structural: "Structural and weight-control evidence",
    hazmat: "Hazardous-material and NORM inventory",
    isolation: "Isolation and containment records",
    inspection: "Inspection and integrity records",
    waste: "Regulatory end-state and waste pathway",
    wells: "Well P&A and scope boundary",
  };

  function showStep(index) {
    current = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, i) => {
      step.hidden = i !== current;
    });
    progressLabel.textContent = `Question ${current + 1} of ${steps.length}`;
    progressBar.style.width = `${((current + 1) / steps.length) * 100}%`;
    back.hidden = current === 0;
    next.textContent = current === steps.length - 1 ? "View result" : "Next question";
    status.textContent = "";
    const checked = steps[current].querySelector("input:checked");
    (checked || steps[current].querySelector("input"))?.focus({ preventScroll: true });
  }

  function currentAnswered() {
    return Boolean(steps[current].querySelector("input:checked"));
  }

  function calculate() {
    const data = new FormData(form);
    const values = Object.keys(questionLabels).map((key) => ({
      key,
      value: Number(data.get(key)),
    }));
    const total = values.reduce((sum, item) => sum + item.value, 0);
    const score = Math.round((total / (values.length * 2)) * 100);
    let grade;
    let range;
    let summary;
    if (score < 40) {
      grade = "Low evidence confidence";
      range = "−50% / +100%";
      summary =
        "The current basis is highly exposed to inherited assumptions. Establish source traceability and close the cross-cutting evidence gaps before the programme or provision hardens.";
    } else if (score < 60) {
      grade = "Material evidence gaps";
      range = "−40% / +75%";
      summary =
        "Some elements are usable, but several gaps can still move scope, method, waste routing or cost. Target the lowest-scoring evidence areas first.";
    } else if (score < 80) {
      grade = "Developing evidence basis";
      range = "−25% / +50%";
      summary =
        "The basis has useful structure, but targeted verification is still required before relying on it for detailed scope, estimate maturity or regulatory close-out.";
    } else {
      grade = "Stronger evidence position";
      range = "−15% / +30%";
      summary =
        "The source position appears comparatively strong. Independent review should now test material interfaces, recent changes and any gaps that affect the selected end state.";
    }

    const priorities = values
      .filter((item) => item.value < 2)
      .sort((a, b) => a.value - b.value)
      .slice(0, 4);

    document.getElementById("diagnosticScore").textContent = score;
    document.getElementById("diagnosticGrade").textContent = grade;
    document.getElementById("diagnosticSummary").textContent = summary;
    document.getElementById("diagnosticRange").textContent = range;
    document.getElementById("diagnosticGapCount").textContent = String(
      values.filter((item) => item.value < 2).length,
    );
    const list = document.getElementById("diagnosticPriorities");
    list.innerHTML = priorities.length
      ? priorities
          .map(
            (item) =>
              `<span>${questionLabels[item.key]}<small>${item.value === 0 ? "Not evidenced" : "Partly evidenced"}</small></span>`,
          )
          .join("")
      : "<span>No priority gap identified by this self-check.<small>Independent verification still applies.</small></span>";

    form.hidden = true;
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  next?.addEventListener("click", () => {
    if (!currentAnswered()) {
      status.textContent = "Choose the position that best reflects the current evidence.";
      steps[current].querySelector("input")?.focus();
      return;
    }
    if (current === steps.length - 1) calculate();
    else showStep(current + 1);
  });

  back?.addEventListener("click", () => showStep(current - 1));

  steps.forEach((step, index) => {
    step.addEventListener("change", () => {
      status.textContent = "";
      if (index < steps.length - 1) {
        window.setTimeout(() => showStep(index + 1), 180);
      }
    });
  });

  restart?.addEventListener("click", () => {
    form.reset();
    result.hidden = true;
    form.hidden = false;
    showStep(0);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  showStep(0);
})();
