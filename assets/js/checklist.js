(function () {
  "use strict";
  const gate = document.getElementById("checklistGate");
  const form = document.getElementById("checklistUnlockForm");
  const checklist = document.getElementById("full-checklist");
  if (!gate || !form || !checklist) return;

  const status = document.getElementById("checklistFormStatus");
  const button = form.querySelector('[type="submit"]');
  const queryUnlocked = new URLSearchParams(location.search).get("unlocked") === "1";
  let sessionUnlocked = false;
  try {
    sessionUnlocked = sessionStorage.getItem("endura-checklist-unlocked") === "true";
  } catch (error) {}

  function unlock(scroll = true) {
    gate.hidden = true;
    checklist.hidden = false;
    checklist.setAttribute("aria-hidden", "false");
    try {
      sessionStorage.setItem("endura-checklist-unlocked", "true");
    } catch (error) {}
    if (scroll) checklist.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (queryUnlocked || sessionUnlocked) unlock(false);

  form.addEventListener("submit", async (event) => {
    const invalid = [...form.elements].find(
      (field) => field.willValidate && !field.checkValidity(),
    );
    if (invalid) {
      event.preventDefault();
      invalid.focus();
      status.textContent = "Complete the required fields to open the checklist.";
      return;
    }
    if (!window.fetch) {
      status.textContent = "Submitting…";
      button.disabled = true;
      return;
    }
    event.preventDefault();
    status.textContent = "Submitting and opening the checklist…";
    button.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("The request could not be submitted.");
      unlock(true);
    } catch (error) {
      status.textContent =
        "The request could not be submitted. Please email jed@enduradecom.com for the checklist.";
      button.disabled = false;
    }
  });

  const items = [...document.querySelectorAll("[data-check-item]")];
  const count = document.getElementById("checkCount");
  const title = document.getElementById("checkSummaryTitle");
  const copy = document.getElementById("checkSummaryCopy");
  function update() {
    const checked = items.filter((item) => item.checked).length;
    count.textContent = checked;
    if (checked <= 5) {
      title.textContent = "The basis carries material evidence uncertainty.";
      copy.textContent =
        "Prioritise the unanswered checks that affect multiple downstream decisions, then test the cost basis again.";
    } else if (checked <= 9) {
      title.textContent = "The basis is developing, but not yet complete.";
      copy.textContent =
        "Several controls are present. Close the remaining cross-discipline gaps before relying on the number for a major commitment.";
    } else {
      title.textContent = "A stronger evidence position is visible.";
      copy.textContent =
        "Independent challenge should now confirm the quality, currency and materiality of the supporting evidence.";
    }
  }
  items.forEach((item) => item.addEventListener("change", update));
  document.getElementById("printChecklist")?.addEventListener("click", () => window.print());
  update();
})();
