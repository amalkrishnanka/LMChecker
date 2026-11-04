from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Legal Metrology Checker – Administration"
admin.site.site_title = "LM Checker Admin"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("accounts.urls")),
    path("", include("scanner.urls")),
    path("", include("core.urls")),
]
