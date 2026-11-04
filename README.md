# Legal Metrology Compliance Checker

A Django web application that checks packaged-commodity labels against the declaration requirements of the
**Legal Metrology (Packaged Commodities) Rules, 2011** (as amended). Upload product / packaging / label images,
let OCR extract the text, **correct it manually**, and get a rule-by-rule report (PASS / FAIL / NEEDS REVIEW /
NOT APPLICABLE) with reasons, suggestions and a downloadable PDF.

> **This is a decision-support tool, not legal advice.** Rule references are given at rule level
> (e.g. "Rule 6(1)") on purpose; sub-clauses were renumbered by amendments (such as the 2017 amendment).
> Verify every result against the current Gazette text. Anything the software cannot decide is reported as
> **NEEDS REVIEW** instead of being guessed.

---------------------------------------------------------------------------------------------------

## Features

| Area | What you get |
|------|--------------|
| Auth | Registration, login, logout, profile/settings (details, password, default category, delete all my data) |
| Scanner | Drag-and-drop / paste / browse upload of up to 6 images, client + server validation, or paste text manually |
| OCR | EasyOCR **or** Tesseract (auto-selected), OpenCV pre-processing (EXIF rotation, upscaling, denoise, CLAHE, adaptive threshold), per-image confidence |
| Manual verification | Editable label text, live "detected declarations" panel, revert-to-OCR, "I verified this text" flag |
| Compliance engine | 10 configurable checks, mandatory vs conditional vs not-applicable, exemption claims, OCR-confidence aware |
| Reports | Score, overall verdict, per-rule findings & suggestions, every analysis stored (re-analyse after editing), PDF export, print view |
| History | Search, filter by result/category/date, sort, pagination, delete |
| Dashboard | KPI cards and Chart.js charts: status breakdown, 14-day trend, most-failing declarations, categories |
| UI | Dark slate/indigo/violet/cyan SaaS theme, responsive, animations, green/red/amber status colours |
| Admin | Django admin for scans/reports and **rule settings** (enable/disable, mandatory↔conditional, weights) |

## Technology

Python 3.10+ · Django 5.1–6.1 · SQLite (Django ORM) · Pillow · OpenCV (headless) · EasyOCR / pytesseract ·
ReportLab (PDF) · Bootstrap 5.3, Bootstrap Icons, Chart.js (loaded from CDN) · vanilla JS.

---------------------------------------------------------------------------------------------------

## Quick start

```bash
# 1. create & activate a virtual environment
python -m venv .venv
.venv\Scripts\activate            # Windows PowerShell:  .venv\Scripts\Activate.ps1
# source .venv/bin/activate       # macOS / Linux

# 2. install dependencies
pip install -r requirements.txt

# 3. create the database (migrations are included)
python manage.py migrate

# 4. (optional) demo data + sample label images
python manage.py seed_demo            # creates user  demo / Demo@12345  and 10 analysed scans
python manage.py make_sample_labels   # writes 3 test label PNGs to ./sample_labels

# 5. (optional) an admin account for /admin/ (rule settings, all data)
python manage.py createsuperuser

# 6. run
python manage.py runserver
```

Open <http://127.0.0.1:8000/>. Sign in with the demo user, or register your own account, then
**Product scanner → upload `sample_labels/compliant_label.png`**.

The demo credentials are for local development only; delete that user before deploying anywhere shared.

### OCR engines

The app works with whichever engine is available; `OCR_ENGINE=auto` (default) tries EasyOCR, then Tesseract.

* **EasyOCR** (`pip install easyocr`) – no system install, but pulls in PyTorch (large) and **downloads its models
  (~100 MB) on first use**, so the first scan needs internet and takes longer.
* **Tesseract** – install the binary, then `pip install pytesseract`:
  * Windows: <https://github.com/UB-Mannheim/tesseract/wiki> (found automatically in `C:\Program Files\Tesseract-OCR`, or set `TESSERACT_CMD`)
  * Ubuntu/Debian: `sudo apt install tesseract-ocr`   ·   macOS: `brew install tesseract`
* **No OCR at all?** Everything still works – paste the label text in the scanner (or type it in the review page).

