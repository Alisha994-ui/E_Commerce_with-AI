from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.http import urlsafe_base64_decode
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import (
    IsAdminUser,
    IsAuthenticated,
    AllowAny,
)
from rest_framework.generics import ListAPIView
from rest_framework import status

from .serializers import RegisterSerializer


User = get_user_model()


# =========================================================
# ADMIN - LIST USERS
# =========================================================

class AdminUserListView(ListAPIView):

    permission_classes = [IsAdminUser]

    def list(self, request, *args, **kwargs):

        users = User.objects.all().order_by("-id")

        data = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "is_active": user.is_active,
                "date_joined": user.date_joined,
            }
            for user in users
        ]

        return Response(data)


# =========================================================
# REGISTER
# =========================================================

class RegisterView(generics.CreateAPIView):

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


# =========================================================
# CURRENT USER
# =========================================================

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def current_user(request):

    user = request.user

    # GET USER
    if request.method == "GET":

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "is_active": user.is_active,
        })

    # UPDATE USER
    if request.method == "PATCH":
        
        username = request.data.get("username")
        email = request.data.get("email")

        if username is not None:
            user.username = username.strip()

        if email is not None:
            user.email = email.strip()

        user.save()

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "is_active": user.is_active,
        })


# =========================================================
# ADMIN - UPDATE USER
# =========================================================

@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def update_user(request, user_id):

    try:
        user = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # Admin profile update
    if user.is_staff:

        first_name = request.data.get("firstName")
        last_name = request.data.get("lastName")
        email = request.data.get("email")

        if first_name is not None:
            user.first_name = first_name.strip()

        if last_name is not None:
            user.last_name = last_name.strip()

        if email is not None:
            user.email = email.strip()

        user.save()

        return Response({
            "message": "Admin updated",
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
        })

    # Normal user update
    username = request.data.get("username")
    email = request.data.get("email")
    is_staff = request.data.get("is_staff")
    is_superuser = request.data.get("is_superuser")
    is_active = request.data.get("is_active")

    if username is not None:
        user.username = username.strip()

    if email is not None:
        user.email = email.strip()

    if is_staff is not None:
        user.is_staff = bool(is_staff)

    if is_superuser is not None:
        user.is_superuser = bool(is_superuser)

    if is_active is not None:
        user.is_active = bool(is_active)

    user.save()

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_active": user.is_active,
        "date_joined": user.date_joined,
    })


# =========================================================
# FORGOT PASSWORD
# =========================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):

    email = request.data.get("email")

    # Email required
    if not email:

        return Response(
            {
                "error": "Email is required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    email = email.strip()

    # Find user
    try:
        user = User.objects.get(email=email)

    except User.DoesNotExist:

        return Response(
            {
                "error": "No account found with this email."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # Generate UID
    uid = urlsafe_base64_encode(
        force_bytes(user.pk)
    )

    # Generate secure token
    token = default_token_generator.make_token(user)

    # Frontend reset page URL
    reset_link = (
        f"http://localhost:3000/reset-password/"
        f"{uid}/{token}/"
    )

    # Email
    subject = "Password Reset Request"

    message = f"""
Hello {user.username},

You requested to reset your password.

Click the link below to create a new password:

{reset_link}

If you did not request a password reset, you can ignore this email.

Regards,
E-Commerce Team
"""

    send_mail(
        subject,
        message,
        None,
        [user.email],
        fail_silently=False,
    )

    return Response(
        {
            "message": "Password reset link has been sent to your email."
        },
        status=status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    user = request.user
    uid = request.data.get("uid")
    new_password = request.data.get("new_password")
    token = request.data.get("token")
    # Validate input
    if not uid or not new_password:
        return Response(
            {"error": "UID and new password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Decode UID and get user
        user_id = urlsafe_base64_decode(uid).decode()
        user = User.objects.get(pk=user_id)

    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {"error": "Invalid UID."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check token validity
    if not default_token_generator.check_token(user, token):
        return Response(
            {"error": "Invalid or expired token."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set new password
    user.set_password(new_password)
    user.save()

    return Response(
        {"message": "Password has been reset successfully."},
        status=status.HTTP_200_OK
    )

@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def admin_password(request, user_id):

    try:
        user = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    password = request.data.get("password")

    if not password:
        return Response(
            {"error": "Password is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 8:
        return Response(
            {"error": "Password must be at least 8 characters."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(password)
    user.save()
    print (password)

    return Response(
        {
            "message": "Password updated successfully."
        },
        status=status.HTTP_200_OK
    )