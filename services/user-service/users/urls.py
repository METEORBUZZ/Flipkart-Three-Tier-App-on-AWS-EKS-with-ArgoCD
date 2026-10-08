from django.urls import path
from .views import HealthCheckView, RegisterView, LoginView, UserProfileView, AddressListCreateView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='user-health'),
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('profile/<uuid:pk>/', UserProfileView.as_view(), name='user-profile'),
    path('addresses/', AddressListCreateView.as_view(), name='user-addresses'),
]
