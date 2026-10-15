from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from products.models import Category, Product

from .services.engine import clear_category_cache


@receiver([post_save, post_delete], sender=Product)
@receiver([post_save, post_delete], sender=Category)
def refresh_chatbot_categories(sender, **kwargs):
    """Keep the chatbot's category list in sync with the store."""
    clear_category_cache()
