# order/urls.py
from rest_framework import routers
from .views import OrderViewSet, OrderItemViewSet

router = routers.DefaultRouter()
router.register('order', OrderViewSet, basename='order')
router.register('orderitem', OrderItemViewSet, basename='orderitem')

urlpatterns = router.urls