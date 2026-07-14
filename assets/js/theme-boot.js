(function () {
  try {
    var saved = localStorage.getItem("endura-theme");
    var theme =
      saved ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches
      ? "dark"
      : "light";
  }
  document.documentElement.classList.remove("no-js");
})();