| Environment variable | Default | Purpose |
|----------------------|---------|---------|
| `OCR_ENGINE` | `auto` | `auto`, `easyocr` or `tesseract` |
| `OCR_LANGUAGES` | `en` | Comma separated, e.g. `en,hi` (EasyOCR) |
| `TESSERACT_CMD` | – | Path to `tesseract` binary |
| `DJANGO_DEBUG` | `1` | Set `0` in production |
| `DJANGO_SECRET_KEY` | dev key | **Required** when `DJANGO_DEBUG=0` |
| `DJANGO_ALLOWED_HOSTS` | localhost | Comma separated hosts |

### Tests

```bash
python manage.py test        # engine rules, upload validation, auth/ownership, full scan → report → PDF flow
```

---------------------------------------------------------------------------------------------------

## Project structure

```
lmchecker/            Django project (settings, urls, wsgi/asgi)
core/                 Landing page, shared Bootstrap form mixin, template filters, context processor
accounts/             Profile model, registration / login / logout / profile views, forms
compliance/           ★ Rules engine (no web code)
  rules.py              Declarative rule catalogue + exemption claims (edit here)
  extractors.py         Regex extraction of declarations from text
  engine.py             Checkers (one function per rule), scoring, overall verdict
  models.py / admin.py  RuleSetting – per-install overrides editable in /admin/
  data/commodities.txt  Word list used only to *suggest* a generic name
ocr/                  OCR layer: preprocess.py (OpenCV) + engine.py (EasyOCR / Tesseract)
scanner/              Scan workflow
  models.py             Scan, ScanImage, ComplianceReport, CheckResult
  forms.py / validators.py   Upload + review forms, secure image validation
  services.py           run_ocr_for_scan, run_analysis, dashboard_stats
  pdf.py                ReportLab PDF report
  views.py / urls.py    Dashboard, scan, review, results, history, report, PDF, private image serving
  management/commands/  seed_demo, make_sample_labels
templates/            base.html → base_public.html / base_app.html + partials, per-app pages
static/css/app.css    Design system        static/js/  app, upload, review, results, dashboard
```

### Database architecture

```
User 1──1 Profile
User 1──* Scan ───────────────────────────────────────────────────────────────────────────
           │ title, category, imported(auto|yes|no), wholesale, generic_name
           │ ocr_text (raw, never edited) · edited_text (working copy) · text_verified
           │ ocr_confidence, ocr_engine, ocr_error · status · overall · score (denormalised for history/filters)
           ├──* ScanImage        image (private upload), kind, per-image ocr_text / confidence
           └──* ComplianceReport one per analysis run (history is kept)
                  │ analyzed_text snapshot, imported/wholesale/verified flags, score, overall, counts,
                  │ extracted (JSON), ruleset_version
                  └──* CheckResult   code, title, category, status, found_value, reason, suggestion, reference
RuleSetting (code unique) – enabled / category / weight overrides for compliance rules
```

---------------------------------------------------------------------------------------------------

## How compliance is decided

### Statuses
* **PASS** – declaration found and consistent with the checklist.
* **FAIL** – required declaration missing/incorrect **and the text is trustworthy**.
* **NEEDS REVIEW** – uncertain: ambiguous wording, unverifiable item, or the declaration is missing but OCR was
  unreliable (see below).
* **NOT APPLICABLE** – conditional rule not triggered, or an exemption was claimed by the user.

