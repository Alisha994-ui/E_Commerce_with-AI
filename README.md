# ShopEase

ShopEase is a full-stack e-commerce web application with a Django REST API backend and a Next.js frontend. It includes a customer storefront, an admin dashboard, product recommendations, sentiment analysis of product feedback, and an AI shopping assistant (chatbot).

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Environment Variables](#environment-variables)
8. [AI Shopping Assistant](#ai-shopping-assistant)
9. [API Reference](#api-reference)
10. [Running Tests](#running-tests)
11. [Design System](#design-system)
12. [Troubleshooting](#troubleshooting)
13. [Security Notes](#security-notes)

---

## Features

### Storefront
- Product catalogue with search, categories, **sub categories**, sorting and "Load more" pagination
- Product details open in a **slide-over panel** (drawer) without leaving the current page
- Shopping cart with live cart counter and checkout with shipping address
- User registration, login (JWT), profile and order history
- Password reset by email
- Contact form
- Product feedback with automatic sentiment analysis
- "You may also like" recommendations based on product similarity

### Admin Dashboard
- Store statistics (products, orders, categories, customers)
- Product and category management, including image uploads
- Sub category management (add, rename, delete) and sub category selection on products
- Order, order item, cart and user management

### AI Shopping Assistant
- Available on every storefront page
- Finds products by category, brand and price ("show me shoes under 5000")
- Understands Roman Urdu phrasing ("joote dikhao 10000 se kam")
- Remembers context for follow-up questions ("under 3000", "what about Adidas?")
- Shows product cards with **View** and **Add to cart** actions
- Tracks orders for logged-in users
- Answers store questions (delivery, returns, payment, cancellation, account, contact)
- Works without any AI service; OpenAI can optionally be enabled for better understanding

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Django 6, Django REST Framework, Simple JWT, django-cors-headers |
| Database | PostgreSQL |
| AI / ML | scikit-learn (recommendations), Hugging Face Transformers (sentiment), OpenAI API (optional, chatbot) |
| Frontend | Next.js 16 (App Router), React 19 |
| Fonts | Bricolage Grotesque, Figtree (via `next/font/google`) |

---

## Project Structure

```
E-commerce/
├── backened/                     # Django project
│   ├── backened/                 # Settings, root URLs, WSGI/ASGI
│   ├── cart/                     # Cart and cart items
│   ├── chatbot/                  # AI shopping assistant
│   │   ├── services/
│   │   │   ├── engine.py         # Intent detection, product search, replies
│   │   │   ├── knowledge.py      # Store policies the bot answers (editable)
│   │   │   └── llm.py            # Optional OpenAI client
│   │   ├── models.py             # Chat sessions and messages
│   │   └── tests.py
│   ├── contact/                  # Contact messages
│   ├── dashboard/                # Admin statistics
│   ├── feedback/                 # Product feedback + sentiment analysis
│   ├── order/                    # Orders and order items
│   ├── products/                 # Products, categories, sub categories, recommendations
│   │   └── management/commands/  # seed_store demo data command
│   ├── user/                     # Registration, profile, password reset
│   ├── media/                    # Uploaded images
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                     # Next.js application
    ├── app/
    │   ├── components/           # Navbar, chatbot, API helper, shared UI
    │   ├── dashboard/            # Admin dashboard
    │   ├── admin/profile/        # Admin profile
    │   ├── product/              # Product listing
    │   ├── products/[id]/        # Product detail
    │   ├── cart/  categories/  contact/  profile/
    │   ├── login/  signup/  reset-password/
    │   ├── globals.css           # Design tokens and base styles
    │   ├── layout.js             # Root layout (fonts, navbar, chatbot)
    │   └── page.js               # Home page
    ├── package.json
    └── .env.local
```

---

## Prerequisites

- **Python** 3.12 or later
- **Node.js** 20 or later and npm
- **PostgreSQL** 14 or later
- Internet access on first run (Python packages, npm packages and Google Fonts)

---

## Backend Setup

All commands are shown for Windows PowerShell. On macOS/Linux, activate the virtual environment with `source venv/bin/activate` instead.

### 1. Create the database

Create a PostgreSQL database named `ecommerce_db` (or any name you set in `.env`):

```sql
CREATE DATABASE ecommerce_db;
```

### 2. Install dependencies

```powershell
cd E-commerce\backened
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

> `torch` and `transformers` are large downloads. They are required by the feedback sentiment analysis, not by the chatbot.

### 3. Configure environment variables

```powershell
Copy-Item .env.example .env
```

Edit `.env` with your database credentials, email account and (optionally) OpenAI key. See [Environment Variables](#environment-variables).

### 4. Apply migrations and create an admin user

```powershell
python manage.py migrate
python manage.py createsuperuser
```

### 5. Load demo data (optional)

```powershell
python manage.py seed_store
```

This adds 8 categories, 32 sub categories and about 90 products with generated placeholder images, plus 4 demo customers with sample orders. The command is safe to run again; existing records are updated rather than duplicated.

| Option | Effect |
|---|---|
| `--no-images` | Skip generating product and category images |
| `--no-orders` | Skip demo customers and orders |

Demo customers: `ayesha`, `bilal`, `sana`, `usman`, all with the password `Demo@12345`.

The catalogue is defined in `backened/products/management/commands/catalogue.py` and can be edited freely.

### 6. Start the server

```powershell
python manage.py runserver
```

The API is now available at `http://127.0.0.1:8000`. The Django admin panel is at `http://127.0.0.1:8000/admin/`.

---

## Frontend Setup

```powershell
cd E-commerce\frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

The frontend reads the API address from `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Production build

```powershell
npm run build
npm run start
```

---

## Environment Variables

### Backend (`backened/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `EMAIL_HOST_USER` | Yes | — | Gmail address used to send emails |
| `EMAIL_HOST_PASSWORD` | Yes | — | Gmail **app password** (not the account password) |
| `DB_NAME` | No | `ecommerce_db` | PostgreSQL database name |
| `DB_USER` | No | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | No | `admin` | PostgreSQL password |
| `DB_HOST` | No | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `CHATBOT_LLM_PROVIDER` | No | `openai` | `openai` or `none` |
| `OPENAI_API_KEY` | No | empty | Enables OpenAI for the chatbot; leave empty to run rules only |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model used by the chatbot |
| `CHATBOT_RATE_LIMIT` | No | `20/min` | Messages allowed per user (or per IP for guests) |
| `CHATBOT_MAX_MESSAGE_LENGTH` | No | `500` | Maximum characters per chat message |
| `CHATBOT_LLM_TIMEOUT` | No | `60` | Seconds to wait for OpenAI |
| `CHATBOT_LLM_RETRY_AFTER` | No | `60` | Seconds to pause OpenAI calls after a failure |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Django backend, e.g. `http://127.0.0.1:8000` |

---

## AI Shopping Assistant

### How it works

1. **Rule engine (always on).** Each message is first analysed for greetings, order questions, store topics, categories, brands, price ranges and sorting words. This is instant and needs no external service.
2. **OpenAI (optional).** If the rule engine is unsure (for example, "something to listen to music"), the message is sent to OpenAI to understand its meaning.
3. **Real data only.** Products and orders are always read from the database, and replies about them are built from that data, so prices and stock are never invented.

If OpenAI is not configured or is unavailable, the assistant continues to work using the rule engine.

### Configuration

| Mode | `.env` setting |
|---|---|
| Rules + OpenAI | `CHATBOT_LLM_PROVIDER=openai` and `OPENAI_API_KEY=sk-...` |
| Rules only (free, offline) | `CHATBOT_LLM_PROVIDER=none` or leave `OPENAI_API_KEY` empty |

### Editing store answers

Answers about delivery, returns, payment, cancellation, account and contact are stored in `backened/chatbot/services/knowledge.py`. **Update these to match your actual store policies** before going live.

### Example messages

| Message | Result |
|---|---|
| `show me shoes under 15000` | Shoes priced up to Rs. 15,000 |
| `clothing between 3k and 7k` | Clothing in that price range |
| `joote dikhao 10000 se kam` | Shoes under Rs. 10,000 |
| `cheapest bags` | Bags sorted by lowest price |
| `under 3000` (after a search) | Same category, new price limit |
| `where is my order?` | Latest order status (requires login) |
| `what is the delivery fee?` | Store delivery policy |

### Chat history

Conversations are saved in the `ChatSession` and `ChatMessage` models and can be reviewed in the Django admin panel under **Chatbot**.

### Sub categories in the assistant

Sub category names are understood automatically, so messages such as "show me sneakers", "kurta under 4000" or "smart watch under 10000" search the matching sub category.

### Opening the assistant from the frontend

Any component can open the chat window:

```js
window.dispatchEvent(new Event("openChatbot"));
```

---

## Product Drawer

Product cards across the site (home, products page and chatbot results) open a slide-over panel instead of navigating to a new page. It shows the image, price, stock, description, category and sub category, an **Add to cart** button and similar products. Press `Esc`, click outside, or use the close button to dismiss it.

Any component can open it:

```js
import { openProduct } from "@/app/components/ProductDrawer";

openProduct(product.id);
```

The `/products/[id]` page still exists for direct links.

---

## API Reference

All endpoints are relative to `NEXT_PUBLIC_API_URL`. Authenticated endpoints expect the header `Authorization: Bearer <access_token>`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/token/` | Log in; returns `access` and `refresh` tokens |
| POST | `/api/token/refresh/` | Get a new access token |
| POST | `/api/users/register/` | Create an account |
| GET | `/api/users/me/` | Current user details |
| POST | `/api/users/forgot-password/` | Send a password reset email |
| POST | `/api/users/reset-password/` | Set a new password |

### Catalogue

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products/` | List products. Filters: `?search=`, `?category=`, `?subcategory=`, `?ordering=popular\|newest\|price\|-price`, `?page=`, `?page_size=` (max 48) |
| GET | `/api/products/{id}/` | Product detail |
| GET | `/api/products/{id}/recommendations/` | Similar products |
| GET | `/api/categories/` | List categories (each includes its `subcategories`) |
| GET | `/api/subcategories/` | List sub categories (`?category=` to filter); not paginated |
| POST/PUT/PATCH/DELETE | `/api/products/`, `/api/categories/`, `/api/subcategories/` | Admin only |

### Cart and Orders

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/cart/` | User cart |
| GET/POST/PATCH/DELETE | `/api/cartitem/` | Cart items |
| GET/POST | `/api/order/` | Orders (creating an order uses the current cart) |
| GET | `/api/orderitem/` | Order items |

### Other

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/feedback/` | Product feedback with sentiment |
| GET/POST | `/api/contact/messages/` | Contact messages |
| GET | `/api/dashboard/stats/` | Admin statistics |
| GET | `/api/users/admin-users/` | User list (admin) |
| POST | `/chatbot/` | AI shopping assistant |

### Chatbot request and response

```http
POST /chatbot/
Content-Type: application/json
Authorization: Bearer <token>   (optional, enables order tracking)

{
  "message": "show me shoes under 15000",
  "session_id": null
}
```

```json
{
  "reply": "Here are 2 Shoes under Rs. 15,000 you might like:",
  "intent": "product_search",
  "products": [
    {
      "id": 1,
      "name": "Nike Air Max",
      "price": "14500.00",
      "price_display": "Rs. 14,500",
      "category": "Shoes",
      "stock": 10,
      "image": "http://127.0.0.1:8000/media/products/nike.jpg",
      "url": "/products/1"
    }
  ],
  "orders": [],
  "actions": [],
  "quick_replies": ["Cheaper Shoes", "Show me Bags"],
  "session_id": "3f6c1c1e-..."
}
```

Send the returned `session_id` with the next message to keep the conversation context.

---

## Running Tests

```powershell
cd E-commerce\backened
python manage.py test chatbot
```

The chatbot test suite covers product search, price parsing, Roman Urdu input, follow-up context, store answers, order tracking, privacy between users, invalid tokens and OpenAI fallback.

> Tests create a temporary PostgreSQL database, so the database user needs permission to create databases.

---

## Design System

All colours, fonts and shapes are defined as CSS variables at the top of `frontend/app/globals.css`. Changing these tokens updates the entire site.

| Token | Value | Usage |
|---|---|---|
| `--ink` | `#10282a` | Text, dark surfaces, footer |
| `--brand` | `#0f5c55` | Primary buttons, links |
| `--marigold` | `#f4b41a` | Price tags, highlights |
| `--paper` | `#f3f5f2` | Page background |
| `--surface` | `#ffffff` | Cards |
| `--line` | `#dfe5e3` | Borders |
| `--font-display` | Bricolage Grotesque | Headings, prices |
| `--font-body` | Figtree | Body text |
| `--r-sm` / `--r-md` / `--r-lg` | 8 / 12 / 20 px | Corner radius scale |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Could not open requirements file` | Run commands from `E-commerce\backened` (the folder containing `manage.py`), not the inner `backened\backened` folder. |
| `No module named 'django'` | Activate the virtual environment: `.\venv\Scripts\Activate.ps1` |
| `Activate.ps1 cannot be loaded` | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once. |
| Database connection error on `migrate` | Make sure PostgreSQL is running and the values in `.env` are correct. |
| Products do not load in the browser | Check that the backend is running and that `NEXT_PUBLIC_API_URL` matches its address. |
| CORS error in the browser console | Add your frontend URL to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in `backened/backened/settings.py`. |
| Fonts fail to load during `npm run build` | The build downloads fonts from Google; ensure internet access. |
| Chatbot says "sending messages too quickly" | The rate limit was reached; wait a minute or raise `CHATBOT_RATE_LIMIT`. |

---

## Security Notes

Before deploying to production:

- Move `SECRET_KEY` from `settings.py` into `.env` and generate a new value.
- Set `DEBUG = False` and fill in `ALLOWED_HOSTS`.
- Never commit `.env` to version control. Add it to `.gitignore`.
- If any email password or API key has been shared or committed, revoke it and create a new one.
- Update `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` to your production domain.
- Serve media files and the Django app through a production web server (for example, Gunicorn behind Nginx).
