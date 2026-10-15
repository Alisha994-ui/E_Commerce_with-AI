"""
Fill the store with demo data.

    python manage.py seed_store              # categories, sub categories, products, images, demo orders
    python manage.py seed_store --no-images  # skip generating product images
    python manage.py seed_store --no-orders  # skip demo customers and orders

Safe to run more than once: existing records are updated, not duplicated.
"""

import random
import textwrap
from decimal import Decimal
from io import BytesIO

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction

from order.models import Order, OrderItem
from products.models import Category, Product, SubCategory

from .catalogue import CATALOGUE, CATEGORY_COLOURS, DEMO_ADDRESSES, DEMO_CUSTOMERS

DEMO_PASSWORD = "Demo@12345"
DELIVERY_FEE = Decimal("200")


class Command(BaseCommand):
    help = "Fill the store with demo categories, sub categories, products and orders."

    def add_arguments(self, parser):
        parser.add_argument("--no-images", action="store_true", help="Do not generate product images.")
        parser.add_argument("--no-orders", action="store_true", help="Do not create demo customers and orders.")

    def handle(self, *args, **options):
        self.random = random.Random(42)
        self.make_images = not options["no_images"]

        if self.make_images:
            try:
                from PIL import Image  # noqa: F401
            except ImportError:
                self.stdout.write(self.style.WARNING("Pillow is not installed; skipping images."))
                self.make_images = False

        with transaction.atomic():
            counts = self.seed_catalogue()

            if not options["no_orders"]:
                counts["orders"] = self.seed_orders()

        self.stdout.write(self.style.SUCCESS(
            "Done: {categories} categories, {subcategories} sub categories, "
            "{products} products, {orders} demo orders.".format(**{"orders": 0, **counts})
        ))

        if not options["no_orders"]:
            self.stdout.write(
                f"Demo customers: {', '.join(c[0] for c in DEMO_CUSTOMERS)} "
                f"(password: {DEMO_PASSWORD})"
            )

    # ------------------------------------------------------------------
    # Catalogue
    # ------------------------------------------------------------------

    def seed_catalogue(self):
        counts = {"categories": 0, "subcategories": 0, "products": 0}

        for category_name, category_data in CATALOGUE.items():
            category = Category.objects.filter(name__iexact=category_name).first()
            if not category:
                category = Category.objects.create(name=category_name)
            if not category.description:
                category.description = category_data["description"]
            if self.make_images and not category.image:
                self.attach_image(category, "categories", category_name, category_name, "Shop the collection")
            category.save()
            counts["categories"] += 1

            for sub_name, products in category_data["subcategories"].items():
                subcategory, _ = SubCategory.objects.get_or_create(category=category, name=sub_name)
                counts["subcategories"] += 1

                for name, price, stock, description in products:
                    product = Product.objects.filter(name=name).first() or Product(name=name)
                    product.category = category
                    product.subcategory = subcategory
                    product.price = Decimal(price)
                    product.stock = stock
                    product.description = description
                    product.is_active = True

                    if product.pk is None:
                        product.positive_feedback = self.random.randint(0, 60)
                        product.negative_feedback = self.random.randint(0, 6)

                    if self.make_images and not product.image:
                        self.attach_image(product, "products", category_name, name, sub_name)

                    product.save()
                    counts["products"] += 1

        return counts

    # ------------------------------------------------------------------
    # Orders
    # ------------------------------------------------------------------

    def seed_orders(self):
        products = list(Product.objects.filter(is_active=True))
        if not products:
            return 0

        statuses = ["pending", "processing", "shipped", "delivered", "delivered", "cancelled"]
        created = 0

        for index, (username, first, last, email) in enumerate(DEMO_CUSTOMERS):
            user, was_created = User.objects.get_or_create(
                username=username,
                defaults={"first_name": first, "last_name": last, "email": email},
            )
            if was_created:
                user.set_password(DEMO_PASSWORD)
                user.save()

            if Order.objects.filter(user=user).exists():
                continue

            for _ in range(self.random.randint(2, 4)):
                picks = self.random.sample(products, k=self.random.randint(1, 3))
                order = Order.objects.create(
                    user=user,
                    total_amount=Decimal("0"),
                    status=self.random.choice(statuses),
                    shipping_address=DEMO_ADDRESSES[index % len(DEMO_ADDRESSES)],
                )
                total = Decimal("0")
                for product in picks:
                    quantity = self.random.randint(1, 2)
                    OrderItem.objects.create(order=order, product=product, quantity=quantity, price=product.price)
                    total += product.price * quantity

                order.total_amount = total + DELIVERY_FEE
                order.save(update_fields=["total_amount"])
                created += 1

        return created

    # ------------------------------------------------------------------
    # Placeholder images
    # ------------------------------------------------------------------

    def attach_image(self, instance, folder, category_name, title, subtitle):
        content = self.render_image(category_name, title, subtitle)
        slug = "".join(ch if ch.isalnum() else "-" for ch in title.lower()).strip("-")
        instance.image.save(f"seed-{slug}.png", ContentFile(content), save=False)

    def render_image(self, category_name, title, subtitle):
        from PIL import Image, ImageDraw

        background, accent = CATEGORY_COLOURS.get(category_name, ("#f3f5f2", "#10282a"))
        size = 800
        image = Image.new("RGB", (size, size), background)
        draw = ImageDraw.Draw(image)

        # Soft decorative circle
        draw.ellipse((size * 0.38, -size * 0.18, size * 1.25, size * 0.7), fill=self.mix(background, "#ffffff", 0.45))

        title_font = self.font(64, bold=True)
        small_font = self.font(30)

        draw.text((56, 56), subtitle, font=small_font, fill=accent)

        lines = textwrap.wrap(title, width=16)[:4]
        line_height = 76
        y = size - 120 - line_height * len(lines)
        for line in lines:
            draw.text((56, y), line, font=title_font, fill="#10282a")
            y += line_height

        draw.rectangle((56, size - 96, 136, size - 88), fill=accent)
        draw.text((56, size - 76), "ShopEase", font=small_font, fill=accent)

        buffer = BytesIO()
        image.save(buffer, format="PNG", optimize=True)
        return buffer.getvalue()

    @staticmethod
    def mix(colour_a, colour_b, amount):
        a = [int(colour_a[i:i + 2], 16) for i in (1, 3, 5)]
        b = [int(colour_b[i:i + 2], 16) for i in (1, 3, 5)]
        return tuple(int(x + (y - x) * amount) for x, y in zip(a, b))

    @staticmethod
    def font(size, bold=False):
        from PIL import ImageFont

        candidates = (
            ["DejaVuSans-Bold.ttf", "arialbd.ttf", "Arial Bold.ttf", "segoeuib.ttf"]
            if bold
            else ["DejaVuSans.ttf", "arial.ttf", "Arial.ttf", "segoeui.ttf"]
        )
        for name in candidates:
            try:
                return ImageFont.truetype(name, size)
            except OSError:
                continue
        try:
            return ImageFont.load_default(size=size)
        except TypeError:  # Pillow < 10.1
            return ImageFont.load_default()
