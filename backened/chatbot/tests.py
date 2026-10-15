from decimal import Decimal
from unittest.mock import patch

import requests

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from order.models import Order, OrderItem
from products.models import Category, Product

from .models import ChatMessage, ChatSession
from .services import llm


@override_settings(CHATBOT_LLM_PROVIDER="none", CHATBOT_RATE_LIMIT="1000/min")
class ChatbotTests(TestCase):
    url = "/chatbot/"

    @classmethod
    def setUpTestData(cls):
        shoes = Category.objects.create(name="Shoes", description="Footwear")
        clothing = Category.objects.create(name="Clothing", description="Clothes")
        bags = Category.objects.create(name="Bags", description="Bags")
        electronics = Category.objects.create(name="Electronics", description="Gadgets")

        def product(category, name, price, stock=10, feedback=0, description=""):
            return Product.objects.create(
                category=category,
                name=name,
                price=Decimal(price),
                stock=stock,
                positive_feedback=feedback,
                description=description or name,
            )

        cls.nike = product(shoes, "Nike Air Max", "14500", feedback=9)
        cls.adidas = product(shoes, "Adidas Grand Court", "9800", feedback=5)
        product(shoes, "Puma Runner", "22000", feedback=1)
        product(shoes, "Old Sandal", "1500", stock=0)
        cls.tshirt = product(clothing, "Cotton T-Shirt", "2500", feedback=4)
        product(clothing, "Denim Jeans", "4500", feedback=2)
        product(clothing, "Adidas Hoodie", "6500", feedback=3)
        cls.backpack = product(bags, "Black Backpack", "5500")
        product(electronics, "Wireless Headphones", "12000")

        cls.user = User.objects.create_user("ali", password="pass12345", first_name="Ali")
        cls.other = User.objects.create_user("sara", password="pass12345")

        order = Order.objects.create(
            user=cls.user, total_amount=Decimal("14700"), status="shipped", shipping_address="Lahore"
        )
        OrderItem.objects.create(order=order, product=cls.nike, quantity=1, price=Decimal("14500"))
        cls.order = order

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def ask(self, message, session_id=None, user=None):
        if user:
            token = RefreshToken.for_user(user).access_token
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.post(self.url, {"message": message, "session_id": session_id}, format="json")
        return response, response.json()

    # ---------------------------------------------------------------

    def test_requires_message(self):
        response, _ = self.ask("   ")
        self.assertEqual(response.status_code, 400)

    def test_rejects_very_long_message(self):
        response, _ = self.ask("a" * 600)
        self.assertEqual(response.status_code, 400)

    def test_greeting(self):
        response, data = self.ask("hello")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["intent"], "general_chat")
        self.assertIn("ShopEase", data["reply"])
        self.assertTrue(data["session_id"])

    def test_category_and_price(self):
        _, data = self.ask("show me shoes under 15000")
        self.assertEqual(data["intent"], "product_search")
        names = [p["name"] for p in data["products"]]
        self.assertEqual(names, ["Nike Air Max", "Adidas Grand Court"])
        self.assertNotIn("Old Sandal", names)  # out of stock
        self.assertEqual(data["products"][0]["url"], f"/products/{self.nike.id}")

    def test_brand_search(self):
        _, data = self.ask("I want nike shoes")
        self.assertEqual([p["name"] for p in data["products"]], ["Nike Air Max"])

    def test_synonyms_without_llm(self):
        _, data = self.ask("show me some clothes")
        self.assertTrue(data["products"])
        self.assertTrue(all(p["category"] == "Clothing" for p in data["products"]))

        _, data = self.ask("I need something to carry my stuff")
        self.assertEqual([p["name"] for p in data["products"]], ["Black Backpack"])

    def test_roman_urdu_price(self):
        _, data = self.ask("joote dikhao 10000 se kam")
        self.assertEqual([p["name"] for p in data["products"]], ["Adidas Grand Court"])

    def test_price_range_and_k_suffix(self):
        _, data = self.ask("clothing between 3k and 7k")
        self.assertEqual(sorted(p["name"] for p in data["products"]), ["Adidas Hoodie", "Denim Jeans"])

    def test_follow_up_uses_previous_category(self):
        _, first = self.ask("show me shoes")
        _, data = self.ask("under 10000", session_id=first["session_id"])
        self.assertEqual([p["name"] for p in data["products"]], ["Adidas Grand Court"])

        _, data = self.ask("what about adidas?", session_id=first["session_id"])
        self.assertEqual([p["name"] for p in data["products"]], ["Adidas Grand Court"])

    def test_cheapest_sorting(self):
        _, data = self.ask("cheapest shoes")
        self.assertEqual(data["products"][0]["name"], "Adidas Grand Court")

    def test_no_match_in_price_range(self):
        _, data = self.ask("shoes under 500")
        self.assertEqual(data["products"], [])
        self.assertIn("start from Rs. 9,800", data["reply"])

    def test_store_info(self):
        _, data = self.ask("what is the delivery fee?")
        self.assertEqual(data["intent"], "store_info")
        self.assertIn("Rs. 200", data["reply"])

        _, data = self.ask("how can I return my order")
        self.assertEqual(data["intent"], "store_info")

    def test_order_status_guest(self):
        _, data = self.ask("where is my order?")
        self.assertEqual(data["intent"], "order_status")
        self.assertEqual(data["actions"][0]["href"], "/login")

    def test_order_status_logged_in(self):
        _, data = self.ask("track my order", user=self.user)
        self.assertIn(f"#{self.order.id}", data["reply"])
        self.assertIn("Shipped", data["reply"])
        self.assertEqual(data["orders"][0]["id"], self.order.id)

    def test_cannot_see_other_users_order(self):
        _, data = self.ask(f"status of order #{self.order.id}", user=self.other)
        self.assertIn("couldn't find", data["reply"])
        self.assertEqual(data["orders"], [])

    def test_invalid_token_is_treated_as_guest(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not-a-real-token")
        response = self.client.post(self.url, {"message": "hi"}, format="json")
        self.assertEqual(response.status_code, 200)

    def test_messages_are_saved(self):
        _, data = self.ask("show me bags")
        session = ChatSession.objects.get(id=data["session_id"])
        self.assertEqual(session.messages.count(), 2)
        assistant = session.messages.filter(role=ChatMessage.ROLE_ASSISTANT).first()
        self.assertEqual(assistant.context["category"], "Bags")

    def test_user_cannot_continue_another_users_session(self):
        _, data = self.ask("hi", user=self.user)
        _, other = self.ask("hi", session_id=data["session_id"], user=self.other)
        self.assertNotEqual(data["session_id"], other["session_id"])

    def test_unknown_message_without_llm(self):
        _, data = self.ask("asdf qwerty")
        self.assertEqual(data["intent"], "general_chat")
        self.assertTrue(data["quick_replies"])

    @override_settings(CHATBOT_LLM_PROVIDER="openai", OPENAI_API_KEY="test-key")
    def test_llm_understanding_is_used_when_rules_are_unsure(self):
        fake = '{"intent": "product_search", "category": "Electronics", "search": "", "min_price": null, "max_price": null}'
        with patch.object(llm, "chat", return_value=fake):
            _, data = self.ask("I need something to listen to music")
        self.assertEqual([p["name"] for p in data["products"]], ["Wireless Headphones"])

    @override_settings(CHATBOT_LLM_PROVIDER="openai", OPENAI_API_KEY="test-key")
    def test_llm_down_falls_back_to_rules(self):
        with patch.object(requests, "post", side_effect=requests.exceptions.ConnectionError("offline")):
            response, data = self.ask("I need something to listen to music")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["reply"])

    @override_settings(CHATBOT_LLM_PROVIDER="openai", OPENAI_API_KEY="")
    def test_no_api_key_means_rules_only(self):
        self.assertFalse(llm.is_enabled())
        _, data = self.ask("show me bags")
        self.assertEqual([p["name"] for p in data["products"]], ["Black Backpack"])
