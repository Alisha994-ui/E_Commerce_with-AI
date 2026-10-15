"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { apiFetch } from "./apiFetch";
import { openProduct } from "./ProductDrawer";
import "./chatbot.css";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const STORAGE_KEY = "shopease_chat_messages";
const SESSION_KEY = "shopease_chat_session";
const MAX_STORED_MESSAGES = 40;

// Pages where the floating chatbot should not appear.
const HIDDEN_PATHS = ["/dashboard", "/admin"];

const WELCOME_MESSAGES = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Hi! 👋 I'm ShopEase AI.",
  },
  {
    id: "welcome-2",
    sender: "bot",
    text: "I can help you find products, compare prices, track your orders and answer questions about delivery and returns.",
  },
];

const STARTER_SUGGESTIONS = [
  { label: "👟 Shoes under 15,000", message: "Show me shoes under 15000" },
  { label: "⭐ Best products", message: "What are the best products?" },
  { label: "📦 Track my order", message: "Where is my order?" },
  { label: "🚚 Delivery fee", message: "What is the delivery fee?" },
];

const STATUS_CLASS = {
  pending: "status-pending",
  processing: "status-processing",
  shipped: "status-shipped",
  delivered: "status-delivered",
  cancelled: "status-cancelled",
};

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return `${API_URL}${image.startsWith("/") ? image : `/${image}`}`;
};

const formatPrice = (product) =>
  product.price_display ||
  `Rs. ${Number(product.price || 0).toLocaleString()}`;

// =========================================================
// PRODUCT CARD
// =========================================================

