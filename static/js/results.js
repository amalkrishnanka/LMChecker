/* Checklist filter pills. */
(function () {
  "use strict";
  const pills = document.querySelectorAll(".filter-pills [data-filter]");
  const items = document.querySelectorAll("#checklist .check-item");
  pills.forEach((p) => p.addEventListener("click", () => {
    pills.forEach((x) => x.classList.toggle("active", x === p));
    const f = p.dataset.filter;
    items.forEach((it) => { it.style.display = f === "all" || it.dataset.status === f ? "" : "none"; });
  }));
})();
