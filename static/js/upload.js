/* Drag-and-drop uploader with client-side validation and previews. */
(function () {
  "use strict";
  const zone = document.getElementById("dropzone");
  const input = document.getElementById("id_images");
  const grid = document.getElementById("previewGrid");
  const errBox = document.getElementById("clientErrors");
  if (!zone || !input) return;

  const { maxMB, maxFiles } = window.UPLOAD_LIMITS || { maxMB: 8, maxFiles: 6 };
  const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"];
  let files = [];

  const showErrors = (msgs) => {
    errBox.innerHTML = msgs.map((m) => `<div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>${m.replace(/</g, "&lt;")}</div>`).join("");
  };

  function sync() {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    render();
  }

  function render() {
    grid.innerHTML = "";
    files.forEach((f, i) => {
      const item = document.createElement("div");
      item.className = "preview-item";
      const img = document.createElement("img");
      img.alt = f.name;
      img.src = URL.createObjectURL(f);
      img.onload = () => URL.revokeObjectURL(img.src);
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${f.name} · ${(f.size / 1048576).toFixed(1)} MB`;
      const rm = document.createElement("button");
      rm.type = "button"; rm.className = "rm"; rm.title = "Remove"; rm.setAttribute("aria-label", `Remove ${f.name}`);
      rm.innerHTML = '<i class="bi bi-x-lg"></i>';
      rm.addEventListener("click", (e) => { e.stopPropagation(); files.splice(i, 1); sync(); });
      item.append(img, meta, rm);
      grid.appendChild(item);
    });
  }

  function add(list) {
    const errors = [];
    Array.from(list).forEach((f) => {
      if (!OK_TYPES.includes(f.type) && !/\.(jpe?g|png|webp|bmp|tiff?)$/i.test(f.name)) { errors.push(`${f.name}: unsupported file type.`); return; }
      if (f.size > maxMB * 1048576) { errors.push(`${f.name}: larger than ${maxMB} MB.`); return; }
      if (files.some((x) => x.name === f.name && x.size === f.size)) return;
      if (files.length >= maxFiles) { errors.push(`Only ${maxFiles} images are allowed per scan.`); return; }
      files.push(f);
    });
    showErrors(errors);
    sync();
  }

  zone.addEventListener("click", () => input.click());
  zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
  input.addEventListener("click", (e) => e.stopPropagation());
  input.addEventListener("change", () => add(Array.from(input.files)));

  ["dragenter", "dragover"].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add("dragover"); }));
  ["dragleave", "drop"].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove("dragover"); }));
  zone.addEventListener("drop", (e) => add(e.dataTransfer.files));

  // Paste an image from the clipboard
  document.addEventListener("paste", (e) => {
    const imgs = Array.from(e.clipboardData ? e.clipboardData.files : []).filter((f) => f.type.startsWith("image/"));
    if (imgs.length) add(imgs);
  });

  document.getElementById("scanForm").addEventListener("submit", (e) => {
    const manual = document.querySelector("[name=manual_text]");
    if (!files.length && !(manual && manual.value.trim())) {
      e.preventDefault(); e.stopImmediatePropagation();
      showErrors(["Add at least one image, or paste the label text."]);
      zone.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, true);
})();
