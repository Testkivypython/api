from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.shortcuts import render
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, SignUpSerializer
from .models import User

import random
import string

# Create your views here.

def get_auth_for_user(user):
    tokens = RefreshToken.for_user(user)
    return {
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(tokens.access_token),
                'refresh': str(tokens),
            }
    }

class SignInView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response(status=400)
        
        user = authenticate(username=username, password=password)
        if not user:
            return Response(status=401)

        user_data = get_auth_for_user(user)
        
        return Response(user_data)

class SignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        new_user = SignUpSerializer(data=request.data)
        new_user.is_valid(raise_exception=True)
        user = new_user.save()

        user_data = get_auth_for_user(user)

        return Response(user_data)


class RequestVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=400)

        email = email.lower()

        code = ''.join(random.choices(string.digits, k=6))
        expiry = timezone.now() + timezone.timedelta(minutes=10)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'verification_code': code,
                'code_expiry': expiry
            }
        )

        if not created:
            user.verification_code = code
            user.code_expiry = expiry
            user.save()

        try:
            send_mail(
                'Your verification code',
                f'Your verification code is: {code}\nThis code will expire in 10 minutes.',
                'noreply@messanger.com',
                [email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({'error': f'Failed to send email: {str(e)}'}, status=500)

        return Response({'message': 'Verification code sent'})