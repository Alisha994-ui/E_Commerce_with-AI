# products/urls.py
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, SubCategoryViewSet

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')
router.register('categories', CategoryViewSet, basename='category')
router.register('subcategories', SubCategoryViewSet, basename='subcategory')

urlpatterns = router.urls