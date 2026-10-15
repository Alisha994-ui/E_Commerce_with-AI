from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    class Meta:
        model = OrderItem
        fields = "__all__"


class OrderSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(
        source="user.username",
        read_only=True
    )

    items = OrderItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Order
        fields = (
            "id",
            "user_name",
            "total_amount",
            "status",
            "shipping_address",
            "created_at",
            "updated_at",
            "items",
        )