from rest_framework import viewsets
from .models import Product, Category
from .serializer import ProductSerializer, CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category')
    serializer_class = ProductSerializer     


class CategoryViewSet(viewsets.ModelViewSet): 
    queryset = Category.objects.all()
    serializer_class = CategorySerializer