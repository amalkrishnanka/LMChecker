/* Dashboard charts (Chart.js). Data is provided via json_script. */
(function () {
  "use strict";
  const node = document.getElementById("dashboard-data");
  if (!node || !window.Chart) return;
  const d = JSON.parse(node.textContent);
  const css = getComputedStyle(document.documentElement);
  const c = (n) => css.getPropertyValue(n).trim();
  const ok = c("--ok"), bad = c("--bad"), warn = c("--warn"), indigo = c("--indigo"), violet = c("--violet"), cyan = c("--cyan");
  const text = c("--muted"), grid = "rgba(148,163,184,.14)";

  Chart.defaults.color = text;
  Chart.defaults.font.family = "Inter, system-ui, sans-serif";
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.tooltip.backgroundColor = "#11162a";
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 2;
  const common = { responsive: true, maintainAspectRatio: false };
  const el = (id) => document.getElementById(id);

  if (el("chartStatus")) {
    new Chart(el("chartStatus"), {
      type: "doughnut",
      data: { labels: d.status.labels, datasets: [{ data: d.status.data, backgroundColor: ["#ece9e2", "#6f6c65", "#aaa69c"], borderColor: c("--surface"), borderWidth: 4, hoverOffset: 8 }] },
      options: { ...common, cutout: "68%", plugins: { legend: { position: "bottom" } } },
    });
  }

  if (el("chartTrend")) {
    new Chart(el("chartTrend"), {
      data: {
        labels: d.trend.labels,
        datasets: [
          { type: "bar", label: "Scans", data: d.trend.scans, backgroundColor: "#6f6c65", borderRadius: 2, yAxisID: "y", maxBarThickness: 28 },
          { type: "line", label: "Avg score %", data: d.trend.avg_score, borderColor: "#ece9e2", backgroundColor: "#ece9e233", tension: .35, spanGaps: true, pointRadius: 4, pointBackgroundColor: "#ece9e2", yAxisID: "y1" },
        ],
      },
      options: {
        ...common, interaction: { mode: "index", intersect: false },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: grid }, title: { display: true, text: "Scans" } },
          y1: { position: "right", min: 0, max: 100, grid: { drawOnChartArea: false }, title: { display: true, text: "Score %" } },
        },
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  if (el("chartRules")) {
    if (!d.rules.labels.length) {
      el("chartRules").parentElement.innerHTML = '<div class="empty py-4"><i class="bi bi-emoji-smile"></i>No failing declarations yet.</div>';
    } else {
      new Chart(el("chartRules"), {
        type: "bar",
        data: { labels: d.rules.labels, datasets: [
          { label: "Fail", data: d.rules.fail, backgroundColor: "#ece9e2", borderRadius: 2 },
          { label: "Needs review", data: d.rules.review, backgroundColor: "#7f7c74", borderRadius: 2 },
        ] },
        options: { ...common, indexAxis: "y", scales: { x: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, grid: { color: grid } }, y: { stacked: true, grid: { display: false } } }, plugins: { legend: { position: "bottom" } } },
      });
    }
  }

  if (el("chartCategories")) {
    new Chart(el("chartCategories"), {
      type: "bar",
      data: { labels: d.categories.labels, datasets: [{ label: "Scans", data: d.categories.data, backgroundColor: ["#ece9e2", "#d0ccc2", "#b5b1a7", "#9a968d", "#7f7c74", "#65635d", "#4d4b47"], borderRadius: 2, maxBarThickness: 26 }] },
      options: { ...common, indexAxis: "y", scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: grid } }, y: { grid: { display: false } } }, plugins: { legend: { display: false } } },
    });
  }
})();
