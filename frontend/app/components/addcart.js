"use client";

import { useState } from "react";
import { apiFetch } from "./apiFetch";

export default function AddToCartButton({
  productId,
  className = "add-cart-button",
  label = "+",
  onCartAdded,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddToCart = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please log in first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/cartitem/", {
        method: "POST",
        body: JSON.stringify({
          product: productId,
          quantity: 1,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || "Unable to add product to cart."
        );
      }

      // Update the navbar cart counter immediately
      window.dispatchEvent(new Event("cartUpdated"));

      if (onCartAdded) {
        onCartAdded(data);
      }
    } catch (err) {
      console.error("ADD TO CART ERROR:", err);
      setError(err.message || "Unable to add product to cart.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-cart-wrapper">
      <button
        type="button"
        className={className}
        onClick={handleAddToCart}
        disabled={loading}
        aria-label="Add to cart"
      >
        {loading ? "..." : label}
      </button>

      {error && <p className="cart-error-message">{error}</p>}
    </div>
  );
}
