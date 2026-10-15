from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from products.models import Product, Category
from order.models import Order


User = get_user_model()


class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        data = {
            "products": Product.objects.count(),
            "categories": Category.objects.count(),
            "orders": Order.objects.count(),
            "users": User.objects.count(),
        }

        return Response(data)