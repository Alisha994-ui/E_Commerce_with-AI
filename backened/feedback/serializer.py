from rest_framework import serializers
from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    user_name = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = Feedback
        fields = [
            "id",
            "product",
            "product_name",
            "user",
            "user_name",
            "comment",
            "sentiment",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "sentiment",
            "created_at",
        ]