"use client";

import { useEffect, useState } from "react";
import "./page.css";

import ProtectedRoute from "../components/ProtectedRoute";
import { apiFetch } from "../components/apiFetch";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] = useState(null);

  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");

  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/cartitem/");

      if (!response.ok) {
        throw new Error("Unable to load cart");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setCartItems(data);
      } else if (Array.isArray(data?.results)) {
        setCartItems(data.results);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error("Cart fetch error:", err);
      setError("Unable to load your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const increaseQuantity = async (id, currentQuantity) => {
    try {
      setUpdatingId(id);

      const response = await apiFetch(`/cartitem/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          quantity: currentQuantity + 1,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Increase quantity error:", text);
        throw new Error("Unable to increase quantity");
      }

      const updatedItem = await response.json();

      setCartItems((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: updatedItem.quantity,
              }
            : item
        )
      );

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Increase quantity error:", err);
      alert("Unable to update quantity. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const decreaseQuantity = async (id, currentQuantity) => {
    if (currentQuantity <= 1) {
      await removeItem(id);
      return;
    }

    try {
      setUpdatingId(id);

      const response = await apiFetch(`/cartitem/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          quantity: currentQuantity - 1,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Decrease quantity error:", text);
        throw new Error("Unable to decrease quantity");
      }

      const updatedItem = await response.json();

      setCartItems((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: updatedItem.quantity,
              }
            : item
        )
      );

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Decrease quantity error:", err);
      alert("Unable to update quantity. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (id) => {
    try {
      setUpdatingId(id);

      const response = await apiFetch(`/cartitem/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Remove item error:", text);
        throw new Error("Unable to remove item");
      }

      setCartItems((items) =>
        items.filter((item) => item.id !== id)
      );

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Remove item error:", err);
      alert("Unable to remove item. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getProductName = (item) => {
    return (
      item.product_name ||
      item.product?.name ||
      "Product"
    );
  };

  const getProductPrice = (item) => {
    return Number(
      item.price ??
        item.product_price ??
        item.product?.price ??
        0
    );
  };

  const totalItems = cartItems.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  const subtotal = cartItems.reduce(
    (total, item) =>
      total +
      getProductPrice(item) *
        Number(item.quantity || 0),
    0
  );

  const deliveryFee = subtotal > 0 ? 200 : 0;

  const total = subtotal + deliveryFee;

  const openCheckout = () => {
    setOrderError("");
    setOrderSuccess(false);
    setShowCheckout(true);
  };

  const closeCheckout = () => {
    if (confirmingOrder) {
      return;
    }

    setShowCheckout(false);
    setOrderError("");
  };

  const handleOverlayClick = (event) => {
    if (
      event.target === event.currentTarget &&
      !confirmingOrder
    ) {
      closeCheckout();
    }
  };

  const confirmOrder = async () => {
    if (!shippingAddress.trim()) {
      setOrderError("Please enter your shipping address.");
      return;
    }

    if (cartItems.length === 0) {
      setOrderError("Your cart is empty.");
      return;
    }

    try {
      setConfirmingOrder(true);
      setOrderError("");

      const response = await apiFetch("/order/", {
        method: "POST",
        body: JSON.stringify({
          total_amount: total.toFixed(2),
          shipping_address: shippingAddress.trim(),
        }),
      });

      const text = await response.text();

      console.log("Order response status:", response.status);
      console.log("Order response:", text);

      let data = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch (error) {
          console.error(
            "Order response is not JSON:",
            text
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            data.message ||
            "Unable to confirm order."
        );
      }

      setOrderSuccess(true);
setCartItems([]);

window.dispatchEvent(new Event("cartUpdated"));

setTimeout(async () => {
  setShowCheckout(false);
  setOrderSuccess(false);
  setShippingAddress("");
}, 1800);
    } catch (err) {
      console.error(
        "Order confirmation error:",
        err
      );

      setOrderError(
        err.message ||
          "Unable to confirm your order."
      );
    } finally {
      setConfirmingOrder(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="cart-page">
          <div className="cart-loading">
            Loading your cart...
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <main className="cart-page">
          <div className="cart-error">
            <h2>Something went wrong</h2>

            <p>{error}</p>

            <button
              type="button"
              onClick={fetchCartItems}
            >
              Try Again
            </button>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="cart-page">
        <div className="cart-container">

          <div className="cart-heading">
            <div>
              <p className="cart-label">
                YOUR SHOPPING CART
              </p>

              <h1>Shopping Cart</h1>

              <p>
                {totalItems}{" "}
                {totalItems === 1
                  ? "item"
                  : "items"}{" "}
                in your cart
              </p>
            </div>
          </div>

          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">
                🛒
              </div>

              <h2>Your cart is empty</h2>

              <p>
                Looks like you haven't added
                anything to your cart yet.
              </p>

              <button
                type="button"
                onClick={() =>
                  (window.location.href = "/")
                }
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-layout">

              <section className="cart-items-section">
                <div className="cart-items-header">
                  <span>Product</span>
                  <span>Price</span>
                  <span>Quantity</span>
                  <span>Total</span>
                  <span></span>
                </div>

                {cartItems.map((item) => {
                  const productName =
                    getProductName(item);

                  const price =
                    getProductPrice(item);

                  const quantity =
                    Number(item.quantity || 0);

                  const itemTotal =
                    price * quantity;

                  const isUpdating =
                    updatingId === item.id;

                  return (
                    <div
                      className="cart-item"
                      key={item.id}
                    >
                      <div className="cart-product">
                        <div className="cart-product-image">
                          🛍️
                        </div>

                        <div>
                          <h3>
                            {productName}
                          </h3>

                          {item.product_name && (
                            <span>
                              Product
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="cart-price">
                        Rs.{" "}
                        {price.toLocaleString()}
                      </div>

                      <div className="quantity-control">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            decreaseQuantity(
                              item.id,
                              quantity
                            )
                          }
                        >
                          −
                        </button>

                        <span>
                          {quantity}
                        </span>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            increaseQuantity(
                              item.id,
                              quantity
                            )
                          }
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-item-total">
                        Rs.{" "}
                        {itemTotal.toLocaleString()}
                      </div>

                      <button
                        type="button"
                        className="remove-item"
                        disabled={isUpdating}
                        onClick={() =>
                          removeItem(item.id)
                        }
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </section>

              <aside className="cart-summary">

                <h2>Order Summary</h2>

                <div className="summary-row">
                  <span>
                    Items ({totalItems})
                  </span>

                  <strong>
                    Rs.{" "}
                    {subtotal.toLocaleString()}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>Delivery</span>

                  <strong>
                    Rs.{" "}
                    {deliveryFee.toLocaleString()}
                  </strong>
                </div>

                <div className="summary-line"></div>

                <div className="summary-total">
                  <span>Total</span>

                  <strong>
                    Rs.{" "}
                    {total.toLocaleString()}
                  </strong>
                </div>

                <button
                  type="button"
                  className="checkout-button"
                  onClick={openCheckout}
                >
                  Proceed to Checkout
                </button>

                <button
                  type="button"
                  className="continue-shopping"
                  onClick={() =>
                    (window.location.href = "/")
                  }
                >
                  Continue Shopping
                </button>

              </aside>
            </div>
          )}
        </div>

        {showCheckout && (
          <div
            className="checkout-overlay"
            onMouseDown={handleOverlayClick}
          >
            <div
              className="checkout-receipt"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {!orderSuccess ? (
                <>
                  <button
                    type="button"
                    className="checkout-close"
                    onClick={closeCheckout}
                    disabled={confirmingOrder}
                  >
                    ×
                  </button>

                  <div className="receipt-header">
                    <p>SHOPEASE</p>

                    <h2>Order Summary</h2>

                    <span>
                      Please review your order
                    </span>
                  </div>

                  <div className="receipt-items">
                    {cartItems.map((item) => {
                      const price =
                        getProductPrice(item);

                      const quantity =
                        Number(
                          item.quantity || 0
                        );

                      const itemTotal =
                        price * quantity;

                      return (
                        <div
                          className="receipt-item"
                          key={item.id}
                        >
                          <div>
                            <strong>
                              {getProductName(
                                item
                              )}
                            </strong>

                            <span>
                              Qty: {quantity}
                            </span>
                          </div>

                          <strong>
                            Rs.{" "}
                            {itemTotal.toLocaleString()}
                          </strong>
                        </div>
                      );
                    })}
                  </div>

                  <div className="receipt-line"></div>

                  <div className="receipt-row">
                    <span>Subtotal</span>

                    <strong>
                      Rs.{" "}
                      {subtotal.toLocaleString()}
                    </strong>
                  </div>

                  <div className="receipt-row">
                    <span>Delivery</span>

                    <strong>
                      Rs.{" "}
                      {deliveryFee.toLocaleString()}
                    </strong>
                  </div>

                  <div className="receipt-total">
                    <span>Total</span>

                    <strong>
                      Rs.{" "}
                      {total.toLocaleString()}
                    </strong>
                  </div>

                  <div className="shipping-section">
                    <label htmlFor="shippingAddress">
                      Shipping Address
                    </label>

                    <textarea
                      id="shippingAddress"
                      value={shippingAddress}
                      onChange={(event) =>
                        setShippingAddress(
                          event.target.value
                        )
                      }
                      placeholder="Enter your complete shipping address"
                      rows={4}
                      disabled={confirmingOrder}
                    />
                  </div>

                  {orderError && (
                    <p className="order-error">
                      {orderError}
                    </p>
                  )}

                  <div className="checkout-actions">
                    <button
                      type="button"
                      className="cancel-order-btn"
                      onClick={closeCheckout}
                      disabled={confirmingOrder}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="confirm-order-btn"
                      onClick={confirmOrder}
                      disabled={confirmingOrder}
                    >
                      {confirmingOrder
                        ? "Confirming..."
                        : "Confirm Order"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="order-success">
                  <div className="success-icon">
                    ✓
                  </div>

                  <h2>
                    Order Confirmed!
                  </h2>

                  <p>
                    Your order has been placed
                    successfully.
                  </p>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}