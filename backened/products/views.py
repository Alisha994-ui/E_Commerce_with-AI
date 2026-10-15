from rest_framework import viewsets
from .models import Product, Category, SubCategory
from .serializer import ProductSerializer, CategorySerializer, RecommendationSerializer, SubCategorySerializer
from .permissions import IsAdminOrReadOnly
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .recommendation.engine import get_recommendations


class ProductPagination(PageNumberPagination):
    """10 per page by default; the storefront can ask for more with ?page_size=."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 48

class ProductViewSet(viewsets.ModelViewSet):

    queryset = Product.objects.select_related("category", "subcategory").all()

    serializer_class = ProductSerializer

    pagination_class = ProductPagination

    permission_classes = [IsAdminOrReadOnly]

    filter_backends = [ filters.SearchFilter]

    search_fields = [
        "name",
        "description",
        "category__name",
        "subcategory__name",
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        category_id = self.request.query_params.get(
            "category",
            None
        )

        if category_id is not None:
            queryset = queryset.filter(
                category_id=category_id
            )

        subcategory_id = self.request.query_params.get("subcategory")

        if subcategory_id:
            queryset = queryset.filter(subcategory_id=subcategory_id)

        # Optional sorting: ?ordering=price | -price | newest | popular
        ordering = self.request.query_params.get("ordering")
        ordering_map = {
            "price": "price",
            "-price": "-price",
            "newest": "-created_at",
            "popular": "-positive_feedback",
        }

        if ordering in ordering_map:
            queryset = queryset.order_by(ordering_map[ordering], "id")
        else:
            queryset = queryset.order_by("id")

        return queryset
    
    @action(detail=True,methods=["get"],url_path="recommendations")
    def recommendations(self, request, pk=None):
      recommendations = get_recommendations(product_id=pk,limit=5)
      serializer = RecommendationSerializer(recommendations,many=True)
      return Response(serializer.data)

class CategoryViewSet(viewsets.ModelViewSet): 
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]



class SubCategoryViewSet(viewsets.ModelViewSet):
    """
    /api/subcategories/            all sub categories
    /api/subcategories/?category=1 sub categories of one category
    """

    serializer_class = SubCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        queryset = SubCategory.objects.select_related("category").all()
        category_id = self.request.query_params.get("category")

        if category_id:
            queryset = queryset.filter(category_id=category_id)

        return queryset
