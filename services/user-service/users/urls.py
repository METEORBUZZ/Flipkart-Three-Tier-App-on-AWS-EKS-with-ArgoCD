from django.urls import path, re_path
from .views import (
    HealthCheckView, RegisterView, LoginView, UserProfileView, AddressListCreateView,
    SendOTPView, VerifyOTPView
)

urlpatterns = [
    re_path(r'^health/?$', HealthCheckView.as_view(), name='user-health'),
    re_path(r'^register/?$', RegisterView.as_view(), name='user-register'),
    re_path(r'^login/?$', LoginView.as_view(), name='user-login'),
    re_path(r'^otp/send/?$', SendOTPView.as_view(), name='user-otp-send'),
    re_path(r'^otp/verify/?$', VerifyOTPView.as_view(), name='user-otp-verify'),
    re_path(r'^profile/(?P<pk>[^/]+)/?$', UserProfileView.as_view(), name='user-profile'),
    re_path(r'^addresses/?$', AddressListCreateView.as_view(), name='user-addresses'),
]
