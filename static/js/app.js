/* Global UI behaviour: sidebar, loading buttons, confirms, reveal animations. */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Mobile sidebar
  const toggle = $("#sidebarToggle"), backdrop = $("#sidebarBackdrop");
  if (toggle) toggle.addEventListener("click", () => document.body.classList.toggle("sidebar-open"));
  if (backdrop) backdrop.addEventListener("click", () => document.body.classList.remove("sidebar-open"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.body.classList.remove("sidebar-open"); });

  // Show/hide password
  $$("[data-toggle-password]").forEach((btn) => btn.addEventListener("click", () => {
    const input = btn.parentElement.querySelector("input");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.innerHTML = `<i class="bi ${show ? "bi-eye-slash" : "bi-eye"}"></i>`;
  }));

  // Confirm dialogs on forms
  $$("form[data-confirm]").forEach((form) => form.addEventListener("submit", (e) => {
    if (!window.confirm(form.dataset.confirm)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }));

  // Loading state on submit buttons (disabled after the form data has been collected)
  $$("form[data-loading]").forEach((form) => form.addEventListener("submit", (e) => {
    if (e.defaultPrevented) return;
    const btn = e.submitter || $("button[type=submit], button:not([type])", form);
    if (!btn || !btn.dataset.loadingText) return;
    setTimeout(() => {
      btn.disabled = true;
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = `<span class="spinner-border me-2" role="status" aria-hidden="true"></span>${btn.dataset.loadingText}`;
    }, 0);
  }));
  // Restore buttons when returning via the back/forward cache
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    $$("button[data-original]").forEach((b) => { b.disabled = false; b.innerHTML = b.dataset.original; });
  });

  // Auto-submit filters
  $$("[data-autosubmit]").forEach((el) => el.addEventListener("change", () => el.form && el.form.submit()));

  // Delete modal wiring
  const modal = $("#deleteModal");
  if (modal) modal.addEventListener("show.bs.modal", (ev) => {
    const b = ev.relatedTarget;
    $("#deleteForm").action = b.dataset.deleteUrl;
    $("#deleteTitle").textContent = b.dataset.deleteTitle;
  });

  // Dismiss success alerts automatically
  $$(".alert-success").forEach((a) => setTimeout(() => {
    if (window.bootstrap && document.body.contains(a)) bootstrap.Alert.getOrCreateInstance(a).close();
  }, 6000));

  // Scroll reveal
  const reveal = $$(".reveal");
  if ("IntersectionObserver" in window && reveal.length) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { threshold: 0.12 });
    reveal.forEach((el) => io.observe(el));
  } else reveal.forEach((el) => el.classList.add("in"));

  // Count-up numbers
  $$("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    if (!isFinite(target) || target === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t0 = performance.now(), dur = 800;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
})();
