"""Django settings for the Legal Metrology Compliance Checker."""
import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name, default=False):
    return os.environ.get(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


_DEV_KEY = "django-insecure-dev-only-key-change-me-before-deploying"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", _DEV_KEY)
DEBUG = env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = [h.strip() for h in os.environ.get(
    "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,[::1],testserver").split(",") if h.strip()]

if not DEBUG and SECRET_KEY == _DEV_KEY:
    raise ImproperlyConfigured("Set DJANGO_SECRET_KEY when DJANGO_DEBUG is off.")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "core",
    "accounts",
    "compliance",
    "scanner",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "lmchecker.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "core.context_processors.site",
            ],
        },
    },
]

WSGI_APPLICATION = "lmchecker.wsgi.application"
ASGI_APPLICATION = "lmchecker.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-in"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

# Uploaded label images are private: they are only served through an
# ownership-checked view (scanner:image), never directly from MEDIA_URL.
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGIN_URL = "accounts:login"
LOGIN_REDIRECT_URL = "scanner:dashboard"
LOGOUT_REDIRECT_URL = "core:landing"

# --- Upload limits --------------------------------------------------------
MAX_UPLOAD_MB = 8
MAX_IMAGES_PER_SCAN = 6
ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "bmp", "tif", "tiff"]
DATA_UPLOAD_MAX_MEMORY_SIZE = (MAX_UPLOAD_MB * MAX_IMAGES_PER_SCAN + 2) * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 2 * 1024 * 1024

# --- OCR ------------------------------------------------------------------
# 'auto' tries EasyOCR first, then Tesseract. Use 'easyocr' or 'tesseract' to force one.
OCR_ENGINE = os.environ.get("OCR_ENGINE", "auto").lower()
OCR_LANGUAGES = [x.strip() for x in os.environ.get("OCR_LANGUAGES", "en").split(",") if x.strip()]
TESSERACT_CMD = os.environ.get("TESSERACT_CMD", "")
# Below this mean OCR confidence (0-100) a *missing* declaration is reported as
# NEEDS REVIEW rather than FAIL, because the text may simply not have been read.
OCR_RELIABLE_CONFIDENCE = 65

# --- Security -------------------------------------------------------------
SESSION_COOKIE_HTTPONLY = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
if not DEBUG:
    SECURE_SSL_REDIRECT = env_bool("DJANGO_SSL_REDIRECT", True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "loggers": {
        "scanner": {"handlers": ["console"], "level": "INFO"},
        "ocr": {"handlers": ["console"], "level": "INFO"},
    },
}
