"""
ShopEase chatbot engine.

Flow for every message:
    1. Rule engine reads the message (greetings, orders, store topics,
       categories, prices, brands...). This is instant and always works.
    2. If the rules are unsure, OpenAI (if configured) is asked to
       understand the meaning ("something to carry my stuff" -> Bags).
    3. Products / orders are always read from the database, and reply
       text for them is built from real data, so prices and stock are
       never invented.
"""

import json
import logging
import re
from decimal import Decimal, InvalidOperation

from django.core.cache import cache
from django.db.models import Min, Q

from order.models import Order
from products.models import Category, Product

from . import llm
from .knowledge import STORE_NAME, STORE_TOPICS

logger = logging.getLogger(__name__)

MAX_PRODUCTS = 6
MAX_ORDERS = 5
CATEGORY_CACHE_KEY = "chatbot:category-index"
CATEGORY_CACHE_SECONDS = 300

INTENT_PRODUCT = "product_search"
INTENT_ORDER = "order_status"
INTENT_STORE = "store_info"
INTENT_GENERAL = "general_chat"
INTENTS = {INTENT_PRODUCT, INTENT_ORDER, INTENT_STORE, INTENT_GENERAL}

GREETING_WORDS = {
    "hi", "hello", "hey", "hii", "hiii", "helo", "salam", "salaam", "aoa",
    "assalam", "assalamualaikum", "asalam", "asalamualaikum", "slam",
    "good morning", "good evening", "good afternoon", "yo", "how are you",
    "kya haal hai", "kaise ho", "kesay ho", "kaisay ho",
}
THANKS_WORDS = {
    "thanks", "thank you", "thankyou", "thx", "ty", "shukriya", "shukria",
    "jazakallah", "great", "nice", "awesome", "ok thanks", "perfect",
}
BYE_WORDS = {"bye", "goodbye", "allah hafiz", "khuda hafiz", "see you", "later"}

PRODUCT_TRIGGERS = {
    "show", "find", "search", "want", "need", "buy", "looking", "recommend",
    "suggest", "dikhao", "dikha", "dikhaen", "dikhayen", "chahiye", "chaiye",
    "chahye", "available", "have", "any", "best", "top", "popular", "cheap",
    "cheapest", "affordable", "expensive", "premium", "latest", "newest",
    "new", "sasta", "sasti", "saste", "products", "product", "items", "options",
    "price", "prices", "cost", "budget", "deal", "deals", "more", "cheaper",
}

STOP_WORDS = {
    # English filler
    "i", "im", "i'm", "me", "my", "mine", "we", "you", "your", "it", "its",
    "is", "am", "are", "was", "be", "been", "do", "does", "did", "can",
    "could", "would", "should", "will", "shall", "may", "might", "please",
    "pls", "plz", "a", "an", "the", "this", "that", "these", "those", "some",
    "any", "something", "anything", "thing", "things", "stuff", "for", "to",
    "of", "in", "on", "at", "by", "with", "from", "and", "or", "but", "so",
    "what", "which", "who", "how", "where", "when", "why", "about", "there",
    "here", "have", "has", "had", "get", "got", "give", "show", "find",
    "search", "want", "wanna", "need", "buy", "looking", "look", "see",
    "check", "recommend", "suggest", "tell", "let", "know", "like", "also",
    "else", "other", "another", "more", "less", "than", "under", "below",
    "above", "over", "between", "within", "upto", "up", "around", "about",
    "rs", "pkr", "rupees", "rupee", "price", "prices", "cost", "budget",
    "cheap", "cheaper", "cheapest", "affordable", "expensive", "premium",
    "best", "top", "popular", "latest", "new", "newest", "good", "nice",
    "great", "available", "product", "products", "item", "items", "option",
    "options", "store", "shop", "now", "then", "only", "just", "all", "one",
    "ones", "them", "they", "him", "her", "us", "our", "yes", "no", "ok",
    "okay", "hi", "hello", "hey", "thanks", "thank", "much", "very", "really",
    "similar", "deal", "deals", "range", "k", "thousand", "category",
    "categories",
    # Roman Urdu filler
    "mujhe", "mujhay", "muje", "mjhe", "koi", "kuch", "hai", "hain", "he",
    "ka", "ki", "ke", "ko", "se", "say", "mein", "main", "mai", "me", "aur",
    "ya", "bhi", "acha", "achi", "ache", "wala", "wali", "wale", "dikhao",
    "dikha", "dikhaen", "dikhayen", "chahiye", "chaiye", "chahye", "kya",
    "kia", "kitna", "kitni", "kitne", "tak", "kam", "zyada", "ziada",
    "andar", "upar", "neeche", "sasta", "sasti", "saste", "mehnga", "mehngi",
    "hazar", "hazaar", "bata", "batao", "do", "de", "dein", "den",
}

