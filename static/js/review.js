/* OCR review page: live detection panel, revert, suggestion. */
(function () {
  "use strict";
  const form = document.getElementById("reviewForm");
  const text = document.getElementById("id_edited_text");
  if (!form || !text) return;

  const csrf = form.querySelector("[name=csrfmiddlewaretoken]").value;
  const imported = form.querySelector("[name=imported]");
  const counter = document.getElementById("charCount");
  const original = JSON.parse(document.getElementById("originalOcrData").textContent || '""');
  const last = {};
  let timer = null, ctrl = null;

  const fmtCount = () => { counter.textContent = `${text.value.length.toLocaleString()} characters`; };

  function paint(data) {
    document.querySelectorAll("#detected [data-field]").forEach((el) => {
      let val = data[el.dataset.field];
      if (el.dataset.field === "imported_detected") val = data.imported_detected ? "Yes – import indicators found" : "No indicators found";
      const has = val !== undefined && val !== "" && val !== null;
      el.textContent = has ? val : "Not detected";
      el.classList.toggle("is-empty", !has);
      if (has && last[el.dataset.field] !== val) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
      last[el.dataset.field] = val;
    });
  }

  async function refresh() {
    if (ctrl) ctrl.abort();
    ctrl = new AbortController();
    try {
      const res = await fetch(form.dataset.previewUrl, {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
        body: JSON.stringify({ text: text.value, imported: imported ? imported.value : "auto" }),
      });
      if (res.ok) paint(await res.json());
    } catch (e) { /* aborted or offline – leave the previous values */ }
  }

  const schedule = () => { fmtCount(); clearTimeout(timer); timer = setTimeout(refresh, 350); };
  text.addEventListener("input", schedule);
  if (imported) imported.addEventListener("change", schedule);

  const revert = document.getElementById("revertText");
  if (revert) revert.addEventListener("click", () => {
    if (text.value !== original && !confirm("Discard your edits and restore the raw OCR output?")) return;
    text.value = original; schedule();
  });

  const sugg = document.getElementById("useSuggestion");
  if (sugg) sugg.addEventListener("click", () => {
    const g = form.querySelector("[name=generic_name]");
    g.value = sugg.dataset.value; g.focus();
  });

  fmtCount(); refresh();
})();

