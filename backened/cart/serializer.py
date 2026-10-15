from rest_framework import serializers
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
   
    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    price = serializers.DecimalField(
        source="product.price",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    category_name = serializers.CharField(
        source="product.category.name",
        read_only=True
    )

    cart = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    class Meta:
        model = CartItem
        fields = [
            "id",
            "cart",
            "product",
            "product_name",
            "price",
            "category_name",
            "quantity",
        ]


class CartSerializer(serializers.ModelSerializer):

    cart_username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    items = CartItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Cart
        fields = [
            "id",
            "user",
            "cart_username",
            "created_at",
            "updated_at",
            "items",
        ]