SORT_CUES = {
    "price_asc": {"cheap", "cheaper", "cheapest", "affordable", "sasta", "sasti", "saste", "lowest", "budget"},
    "price_desc": {"expensive", "premium", "luxury", "mehnga", "mehngi", "highest"},
    "newest": {"latest", "new", "newest", "recent", "arrival", "arrivals"},
}

ORDER_STATUS_TEXT = {
    "pending": "We've received it and it's waiting to be processed.",
    "processing": "It's being prepared for shipping.",
    "shipped": "It's on the way to you.",
    "delivered": "It has been delivered.",
    "cancelled": "It was cancelled.",
}

# Fallback words used when no LLM is running. A category is only matched
# if a category with that name actually exists in the database.
#   generic  -> words that just mean "this category" (removed from search)
#   specific -> product types inside the category (kept as search words)
CATEGORY_ALIASES = {
    "clothing": {
        "generic": ["clothes", "clothe", "cloth", "clothing", "outfit", "outfits", "apparel", "kapray", "kapre", "kapde"],
        "specific": ["shirt", "tshirt", "t-shirt", "jeans", "trouser", "pant", "hoodie", "jacket", "dress", "kurta"],
    },
    "shoes": {
        "generic": ["shoe", "shoes", "footwear", "joota", "joote", "jootay", "feet", "foot"],
        "specific": ["sneaker", "sneakers", "trainer", "runner", "running", "sandal", "slipper", "boot", "boots"],
    },
    "bags": {
        "generic": ["bag", "bags", "carry", "luggage"],
        "specific": ["backpack", "handbag", "purse", "wallet", "travel"],
    },
    "electronics": {
        "generic": ["electronic", "electronics", "gadget", "gadgets", "device", "devices", "tech"],
        "specific": ["headphone", "headphones", "earbud", "earbuds", "phone", "mobile", "laptop", "charger", "speaker", "watch"],
    },
}

NUMBER = r"(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|hazar|hazaar)?\b"


# =====================================================================
# Helpers
# =====================================================================