function ChatProductCard({ product, onNavigate }) {
  const [state, setState] = useState("idle"); // idle | adding | added | error
  const [error, setError] = useState("");

  const addToCart = async () => {
    if (!localStorage.getItem("access_token")) {
      setState("error");
      setError("Please log in to add items to your cart.");
      return;
    }

    setState("adding");
    setError("");

    try {
      const response = await apiFetch("/cartitem/", {
        method: "POST",
        body: JSON.stringify({ product: product.id, quantity: 1 }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          data.error ||
          data.detail ||
          (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) ||
          "Unable to add this product to your cart.";
        throw new Error(message);
      }

      window.dispatchEvent(new Event("cartUpdated"));
      setState("added");
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      setState("error");
      setError(err.message || "Unable to add this product to your cart.");
    }
  };

  const imageUrl = getImageUrl(product.image);

  // Open the product in the slide-over drawer instead of a new page.
  const showDetails = () => {
    openProduct(product.id);
    onNavigate();
  };

  return (
    <div className="chat-product-card">
      <button type="button" className="chat-product-image" onClick={showDetails}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span aria-hidden="true">🛍️</span>
        )}
      </button>

      <div className="chat-product-body">
        <span className="chat-product-category">{product.category}</span>

        <button type="button" className="chat-product-name" onClick={showDetails}>
          {product.name}
        </button>

        <strong className="chat-product-price">{formatPrice(product)}</strong>

        {product.stock > 0 && product.stock <= 5 && (
          <span className="chat-product-stock">Only {product.stock} left</span>
        )}

        <div className="chat-product-actions">
          <button type="button" className="chat-product-view" onClick={showDetails}>
            View
          </button>

          <button
            type="button"
            className={`chat-product-add ${state === "added" ? "added" : ""}`}
            onClick={addToCart}
            disabled={state === "adding" || state === "added"}
          >
            {state === "adding"
              ? "Adding..."
              : state === "added"
                ? "Added ✓"
                : "Add to cart"}
          </button>
        </div>

        {state === "error" && (
          <p className="chat-product-error">
            {error}{" "}
            {error.toLowerCase().includes("log in") && (
              <Link href="/login" onClick={onNavigate}>
                Log in
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// =========================================================
// ORDER CARD
// =========================================================

function ChatOrderCard({ order }) {
  return (
    <div className="chat-order-card">
      <div className="chat-order-top">
        <strong>Order #{order.id}</strong>
        <span className={`chat-order-status ${STATUS_CLASS[order.status] || ""}`}>
          {order.status_display}
        </span>
      </div>

      <div className="chat-order-meta">
        <span>{order.created_at}</span>
        <span>{order.total_display}</span>
      </div>

      {order.items?.length > 0 && (
        <p className="chat-order-items">{order.items.join(", ")}</p>
      )}
    </div>
  );
}

// =========================================================
// CHATBOT
// =========================================================

export default function Chatbot() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState(WELCOME_MESSAGES);
  const [loaded, setLoaded] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ---------------------------------------------------------
  // Restore the conversation after a page refresh
  // ---------------------------------------------------------

  useEffect(() => {
    try {
      const storedMessages = sessionStorage.getItem(STORAGE_KEY);
      const storedSession = sessionStorage.getItem(SESSION_KEY);

      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed);
        }
      }

      if (storedSession) {
        setSessionId(storedSession);
      }
    } catch {
      // Ignore broken storage and start fresh.
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))
      );

      if (sessionId) {
        sessionStorage.setItem(SESSION_KEY, sessionId);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Storage full or blocked: the chat still works in memory.
    }
  }, [messages, sessionId, loaded]);

  // Other parts of the site can open the assistant:
  // window.dispatchEvent(new Event("openChatbot"))
  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener("openChatbot", open);
    return () => window.removeEventListener("openChatbot", open);
  }, []);

  // ---------------------------------------------------------
  // Scroll, focus and keyboard
  // ---------------------------------------------------------

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // ---------------------------------------------------------
  // Send a message
  // ---------------------------------------------------------

  const sendMessage = useCallback(
    async (text) => {
      const trimmedMessage = (text ?? message).trim();

      if (!trimmedMessage || isTyping) return;

      setMessages((previous) => [
        ...previous,
        { id: createId(), sender: "user", text: trimmedMessage },
      ]);
      setMessage("");
      setIsTyping(true);

      try {
        const headers = { "Content-Type": "application/json" };
        const token = localStorage.getItem("access_token");

        // Lets the bot answer "where is my order?" for logged-in users.
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/chatbot/`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: trimmedMessage,
            session_id: sessionId,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (data.session_id) setSessionId(data.session_id);

        if (!response.ok) {
          const errorText =
            response.status === 429
              ? "You're sending messages too quickly. Please wait a moment and try again."
              : data.error || data.detail || "Something went wrong. Please try again.";
          throw new Error(errorText);
        }

        setMessages((previous) => [
          ...previous,
          {
            id: createId(),
            sender: "bot",
            text: data.reply,
            products: data.products || [],
            orders: data.orders || [],
            actions: data.actions || [],
            quickReplies: data.quick_replies || [],
          },
        ]);
      } catch (error) {
        console.error("Chatbot error:", error);

        const isNetworkError = error instanceof TypeError;

        setMessages((previous) => [
          ...previous,
          {
            id: createId(),
            sender: "bot",
            isError: true,
            text: isNetworkError
              ? "I can't reach the server right now. Please check your connection and try again."
              : error.message,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [message, isTyping, sessionId]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const clearChat = () => {
    setMessages(WELCOME_MESSAGES);
    setSessionId(null);
    setMessage("");
    inputRef.current?.focus();
  };

  // Close the panel on small screens when the user opens a product page.
  const handleNavigate = () => {
    if (window.innerWidth <= 600) setIsOpen(false);
  };

  if (HIDDEN_PATHS.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  const hasUserMessages = messages.some((item) => item.sender === "user");
  const lastBotIndex = messages.reduce(
    (last, item, index) => (item.sender === "bot" ? index : last),
    -1
  );

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="chatbot-floating-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open ShopEase AI chat"
        >
          <span className="chatbot-icon" aria-hidden="true">🤖</span>

          <span className="chatbot-button-content">
            <span className="chatbot-button-title">Chat with AI</span>
            <span className="chatbot-button-subtitle">Your shopping assistant</span>
          </span>

          <span className="chatbot-online-dot" aria-hidden="true"></span>
        </button>
      )}

      {isOpen && (
        <section
          className="chatbot-container"
          role="dialog"
          aria-label="ShopEase AI chat"
        >
          {/* HEADER */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar" aria-hidden="true">
                🤖
                <span className="avatar-online"></span>
              </div>

              <div className="chatbot-header-info">
                <h3>ShopEase AI</h3>
                <p>
                  <span className="status-dot"></span>
                  {isTyping ? "Typing..." : "Online"}
                </p>
              </div>
            </div>

            <div className="chatbot-header-actions">
              {hasUserMessages && (
                <button
                  type="button"
                  className="chatbot-header-button"
                  onClick={clearChat}
                  title="Start a new chat"
                  aria-label="Start a new chat"
                >
                  ↺
                </button>
              )}

              <button
                type="button"
                className="chatbot-close-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="chatbot-messages" aria-live="polite">
            {!hasUserMessages && (
              <>
                <div className="chatbot-welcome">
                  <div className="welcome-icon" aria-hidden="true">✨</div>
                  <div>
                    <h4>How can I help you?</h4>
                    <p>Ask me about products, prices, your orders or delivery.</p>
                  </div>
                </div>

                <div className="chatbot-suggestions">
                  {STARTER_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => sendMessage(suggestion.message)}
                      disabled={isTyping}
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((item, index) => (
              <div key={item.id || index} className="chat-message-group">
                <div className={`chat-message-row ${item.sender}`}>
                  {item.sender === "bot" && (
                    <div className="message-avatar" aria-hidden="true">🤖</div>
                  )}

                  <div
                    className={`chat-message ${item.sender} ${item.isError ? "error" : ""}`}
                  >
                    {item.text}
                  </div>
                </div>

                {item.products?.length > 0 && (
                  <div className="chat-products">
                    {item.products.map((product) => (
                      <ChatProductCard
                        key={product.id}
                        product={product}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                )}

                {item.orders?.length > 0 && (
                  <div className="chat-orders">
                    {item.orders.map((order) => (
                      <ChatOrderCard key={order.id} order={order} />
                    ))}
                  </div>
                )}

                {item.actions?.length > 0 && (
                  <div className="chat-actions">
                    {item.actions.map((action) => (
                      <Link
                        key={action.href + action.label}
                        href={action.href}
                        className="chat-action-link"
                        onClick={handleNavigate}
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                )}

                {index === lastBotIndex &&
                  !isTyping &&
                  item.quickReplies?.length > 0 && (
                    <div className="chat-quick-replies">
                      {item.quickReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => sendMessage(reply)}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}

            {isTyping && (
              <div className="chat-message-row bot">
                <div className="message-avatar" aria-hidden="true">🤖</div>
                <div className="typing-message" aria-label="ShopEase AI is typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <form className="chatbot-input-section" onSubmit={handleSubmit}>
            <div className="chatbot-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask me anything..."
                value={message}
                maxLength={500}
                onChange={(event) => setMessage(event.target.value)}
                aria-label="Type your message"
              />

              <button
                type="submit"
                className="chatbot-send-button"
                disabled={!message.trim() || isTyping}
                aria-label="Send message"
              >
                ➤
              </button>
            </div>

            <p className="chatbot-footer-text">
              ✨ Powered by ShopEase AI
            </p>
          </form>
        </section>
      )}
    </>
  );
}
