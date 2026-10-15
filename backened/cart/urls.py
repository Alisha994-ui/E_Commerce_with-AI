# cart/urls.py
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register('cart', views.CartViewSet, basename='cart')
router.register('cartitem', views.CartItemViewSet, basename='cartitem')

urlpatterns = router.urls