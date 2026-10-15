from rest_framework import serializers
from .models import Product, Category, SubCategory


class SubCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True
    )
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = SubCategory
        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "description",
            "product_count",
        ]

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True
    )
    subcategory_name = serializers.CharField(
        source="subcategory.name",
        read_only=True,
        default=None
    )

    def validate(self, attrs):
        category = attrs.get("category") or getattr(self.instance, "category", None)
        subcategory = attrs.get("subcategory")
        if subcategory and category and subcategory.category_id != category.id:
            raise serializers.ValidationError(
                {"subcategory": "This sub category does not belong to the selected category."}
            )
        return attrs

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "stock",
            "image",
            "is_active",
            "created_at",
            "updated_at",
            "category",
            "category_name",
            "subcategory",
            "subcategory_name",
            "positive_feedback",
            "negative_feedback",
        ]


class CategorySerializer(serializers.ModelSerializer):
    category_products = ProductSerializer(
        source="products",
        many=True,
        read_only=True
    )
    subcategories = SubCategorySerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "image",
            "subcategories",
            "category_products",
        ]

class RecommendationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True
    )
    subcategory_name = serializers.CharField(
        source="subcategory.name",
        read_only=True,
        default=None
    )
    similarity = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "image",
            "category",
            "category_name",
            "subcategory_name",
            "similarity",
        ]
    
    def get_similarity(self, obj):
        return getattr(obj, 'similarity', 0.85)