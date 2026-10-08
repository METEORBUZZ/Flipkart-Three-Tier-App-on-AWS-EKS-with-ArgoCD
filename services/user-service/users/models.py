import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class UserRole(models.TextChoices):
    CUSTOMER = 'CUSTOMER', 'Customer'
    SELLER = 'SELLER', 'Seller'
    ADMIN = 'ADMIN', 'Admin'

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER)
    super_coins = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class Address(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=15)
    pincode = models.CharField(max_length=10)
    locality = models.CharField(max_length=255)
    address_line = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    landmark = models.CharField(max_length=255, blank=True, null=True)
    alternate_phone = models.CharField(max_length=15, blank=True, null=True)
    address_type = models.CharField(max_length=20, default='HOME') # HOME or WORK
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} - {self.pincode}"

class OTPRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=20, db_index=True)
    otp_code = models.CharField(max_length=10)
    ref_id = models.CharField(max_length=32, blank=True, null=True, db_index=True)
    role = models.CharField(max_length=20, default='CUSTOMER')
    ip_address = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    failed_attempts = models.IntegerField(default=0)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table = 'otp_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.phone_number} - {self.otp_code} (Expires: {self.expires_at})"
