from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings

from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from cart.models import Cart
from .models import Order, OrderItem
from .serializer import OrderSerializer, OrderItemSerializer
from .permissions import (
    IsOrderOwnerOrAdmin,
    IsOrderItemOwnerOrAdmin,
)


class OrderViewSet(viewsets.ModelViewSet):

    serializer_class = OrderSerializer
    permission_classes = [IsOrderOwnerOrAdmin]

    def get_queryset(self):

        if self.request.user.is_staff:
            return Order.objects.all().prefetch_related(
                "items__product"
            )

        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related(
            "items__product"
        )

    @transaction.atomic
    def perform_create(self, serializer):

        cart = Cart.objects.filter(
            user=self.request.user
        ).first()

        if not cart:
            raise ValidationError("Your cart is empty.")

        cart_items = cart.items.select_related(
            "product"
        ).all()

        if not cart_items.exists():
            raise ValidationError(
                "Your cart is empty."
            )

        order = serializer.save(
            user=self.request.user
        )

        total_amount = 0
        order_items_text = []

        for cart_item in cart_items:

            item_total = (
                cart_item.product.price *
                cart_item.quantity
            )

            total_amount += item_total

            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price=cart_item.product.price,
            )

            order_items_text.append(
                f"{cart_item.product.name} "
                f"x {cart_item.quantity} "
                f"= {item_total}"
            )

        cart_items.delete()

        send_mail(
            subject=f"Order Confirmation #{order.id}",
            message=(
                f"Hello {self.request.user.username},\n\n"
                f"Thank you for your order.\n\n"
                f"Your order #{order.id} has been confirmed.\n\n"
                f"Order Details:\n"
                f"{chr(10).join(order_items_text)}\n\n"
                f"Total Amount: {total_amount}\n\n"
                f"We will process your order and keep you updated "
                f"about its status.\n\n"
                f"Best regards,\n"
                f"Sakafat Global"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.request.user.email],
            fail_silently=False,
        )


class OrderItemViewSet(viewsets.ModelViewSet):

    serializer_class = OrderItemSerializer
    permission_classes = [IsOrderItemOwnerOrAdmin]

    def get_queryset(self):

        if self.request.user.is_staff:
            return OrderItem.objects.all()

        return OrderItem.objects.filter(
            order__user=self.request.user
        )
