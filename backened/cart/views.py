from django.shortcuts import render
from rest_framework import viewsets
from .models import Cart, CartItem
from .serializer import CartSerializer, CartItemSerializer
# Create your views here.

class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.prefetch_related("items")
    serializer_class = CartSerializer

class CartItemViewSet(viewsets.ModelViewSet):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer
    