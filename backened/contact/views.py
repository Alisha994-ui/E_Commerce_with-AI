from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings

from .models import ContactMessage
from .serializers import ContactMessageSerializer


class MessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all().order_by("-created_at")
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "patch"]

    def perform_create(self, serializer):
        contact_message = serializer.save()

        send_mail(
            subject="We received your message",
            message=(
                f"Hello {contact_message.name},\n\n"
                "Thank you for contacting us.\n\n"
                "We have received your message successfully. "
                "Our team will review your enquiry and get back to you soon.\n\n"
                "Best regards,\n"
                "ShopEase"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[contact_message.email],
            fail_silently=True,
        )
