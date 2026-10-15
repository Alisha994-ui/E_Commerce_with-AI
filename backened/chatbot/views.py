import logging
import uuid

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import OptionalJWTAuthentication
from .models import ChatMessage, ChatSession
from .services.engine import ChatbotEngine
from .throttling import ChatbotRateThrottle

logger = logging.getLogger(__name__)

HISTORY_LIMIT = 10


class ChatbotView(APIView):
    """
    POST /chatbot/
        {"message": "show me shoes under 5000", "session_id": "<uuid or null>"}

    Works for guests and logged-in users. Send the JWT access token
    (Authorization: Bearer ...) to let the bot answer order questions.

    Response:
        {
            "reply": "...",
            "intent": "product_search | order_status | store_info | general_chat",
            "products": [...],
            "orders": [...],
            "actions": [{"label": "...", "href": "/..."}],
            "quick_replies": ["..."],
            "session_id": "<uuid>"
        }
    """

    permission_classes = [AllowAny]
    authentication_classes = [OptionalJWTAuthentication]
    throttle_classes = [ChatbotRateThrottle]

    def post(self, request):
        message = str(request.data.get("message") or "").strip()
        max_length = int(getattr(settings, "CHATBOT_MAX_MESSAGE_LENGTH", 500))

        if not message:
            return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

        if len(message) > max_length:
            return Response(
                {"error": f"Message is too long. Please keep it under {max_length} characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user if request.user.is_authenticated else None
        session = self.get_session(request.data.get("session_id"), user)

        recent = list(session.messages.order_by("-created_at", "-id")[:HISTORY_LIMIT])[::-1]
        history = [{"role": m.role, "content": m.content} for m in recent]
        last_context = next(
            (m.context for m in reversed(recent) if m.role == ChatMessage.ROLE_ASSISTANT and m.context),
            {},
        )

        try:
            result = ChatbotEngine(
                request=request,
                user=user,
                history=history,
                last_context=last_context,
            ).respond(message)

        except Exception:  # never show a stack trace to a customer
            logger.exception("Chatbot failed for message: %s", message)
            return Response(
                {
                    "error": "The assistant is having trouble right now. Please try again in a moment.",
                    "session_id": str(session.id),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        context = result.pop("context", {}) or {}

        ChatMessage.objects.create(session=session, role=ChatMessage.ROLE_USER, content=message)
        ChatMessage.objects.create(
            session=session,
            role=ChatMessage.ROLE_ASSISTANT,
            content=result["reply"],
            intent=result.get("intent", ""),
            context=context,
        )
        session.save(update_fields=["updated_at"])

        result.pop("used_llm", None)
        result["session_id"] = str(session.id)
        return Response(result, status=status.HTTP_200_OK)

    @staticmethod
    def get_session(session_id, user):
        session = None

        try:
            session = ChatSession.objects.filter(id=uuid.UUID(str(session_id))).first()
        except (TypeError, ValueError):
            session = None

        if session:
            # A guest session becomes the user's after they log in.
            if session.user_id is None and user:
                session.user = user
                session.save(update_fields=["user"])
                return session

            # Never let one account continue another account's chat.
            if session.user_id is None or (user and session.user_id == user.id):
                return session

        return ChatSession.objects.create(user=user)
