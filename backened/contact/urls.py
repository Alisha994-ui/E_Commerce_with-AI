# cart/urls.py
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(
    "messages",views.MessageViewSet,basename="contact-message",)
urlpatterns = router.urls