def normalize(text):
    text = (text or "").lower()
    text = text.replace("’", "'")
    text = re.sub(r"\brs\.?\s*", " ", text)
    text = re.sub(r"\bpkr\.?\s*", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def to_number(value, suffix=None):
    try:
        number = Decimal(value.replace(",", ""))
    except (InvalidOperation, AttributeError):
        return None

    if suffix:
        number *= 1000

    return number


def money(value):
    try:
        value = Decimal(value)
    except (InvalidOperation, TypeError):
        return str(value)

    if value == value.to_integral():
        return f"Rs. {int(value):,}"

    return f"Rs. {value:,.2f}"


def singular(word):
    if len(word) > 5 and word.endswith("ing"):
        return word[:-3]  # running -> runn (matches "Runner")
    if len(word) <= 3 or word.endswith("ss"):
        return word
    if word.endswith("ies"):
        return word[:-3] + "y"
    if word.endswith(("ches", "shes", "xes")):
        return word[:-2]
    if word.endswith("s"):
        return word[:-1]
    return word


def contains_phrase(text, phrase):
    return re.search(rf"(?<![a-z0-9]){re.escape(phrase)}(?![a-z0-9])", text) is not None


def tokenize(text):
    return re.findall(r"[a-z0-9]+(?:'[a-z]+)?", text)


# =====================================================================
# Category index (cached)
# =====================================================================

def get_category_index():
    index = cache.get(CATEGORY_CACHE_KEY)
    if index is not None:
        return index

    index = []
    for category in Category.objects.all().order_by("name"):
        products = list(
            Product.objects.filter(category=category, is_active=True)
            .order_by("-positive_feedback", "-created_at")
            .values_list("name", flat=True)[:5]
        )
        name = category.name.strip()
        lower = name.lower()
        variants = {lower, singular(lower)}
        variants |= {singular(word) for word in tokenize(lower) if len(word) > 3}
        variants |= {word for word in tokenize(lower) if len(word) > 3}

        generic, specific = [], []
        for sub_name in category.subcategories.values_list("name", flat=True):
            specific += [
                singular(word) for word in tokenize(sub_name.lower())
                if len(word) > 3 and word not in STOP_WORDS
            ]
        for key, alias in CATEGORY_ALIASES.items():
            if key in variants or singular(key) in variants:
                generic += alias["generic"]
                specific += alias["specific"]

        index.append(
            {
                "id": category.id,
                "name": name,
                "description": category.description or "",
                "variants": sorted(variants, key=len, reverse=True),
                "generic": generic,
                "specific": specific,
                "examples": products,
            }
        )

    cache.set(CATEGORY_CACHE_KEY, index, CATEGORY_CACHE_SECONDS)
    return index


def clear_category_cache():
    cache.delete(CATEGORY_CACHE_KEY)


def find_category_by_name(name):
    if not name:
        return None

    name = str(name).strip().lower()
    for item in get_category_index():
        if name == item["name"].lower() or name in item["variants"]:
            return item
    return None


# =====================================================================
# Rule-based understanding
# =====================================================================

def parse_prices(text):
    """Returns (min_price, max_price, text_without_price_phrases)."""
    min_price = max_price = None
    spans = []

    def add(match):
        spans.append(match.span())

    # between 3000 and 5000 / 3000 to 5000 / 3000-5000 / 3000 se 5000
    match = re.search(
        rf"(?:between\s+)?{NUMBER}\s*(?:and|to|-|se|say)\s*{NUMBER}",
        text,
    )
    if match:
        low = to_number(match.group(1), match.group(2))
        high = to_number(match.group(3), match.group(4))
        if low is not None and high is not None and high > low:
            min_price, max_price = low, high
            add(match)

    if max_price is None:
        match = re.search(
            rf"(?:under|below|less than|lower than|cheaper than|within|upto|up to|"
            rf"max(?:imum)?|budget(?: is| of)?|not more than|at most|no more than)\s*(?:of\s*)?{NUMBER}",
            text,
        ) or re.search(
            rf"{NUMBER}\s*(?:se kam|say kam|se neeche|se nichay|tak|ke andar|k andar|"
            rf"or less|and below|or below|max)",
            text,
        )
        if match:
            max_price = to_number(match.group(1), match.group(2))
            add(match)

    if min_price is None:
        match = re.search(
            rf"(?:above|over|more than|greater than|min(?:imum)?|at least|starting from|starting at)\s*{NUMBER}",
            text,
        ) or re.search(
            rf"{NUMBER}\s*(?:se zyada|se ziada|say zyada|se upar|se oper|or more|and above|or above|plus|\+)",
            text,
        )
        if match:
            min_price = to_number(match.group(1), match.group(2))
            add(match)

    if min_price is None and max_price is None:
        match = re.search(rf"(?:around|about|approx(?:imately)?|near|lagbhag|takreeban)\s*{NUMBER}", text)
        if match:
            value = to_number(match.group(1), match.group(2))
            if value is not None:
                min_price = (value * Decimal("0.8")).quantize(Decimal("1"))
                max_price = (value * Decimal("1.2")).quantize(Decimal("1"))
                add(match)

    for start, end in sorted(spans, reverse=True):
        text = text[:start] + " " + text[end:]

    return min_price, max_price, text


def detect_store_topic(text):
    best_topic, best_length = None, 0
    for topic, data in STORE_TOPICS.items():
        for keyword in data["keywords"]:
            if contains_phrase(text, keyword) and len(keyword) > best_length:
                best_topic, best_length = topic, len(keyword)
    return best_topic


def detect_order(text):
    """Returns (is_order_question, order_id)."""
    order_id = None
    match = re.search(r"order\s*(?:#|no\.?|number|id)?\s*#?\s*(\d+)", text) or re.search(r"#\s*(\d+)", text)
    if match:
        order_id = int(match.group(1))

    words = set(tokenize(text))
    has_order_word = bool(words & {"order", "orders", "parcel", "package"})
    tracking = bool(words & {"track", "tracking"})
    status_words = words & {
        "my", "mera", "meri", "mere", "meray", "status", "where", "kahan",
        "kab", "kidhar", "arrive", "arrived", "placed", "recent", "last", "latest",
    }

    is_order = tracking or (has_order_word and (bool(status_words) or order_id is not None))
    return is_order, order_id


def detect_small_talk(text):
    cleaned = re.sub(r"[^a-z\s]", " ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if not cleaned:
        return None

    words = cleaned.split()
    for kind, vocabulary in (("greeting", GREETING_WORDS), ("thanks", THANKS_WORDS), ("bye", BYE_WORDS)):
        for phrase in vocabulary:
            if contains_phrase(cleaned, phrase) and len(words) <= len(phrase.split()) + 3:
                return kind
    return None


def detect_sort(words):
    for sort, cues in SORT_CUES.items():
        if set(words) & cues:
            return sort
    return None


def detect_category(text):
    """Find a category named in the text (e.g. 'shoes', 'bag', 'clothes')."""
    best, best_position = None, None
    for item in get_category_index():
        for word in item["variants"] + item["generic"] + item["specific"]:
            match = re.search(rf"(?<![a-z0-9]){re.escape(word)}(?:e?s)?(?![a-z0-9])", text)
            if match and (best_position is None or match.start() < best_position):
                best, best_position = item, match.start()
    return best


def category_from_products(words):
    """If search words only match products of ONE category, return it."""
    if not words:
        return None

    query = Q()
    for word in words:
        query |= Q(name__icontains=word)

    category_ids = set(
        Product.objects.filter(query, is_active=True).values_list("category_id", flat=True)[:50]
    )
    if len(category_ids) == 1:
        category_id = category_ids.pop()
        for item in get_category_index():
            if item["id"] == category_id:
                return item
    return None


def search_words_from(text, category=None):
    removable = set(STOP_WORDS)
    if category:
        removable |= set(category["variants"]) | set(category["generic"])
        removable |= {singular(v) for v in category["variants"] + category["generic"]}

    words = []
    for word in tokenize(text):
        word = word.replace("'", "")
        if word.isdigit() or len(word) < 2:
            continue
        if word in removable or singular(word) in removable:
            continue
        words.append(singular(word))

    return list(dict.fromkeys(words))[:6]


def parse_rules(message):
    text = normalize(message)
    words = tokenize(text)

    result = {
        "intent": INTENT_GENERAL,
        "small_talk": None,
        "topic": None,
        "order_id": None,
        "category": None,
        "search": [],
        "min_price": None,
        "max_price": None,
        "sort": None,
        "confident": False,
    }

    if not text:
        return result

    min_price, max_price, text_without_price = parse_prices(text)
    result["min_price"], result["max_price"] = min_price, max_price
    result["sort"] = detect_sort(words)

    topic = detect_store_topic(text)
    is_order, order_id = detect_order(text)

    # "cancel my order" / "return my order" -> policy answer, not tracking.
    if topic in {"cancel", "returns"}:
        result.update(intent=INTENT_STORE, topic=topic, confident=True)
        return result

    if is_order:
        result.update(intent=INTENT_ORDER, order_id=order_id, confident=True)
        return result

    category = detect_category(text_without_price)
    search = search_words_from(text_without_price, category)
    if not category and search:
        category = category_from_products(search)
        if category:
            search = search_words_from(text_without_price, category)

    result["category"] = category
    result["search"] = search

    if topic and not category:
        result.update(intent=INTENT_STORE, topic=topic, confident=True)
        return result

    small_talk = detect_small_talk(text)
    has_price = min_price is not None or max_price is not None
    has_trigger = bool(set(words) & PRODUCT_TRIGGERS)

    if category or has_price:
        result.update(intent=INTENT_PRODUCT, confident=True)
        return result

    if small_talk:
        result.update(small_talk=small_talk, confident=True)
        return result

    if search and products_exist(search):
        result.update(intent=INTENT_PRODUCT, confident=True)
        return result

    if has_trigger or result["sort"]:
        # Product request, but we couldn't map it -> let the LLM try.
        result["intent"] = INTENT_PRODUCT

    return result


def products_exist(words):
    query = Q()
    for word in words:
        query |= (
            Q(name__icontains=word)
            | Q(description__icontains=word)
            | Q(subcategory__name__icontains=word)
        )
    return Product.objects.filter(query, is_active=True, stock__gt=0).exists()


# =====================================================================
# LLM understanding (only used when the rules are unsure)
# =====================================================================

def parse_with_llm(message, history):
    categories = [
        {"name": item["name"], "examples": item["examples"][:3], "description": item["description"][:120]}
        for item in get_category_index()
    ]

    system_prompt = f"""You read customer messages for the {STORE_NAME} online store and return JSON only.

Store categories with real example products:
{json.dumps(categories, ensure_ascii=False)}

Return exactly:
{{"intent": "product_search|order_status|store_info|general_chat", "category": null, "search": "", "min_price": null, "max_price": null}}

Rules:
- product_search: the user wants to find, see, buy or get recommendations for products.
- order_status: the user asks about their own order or delivery status.
- store_info: questions about delivery, returns, payment, account or contact.
- general_chat: greetings, thanks, or anything else.
- category: understand the MEANING. "something to carry my things" means a bags-type category,
  "something to wear on my feet" means shoes, "an outfit" means clothing. Use ONLY a name
  from the list above, exactly as written, or null.
- search: only extra details such as brand, colour, model or product type (e.g. "Nike", "black").
  Do not repeat the category name. Empty string if none.
- min_price / max_price: numbers only if the user gave them, otherwise null.
- Use the previous conversation if the current message is incomplete
  (e.g. "under 3000" after asking for shoes -> category Shoes)."""

    messages = [{"role": "system", "content": system_prompt}]
    for item in history[-6:]:
        messages.append({"role": item["role"], "content": item["content"][:500]})
    messages.append({"role": "user", "content": message})

    data = llm.chat_json(messages, max_tokens=150)

    intent = data.get("intent")
    if intent not in INTENTS:
        intent = INTENT_GENERAL

    category = find_category_by_name(data.get("category"))
    search_text = normalize(str(data.get("search") or ""))
    search = search_words_from(search_text, category)

    def price(value):
        if value in (None, "", "null"):
            return None
        try:
            number = Decimal(str(value).replace(",", ""))
            return number if number >= 0 else None
        except InvalidOperation:
            return None

    return {
        "intent": intent,
        "category": category,
        "search": search,
        "min_price": price(data.get("min_price")),
        "max_price": price(data.get("max_price")),
    }


# =====================================================================
# Product search
# =====================================================================

def build_queryset(category=None, min_price=None, max_price=None):
    queryset = Product.objects.filter(is_active=True, stock__gt=0).select_related("category", "subcategory")
    if category:
        queryset = queryset.filter(category_id=category["id"])
    if min_price is not None:
        queryset = queryset.filter(price__gte=min_price)
    if max_price is not None:
        queryset = queryset.filter(price__lte=max_price)
    return queryset


def order_queryset(queryset, sort):
    if sort == "price_asc":
        return queryset.order_by("price", "-positive_feedback")
    if sort == "price_desc":
        return queryset.order_by("-price", "-positive_feedback")
    if sort == "newest":
        return queryset.order_by("-created_at")
    return queryset.order_by("-positive_feedback", "-created_at")


def search_products(category=None, search=None, min_price=None, max_price=None, sort=None):
    """Returns (products, exact_match)."""
    base = build_queryset(category, min_price, max_price)
    search = search or []

    if not search:
        return list(order_queryset(base, sort)[:MAX_PRODUCTS]), True

    def word_query(word):
        return (
            Q(name__icontains=word)
            | Q(description__icontains=word)
            | Q(subcategory__name__icontains=word)
        )

    # Prefer products that match ALL words ("air fryer" should not return
    # "hair dryer"); fall back to ANY word when nothing matches them all.
    all_words = Q()
    any_word = Q()
    for word in search:
        all_words &= word_query(word)
        any_word |= word_query(word)

    candidates = list(order_queryset(base.filter(all_words), sort)[:60])
    if not candidates and len(search) > 1:
        candidates = list(order_queryset(base.filter(any_word), sort)[:60])

    if candidates:
        def score(product):
            name = product.name.lower()
            description = (product.description or "").lower()
            sub = (product.subcategory.name.lower() if product.subcategory_id else "")
            return sum(
                3 if word in name else 2 if word in sub else 1 if word in description else 0
                for word in search
            )

        # Python's sort is stable, so the DB ordering is kept for equal scores.
        candidates.sort(key=score, reverse=True)
        return candidates[:MAX_PRODUCTS], True

    # Nothing matched the extra words: fall back to the category/price only.
    if category or min_price is not None or max_price is not None:
        return list(order_queryset(base, sort)[:MAX_PRODUCTS]), False

    return [], False


def serialize_product(product, request=None):
    image = None
    if product.image:
        image = product.image.url
        if request is not None:
            image = request.build_absolute_uri(image)

    return {
        "id": product.id,
        "name": product.name,
        "price": str(product.price),
        "price_display": money(product.price),
        "category": product.category.name,
        "subcategory": product.subcategory.name if product.subcategory_id else None,
        "stock": product.stock,
        "image": image,
        "url": f"/products/{product.id}",
    }


def describe_filters(category, search, min_price, max_price):
    parts = [category["name"] if category else "products"]
    if search:
        parts.append(f"matching “{' '.join(search)}”")
    if min_price is not None and max_price is not None:
        parts.append(f"between {money(min_price)} and {money(max_price)}")
    elif max_price is not None:
        parts.append(f"under {money(max_price)}")
    elif min_price is not None:
        parts.append(f"above {money(min_price)}")
    return " ".join(parts)


# =====================================================================
# Main entry point
# =====================================================================

class ChatbotEngine:
    def __init__(self, request=None, user=None, history=None, last_context=None):
        self.request = request
        self.user = user if user is not None and user.is_authenticated else None
        self.history = history or []
        self.last_context = last_context or {}

    # -----------------------------------------------------------------

    def respond(self, message):
        parsed = parse_rules(message)
        used_llm = False

        if not parsed["confident"] and llm.is_available():
            try:
                understood = parse_with_llm(message, self.history)
                used_llm = True
                parsed = self.merge(parsed, understood)
            except llm.LLMError as error:
                logger.info("Chatbot LLM parse skipped: %s", error)

        if parsed["intent"] in {INTENT_PRODUCT, INTENT_GENERAL} and not parsed.get("small_talk"):
            parsed = self.apply_previous_context(message, parsed)

        intent = parsed["intent"]

        if intent == INTENT_ORDER:
            response = self.order_response(parsed.get("order_id"))
        elif intent == INTENT_STORE:
            response = self.store_response(parsed.get("topic"), message)
        elif intent == INTENT_PRODUCT:
            response = self.product_response(parsed, message)
        else:
            response = self.general_response(message, parsed.get("small_talk"))

        response.setdefault("products", [])
        response.setdefault("orders", [])
        response.setdefault("actions", [])
        response.setdefault("quick_replies", [])
        response["intent"] = response.get("intent", intent)
        response["used_llm"] = used_llm or response.get("used_llm", False)
        return response

    # -----------------------------------------------------------------

    @staticmethod
    def merge(rules, understood):
        merged = dict(rules)
        merged["intent"] = understood["intent"]

        if understood["category"]:
            merged["category"] = understood["category"]
            merged["search"] = [
                w for w in (understood["search"] or rules["search"])
                if w not in understood["category"]["variants"] + understood["category"]["generic"]
            ]
        elif understood["search"]:
            merged["search"] = understood["search"]

        # Regex price parsing is more reliable than a small LLM.
        if rules["min_price"] is None and rules["max_price"] is None:
            merged["min_price"] = understood["min_price"]
            merged["max_price"] = understood["max_price"]

        if merged["intent"] == INTENT_PRODUCT and merged["search"] and not merged["category"]:
            if not products_exist(merged["search"]):
                merged["search"] = []
        return merged

    def apply_previous_context(self, message, parsed):
        """
        Reuse the category of the previous search for follow-ups such as
        "under 3000", "cheaper ones" or "what about adidas?".
        """
        previous = self.last_context
        if not previous or parsed.get("category"):
            return parsed

        previous_category = find_category_by_name(previous.get("category"))
        if not previous_category:
            return parsed

        # "show me all products under 5000" is a new, store-wide search.
        words = set(tokenize(normalize(message)))
        if words & {"products", "items", "everything", "anything", "all", "store", "overall"}:
            return parsed

        search = parsed.get("search") or []
        follow_up = parsed["intent"] == INTENT_PRODUCT and not search
        matches_previous = bool(search) and build_queryset(previous_category).filter(
            Q(name__icontains=search[0]) | Q(description__icontains=search[0])
        ).exists()

        if not (follow_up or matches_previous):
            return parsed

        parsed = dict(parsed)
        parsed["intent"] = INTENT_PRODUCT
        parsed["category"] = previous_category

        has_new_price = parsed["min_price"] is not None or parsed["max_price"] is not None
        if not has_new_price and not search:
            parsed["search"] = previous.get("search") or []
            parsed["min_price"] = self.to_decimal(previous.get("min_price"))
            parsed["max_price"] = self.to_decimal(previous.get("max_price"))
        return parsed

    @staticmethod
    def to_decimal(value):
        if value in (None, ""):
            return None
        try:
            return Decimal(str(value))
        except InvalidOperation:
            return None

    # -----------------------------------------------------------------
    # Products
    # -----------------------------------------------------------------

    def product_response(self, parsed, message=""):
        category = parsed.get("category")
        search = parsed.get("search") or []
        # Show the customer's own words ("running"), not the search stems ("runn").
        tokens = tokenize(normalize(message))
        terms = [next((t for t in tokens if t.startswith(w)), w) for w in search]
        min_price, max_price = parsed.get("min_price"), parsed.get("max_price")
        sort = parsed.get("sort")

        if min_price is not None and max_price is not None and min_price > max_price:
            min_price, max_price = max_price, min_price

        products, exact = search_products(category, search, min_price, max_price, sort)
        context = {
            "category": category["name"] if category else None,
            "search": search,
            "min_price": str(min_price) if min_price is not None else None,
            "max_price": str(max_price) if max_price is not None else None,
        }

        if not products:
            return {
                "reply": self.no_products_reply(category, terms, min_price, max_price),
                "quick_replies": self.category_quick_replies(exclude=category),
                "context": context,
            }

        label = describe_filters(category, terms if exact else [], min_price, max_price)
        count = len(products)

        if exact:
            if sort == "price_asc":
                reply = f"Here are the most affordable {label}:"
            elif sort == "price_desc":
                reply = f"Here are our premium {label}:"
            elif sort == "newest":
                reply = f"Here are the latest {label}:"
            elif count == 1:
                reply = f"I found 1 option in {label}:"
            else:
                reply = f"Here are {count} {label} you might like:"
        else:
            reply = (
                f"I couldn't find an exact match for “{' '.join(terms)}”, "
                f"but here are some {label} you might like:"
            )

        quick_replies = []
        if category:
            quick_replies.append(f"Cheaper {category['name']}")
        quick_replies += self.category_quick_replies(exclude=category, limit=2)

        return {
            "reply": reply,
            "products": [serialize_product(p, self.request) for p in products],
            "quick_replies": quick_replies,
            "context": context,
        }

    def no_products_reply(self, category, search, min_price, max_price):
        has_price = min_price is not None or max_price is not None

        if category and has_price:
            cheapest = build_queryset(category).aggregate(value=Min("price"))["value"]
            if cheapest is not None and max_price is not None and cheapest > max_price:
                return (
                    f"I couldn't find {category['name']} under {money(max_price)}. "
                    f"Our {category['name']} start from {money(cheapest)}."
                )
            return f"I couldn't find {category['name']} in that price range right now."

        if category:
            return f"Sorry, {category['name']} are out of stock right now. Please check back soon."

        names = [item["name"] for item in get_category_index()]
        if names:
            what = f" for “{' '.join(search)}”" if search else ""
            return (
                f"Sorry, I couldn't find anything{what} right now. "
                f"We currently have: {', '.join(names)}."
            )
        return "Sorry, there are no products available right now."

    def category_quick_replies(self, exclude=None, limit=4):
        replies = []
        for item in get_category_index():
            if exclude and item["id"] == exclude["id"]:
                continue
            replies.append(f"Show me {item['name']}")
            if len(replies) >= limit:
                break
        return replies

    # -----------------------------------------------------------------
    # Orders
    # -----------------------------------------------------------------

    def order_response(self, order_id=None):
        if not self.user:
            return {
                "reply": "Please log in first so I can check your orders.",
                "actions": [{"label": "Login", "href": "/login"}],
            }

        orders = (
            Order.objects.filter(user=self.user)
            .prefetch_related("items__product")
            .order_by("-created_at")
        )

        if order_id is not None:
            order = orders.filter(id=order_id).first()
            if not order:
                return {
                    "reply": f"I couldn't find order #{order_id} on your account.",
                    "orders": [self.serialize_order(o) for o in orders[:MAX_ORDERS]],
                    "actions": [{"label": "My orders", "href": "/profile"}],
                }
            return {
                "reply": (
                    f"Order #{order.id} is {order.get_status_display()}. "
                    f"{ORDER_STATUS_TEXT.get(order.status, '')}"
                ).strip(),
                "orders": [self.serialize_order(order)],
                "actions": [{"label": "My orders", "href": "/profile"}],
            }

        recent = list(orders[:MAX_ORDERS])
        if not recent:
            return {
                "reply": "You haven't placed any orders yet. Want me to help you find something?",
                "quick_replies": self.category_quick_replies(limit=3),
            }

        latest = recent[0]
        reply = (
            f"Your latest order #{latest.id} is {latest.get_status_display()}. "
            f"{ORDER_STATUS_TEXT.get(latest.status, '')}"
        ).strip()
        if len(recent) > 1:
            reply += " Here are your recent orders:"

        return {
            "reply": reply,
            "orders": [self.serialize_order(o) for o in recent],
            "actions": [{"label": "My orders", "href": "/profile"}],
        }

    @staticmethod
    def serialize_order(order):
        items = list(order.items.all())
        names = [f"{item.product.name} × {item.quantity}" for item in items[:3]]
        if len(items) > 3:
            names.append(f"+{len(items) - 3} more")

        return {
            "id": order.id,
            "status": order.status,
            "status_display": order.get_status_display(),
            "total": str(order.total_amount),
            "total_display": money(order.total_amount),
            "created_at": order.created_at.strftime("%d %b %Y"),
            "items": names,
        }

    # -----------------------------------------------------------------
    # Store info
    # -----------------------------------------------------------------

    def store_response(self, topic, message):
        if not topic:
            topic = detect_store_topic(normalize(message))

        data = STORE_TOPICS.get(topic)
        if not data:
            return self.general_response(message, None)

        return {
            "reply": data["answer"],
            "actions": data.get("actions", []),
        }

    # -----------------------------------------------------------------
    # General chat
    # -----------------------------------------------------------------

    def general_response(self, message, small_talk):
        name = f" {self.user.first_name or self.user.username}" if self.user else ""

        if small_talk == "greeting":
            return {
                "reply": (
                    f"Hi{name}! 👋 I'm {STORE_NAME} AI. I can help you find products, "
                    "compare prices and track your orders. What are you looking for today?"
                ),
                "quick_replies": self.category_quick_replies(limit=3) + ["Track my order"],
                "intent": INTENT_GENERAL,
            }
        if small_talk == "thanks":
            return {"reply": "You're welcome! Anything else I can help you with?", "intent": INTENT_GENERAL}
        if small_talk == "bye":
            return {"reply": "Goodbye! Happy shopping 🛍️", "intent": INTENT_GENERAL}

        if llm.is_available():
            try:
                return {
                    "reply": self.llm_general_reply(message),
                    "quick_replies": self.category_quick_replies(limit=3),
                    "intent": INTENT_GENERAL,
                    "used_llm": True,
                }
            except llm.LLMError as error:
                logger.info("Chatbot LLM reply skipped: %s", error)

        return {
            "reply": (
                "I'm not sure I understood that. I can help you find products "
                "(for example “Show me shoes under 5000”), track your orders, or "
                "answer questions about delivery and returns."
            ),
            "quick_replies": self.category_quick_replies(limit=3) + ["Track my order"],
            "intent": INTENT_GENERAL,
        }

    def llm_general_reply(self, message):
        categories = ", ".join(item["name"] for item in get_category_index()) or "none yet"
        system_prompt = (
            f"You are {STORE_NAME} AI, the friendly shopping assistant of the {STORE_NAME} "
            f"online store. Store categories: {categories}. "
            "You help customers find products, check their orders and answer basic questions. "
            "Reply in 1-3 short sentences, in the same language the customer uses. "
            "Never invent products, prices, stock, discounts or store policies. "
            "If the customer wants products, tell them to ask, e.g. 'Show me shoes under 5000'. "
            "Politely steer unrelated topics back to shopping."
        )

        messages = [{"role": "system", "content": system_prompt}]
        for item in self.history[-6:]:
            messages.append({"role": item["role"], "content": item["content"][:500]})
        messages.append({"role": "user", "content": message})

        reply = llm.chat(messages, max_tokens=160, temperature=0.4)
        if not reply:
            raise llm.LLMError("Empty reply.")
        return reply[:800]