### OCR is treated as inaccurate
A *missing* declaration becomes **FAIL** only if the text is **verified** (the user ticked "I have checked this
text", or edited it) or mean OCR confidence ≥ 65 (`OCR_RELIABLE_CONFIDENCE`). Otherwise it is **NEEDS REVIEW** with
a note that the declaration may simply not have been read. Manually pasted text counts as verified.

### The checklist (`compliance/rules.py`)

| Code | Check | Category | Notes |
|------|-------|----------|-------|
| `manufacturer_packer` | Manufacturer / packer name & address | Mandatory | Needs name + address; PIN code expected. "Marketed by" alone → NEEDS REVIEW. |
| `importer` | Importer name & address | **Conditional** | Only for imports (flag, "Imported by", or foreign country of origin). |
| `generic_name` | Common / generic name | Mandatory | Cannot be reliably OCR'd: confirmed in the review step, else NEEDS REVIEW. |
| `net_quantity` | Net quantity | Mandatory | Needs a "Net" heading; "gross only", approx, zero, multipack are flagged. |
| `standard_unit` | Standard unit | Mandatory | g/kg, ml/l, mm/cm/m, number → PASS; `gm`, `ltr`, `kgs`… → NEEDS REVIEW; oz/lb/cl… → FAIL. |
| `mrp` | MRP, inclusive of all taxes | Mandatory | Amount + "MRP/Maximum Retail Price" + "inclusive of all taxes". Not applicable if wholesale is claimed. |
| `date` | Month & year of manufacture / packing / import | Mandatory | Expiry-type dates alone do not count; future dates → NEEDS REVIEW. |
| `consumer_care` | Consumer care details | Mandatory | Care wording + phone/e-mail. |
| `country_of_origin` | Country of origin | **Conditional** | Required for imports; otherwise N/A. |
| `unit_sale_price` | Unit sale price | **Conditional** | Depends on commodity/pack size → NEEDS REVIEW when absent, never FAIL. N/A if wholesale. |

**Score** = Σ(weight × credit) / Σ(weight of applicable rules), credit = 1 (pass), 0.5 (review), 0 (fail).
**Overall** = Non-compliant if any FAIL; else Needs review if any REVIEW; else Compliant.

### Configuring rules
* **Admin → Compliance → Rule settings**: disable a rule, switch it between mandatory/conditional, change its weight.
* **Code**: add/modify rules in `compliance/rules.py` (data) and register a checker with `@checker("code")` in
  `compliance/engine.py`. Exemption claims live in `EXEMPTIONS` (currently: wholesale/industrial package).
* Bump `RULESET_VERSION` when you change rules; each report stores the version it was produced with.

### Exemptions & amendments
Exemptions are **claims made by the user** (e.g. the wholesale switch) and are recorded in the report; they are
never inferred. What is claimed as exempt is listed in `EXEMPTIONS` so it can be adapted to the exact text of the
Rules/amendments you must apply. Small-pack exemptions, commodity-specific rules and other amendments are *not*
silently assumed – unverifiable points surface as NEEDS REVIEW.

### Known limitations
* Visual requirements (numeral height, prominence, placement, language) cannot be assessed from OCR text.
* Commodity-specific rules (e.g. under other statutes such as FSSAI, drugs/cosmetics rules) are out of scope.
* Pattern-based extraction is tuned for English/Indian label conventions; unusual layouts need manual correction.
* Rule references are kept at rule level; confirm sub-clauses against the current Gazette.

---------------------------------------------------------------------------------------------------

## Security notes
* CSRF on every form/POST (including logout and the live-preview call); login required on all app pages.
* Uploads: extension allow-list, size cap (8 MB), real image verification with Pillow, format allow-list, min/max
  dimensions, decompression-bomb limit, random file names, per-user folders.
* Images are **private**: served only via an ownership-checked view (`/media/scan-image/<id>/`), never by a public
  `MEDIA_URL`. All scans/reports/PDFs are queried with `user=request.user` (404 for other users).
* Production (`DJANGO_DEBUG=0`) enables secure cookies, HSTS and SSL redirect; a real `DJANGO_SECRET_KEY` is mandatory.
  Run behind a proper web server (gunicorn/uvicorn + nginx), run `collectstatic`, and consider PostgreSQL for multi-user use.
  OCR runs synchronously in the request; for heavy load move `run_ocr_for_scan` to a task queue (Celery/RQ).

## Troubleshooting
| Problem | Fix |
|---------|-----|
| "No OCR engine detected" | Install `easyocr` or Tesseract (+ `pytesseract`); or paste text manually. |
| First EasyOCR scan is slow / fails offline | It downloads models on first use – needs internet once. |
| `TesseractNotFoundError` | Set `TESSERACT_CMD` to the executable path. |
| Pages unstyled offline | Bootstrap, icons, Chart.js and Inter font load from CDNs; vendor them into `static/` for offline use. |
| Many NEEDS REVIEW results | Tick "I have checked this text" after correcting it, and confirm the generic name. |
