from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Cart, CartItem
from .serializer import CartItemSerializer,CartSerializer
from .permissions import IsCartItemOwner


class CartItemViewSet(viewsets.ModelViewSet):

    serializer_class = CartItemSerializer
    permission_classes = [IsCartItemOwner]

    def get_queryset(self):

        if self.request.user.is_staff:
            return CartItem.objects.all()

        return CartItem.objects.filter(
            cart__user=self.request.user
        )

    
    @transaction.atomic
    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data["product"]
        quantity = serializer.validated_data["quantity"]


        # ---------------------------------------------
        # Check stock
        # ---------------------------------------------

        if product.stock < quantity:

            return Response(
                {
                    "error": (
                        f"Only {product.stock} "
                        f"items available in stock."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        # ---------------------------------------------
        # Get user's cart
        # ---------------------------------------------

        cart, created = Cart.objects.get_or_create(
            user=request.user
        )


        # ---------------------------------------------
        # Check existing cart item
        # ---------------------------------------------

        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={
                "quantity": quantity
            }
        )


        # ---------------------------------------------
        # Product already exists in cart
        # ---------------------------------------------

        if not item_created:

            new_quantity = (
                cart_item.quantity + quantity
            )


            # Check whether enough stock exists
            if product.stock < quantity:

                return Response(
                    {
                        "error": (
                            f"Only {product.stock} "
                            f"additional items available."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            cart_item.quantity = new_quantity

            cart_item.save()


        # ---------------------------------------------
        # Decrease product stock
        # ---------------------------------------------

        product.stock -= quantity

        product.save(
            update_fields=["stock"]
        )


        response_serializer = self.get_serializer(
            cart_item
        )


        return Response(
            response_serializer.data,
            status=(
                status.HTTP_201_CREATED
                if item_created
                else status.HTTP_200_OK
            )
        )


    # =====================================================
    # UPDATE QUANTITY
    # =====================================================

    @transaction.atomic
    def partial_update(
        self,
        request,
        *args,
        **kwargs
    ):

        cart_item = self.get_object()

        old_quantity = cart_item.quantity

        new_quantity = request.data.get(
            "quantity"
        )


        # ---------------------------------------------
        # Validate quantity
        # ---------------------------------------------

        try:

            new_quantity = int(new_quantity)

        except (TypeError, ValueError):

            return Response(
                {
                    "error": "Quantity must be a number."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        if new_quantity < 1:

            return Response(
                {
                    "error": (
                        "Quantity must be at least 1."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        # ---------------------------------------------
        # Calculate difference
        # ---------------------------------------------

        difference = (
            new_quantity - old_quantity
        )


        product = cart_item.product


        # =================================================
        # INCREASE QUANTITY
        # =================================================

        if difference > 0:

            # Check stock
            if product.stock < difference:

                return Response(
                    {
                        "error": (
                            f"Only {product.stock} "
                            f"items available in stock."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            # Decrease product stock
            product.stock -= difference

            product.save(
                update_fields=["stock"]
            )


        # =================================================
        # DECREASE QUANTITY
        # =================================================

        elif difference < 0:

            # Quantity reduced
            returned_quantity = abs(
                difference
            )


            # Give stock back
            product.stock += returned_quantity

            product.save(
                update_fields=["stock"]
            )


        # ---------------------------------------------
        # Update cart quantity
        # ---------------------------------------------

        cart_item.quantity = new_quantity

        cart_item.save()


        response_serializer = self.get_serializer(
            cart_item
        )


        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK
        )


    # =====================================================
    # REMOVE ITEM
    # =====================================================

    @transaction.atomic
    def destroy(
        self,
        request,
        *args,
        **kwargs
    ):

        cart_item = self.get_object()

        product = cart_item.product

        quantity = cart_item.quantity


        # ---------------------------------------------
        # Return quantity to stock
        # ---------------------------------------------

        product.stock += quantity

        product.save(
            update_fields=["stock"]
        )


        # ---------------------------------------------
        # Delete cart item
        # ---------------------------------------------

        cart_item.delete()


        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

class CartViewSet(viewsets.ModelViewSet):
    
    serializer_class = CartSerializer

    def get_queryset(self):

        if self.request.user.is_staff:
            return Cart.objects.all()

        return Cart.objects.filter(
            user=self.request.user
        )