from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .models import User, Address
from .serializers import UserSerializer, RegisterSerializer, AddressSerializer

class HealthCheckView(APIView):
    def get(self, request):
        return Response({
            'status': 'healthy',
            'service': 'user-service (Django REST)',
            'database': 'PostgreSQL'
        })

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'token': f'fake-jwt-token-for-{user.id}' # Mock JWT token for MVP
        })

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    queryset = User.objects.all()

class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Address.objects.filter(user_id=user_id)
        return Address.objects.all()
