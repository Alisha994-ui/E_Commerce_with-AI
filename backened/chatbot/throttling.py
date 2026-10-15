from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle


class ChatbotRateThrottle(SimpleRateThrottle):
    """Per-user (or per-IP for guests) rate limit for the chatbot."""

    scope = "chatbot"

    def get_rate(self):
        return getattr(settings, "CHATBOT_RATE_LIMIT", "20/min")

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = f"user-{request.user.pk}"
        else:
            ident = f"ip-{self.get_ident(request)}"
        return self.cache_format % {"scope": self.scope, "ident": ident}
