"""
Store information the chatbot can answer without searching products.

EDIT THESE ANSWERS to match your real store policies. The chatbot only
repeats what is written here; it never invents policies.

Each topic has:
    keywords  -> words/phrases that trigger the topic (lowercase)
    answer    -> the reply text
    actions   -> optional buttons shown under the reply (label + link)
"""

STORE_NAME = "ShopEase"

STORE_TOPICS = {
    "shipping": {
        "keywords": [
            "shipping", "delivery", "deliver", "delivery fee", "delivery charges",
            "shipping cost", "how long", "kitne din", "kab tak", "kab milega",
        ],
        "answer": (
            "A flat delivery fee of Rs. 200 is added at checkout. After you "
            "place an order you can follow its status (Pending, Processing, "
            "Shipped, Delivered) from your Profile page, or just ask me "
            "\"Where is my order?\""
        ),
        "actions": [{"label": "My profile", "href": "/profile"}],
    },
    "returns": {
        "keywords": [
            "return", "refund", "exchange", "replace", "replacement",
            "damaged", "wrong item", "wapas", "wapsi",
        ],
        "answer": (
            "For a return, refund or exchange, send us a message from the "
            "Contact page with your order number and the reason. Our team "
            "will get back to you by email."
        ),
        "actions": [{"label": "Contact us", "href": "/contact"}],
    },
    "payment": {
        "keywords": [
            "payment", "pay", "cash on delivery", "cod", "card", "jazzcash",
            "easypaisa", "bank transfer", "installment",
        ],
        "answer": (
            "You place your order from the Cart page by adding a shipping "
            "address. For any payment question, please reach us from the "
            "Contact page and we'll help you."
        ),
        "actions": [
            {"label": "Go to cart", "href": "/cart"},
            {"label": "Contact us", "href": "/contact"},
        ],
    },
    "cancel": {
        "keywords": ["cancel", "cancellation", "cancel my order"],
        "answer": (
            "To cancel an order, contact us from the Contact page with your "
            "order number as soon as possible. Orders that are already "
            "shipped may not be cancellable."
        ),
        "actions": [{"label": "Contact us", "href": "/contact"}],
    },
    "account": {
        "keywords": [
            "password", "forgot password", "reset password", "login",
            "log in", "sign in", "signup", "sign up", "register", "account",
        ],
        "answer": (
            "You can create an account from Sign up and log in from Login. "
            "If you forgot your password, use \"Forgot password\" on the "
            "login page to get a reset link by email."
        ),
        "actions": [
            {"label": "Login", "href": "/login"},
            {"label": "Sign up", "href": "/signup"},
        ],
    },
    "contact": {
        "keywords": [
            "contact", "customer support", "customer service", "support",
            "talk to human", "human", "agent", "complaint", "phone number",
            "email address",
        ],
        "answer": (
            "You can reach the ShopEase team from the Contact page. Send us "
            "your question and we'll reply by email."
        ),
        "actions": [{"label": "Contact us", "href": "/contact"}],
    },
}
