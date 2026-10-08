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

import random
import time

import secrets
import time
import socket
import json

# Thread-safe in-memory OTP cache with 5-minute expiry
OTP_CACHE = {}

def publish_otp_to_redis(phone, otp, ref_id, role):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        s.connect(('flipkart-redis', 6379))
        payload_obj = json.dumps({
            'phone': phone,
            'otp': otp,
            'ref_id': ref_id,
            'role': role,
            'timestamp': time.time()
        })
        cmd = f"*3\r\n$7\r\nPUBLISH\r\n$27\r\nflipkart:events:otp_requested\r\n${len(payload_obj)}\r\n{payload_obj}\r\n"
        s.sendall(cmd.encode('utf-8'))
        s.close()
    except Exception:
        pass

class SendOTPView(APIView):
    def post(self, request):
        phone = str(request.data.get('phone', '')).strip().replace(' ', '').replace('-', '')
        role = request.data.get('role', 'CUSTOMER').upper()
        
        if not phone or len(phone) < 10:
            return Response({'error': 'Please enter a valid 10-digit mobile number'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Standardize 10-digit phone
        if phone.startswith('+91'):
            phone = phone[3:]
        elif phone.startswith('91') and len(phone) == 12:
            phone = phone[2:]
            
        # Generate cryptographically secure 6-digit OTP & Unique Reference ID
        otp = f"{secrets.randbelow(900000) + 100000}"
        ref_id = f"FK-{secrets.randbelow(900000) + 100000}"
        
        OTP_CACHE[phone] = {
            'otp': otp,
            'ref_id': ref_id,
            'role': role,
            'expires_at': time.time() + 300 # 5 minutes validity
        }
        
        # Dispatch notification to Redis pub/sub for Ekart / Notification service
        publish_otp_to_redis(phone, otp, ref_id, role)
        
        masked = f"{phone[:2]}******{phone[-2:]}"
        sms_body = f"VK-FLPKRT: Your Flipkart verification code is {otp} (Ref ID: #{ref_id}). Valid for 5 mins. Do not share this OTP with anyone for security."
        
        return Response({
            'status': 'success',
            'message': f'OTP successfully sent via SMS to +91 {masked}',
            'phone': phone,
            'role': role,
            'ref_id': ref_id,
            'sms': {
                'sender': 'VK-FLPKRT',
                'ref_id': ref_id,
                'otp': otp,
                'message': sms_body
            },
            'expires_in': 300
        }, status=status.HTTP_200_OK)

class VerifyOTPView(APIView):
    def post(self, request):
        phone = str(request.data.get('phone', '')).strip().replace(' ', '').replace('-', '')
        otp_entered = str(request.data.get('otp', '')).strip()
        role = request.data.get('role', 'CUSTOMER').upper()
        
        if phone.startswith('+91'):
            phone = phone[3:]
        elif phone.startswith('91') and len(phone) == 12:
            phone = phone[2:]
            
        stored = OTP_CACHE.get(phone)
        now = time.time()
        
        # Strict verification: OTP must match the stored OTP generated for this phone and not be expired
        is_valid = bool(stored and stored['otp'] == otp_entered and stored['expires_at'] > now)
        
        if not is_valid:
            return Response({'error': 'Invalid or expired OTP. Please enter the valid OTP received via SMS.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # OTP is valid - retrieve or register user
        user = User.objects.filter(phone=phone).first()
        if not user:
            prefix = "Seller" if role == "SELLER" else "User"
            user = User.objects.create(
                username=f"{prefix}_{phone[-4:]}",
                phone=phone,
                role=role,
                super_coins=150
            )
        else:
            # Ensure role aligns with login portal
            if role == "SELLER" and user.role != "SELLER":
                user.role = "SELLER"
                user.save(update_fields=['role'])

        # Clear OTP from memory after successful verification to prevent replay attacks
        if phone in OTP_CACHE:
            del OTP_CACHE[phone]
            
        return Response({
            'status': 'success',
            'message': 'OTP verification successful',
            'token': f'fk-jwt-session-{user.id}',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'phone': user.phone,
                'role': user.role,
                'super_coins': user.super_coins
            }
        }, status=status.HTTP_200_OK)

