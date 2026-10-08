from django.contrib import admin
from django.urls import path, re_path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    re_path(r'^api/v1/users/?', include('users.urls')),
    re_path(r'^api/auth/?', include('users.urls')),
]
