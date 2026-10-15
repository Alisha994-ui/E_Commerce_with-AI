"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import AddToCartButton from "./addcart";
import { apiFetch } from "./apiFetch";
import "./productDrawer.css";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

/**
 * Open the product drawer from anywhere:
 *   import { openProduct } from "./components/ProductDrawer";
 *   openProduct(product.id);
 */
export function openProduct(productId) {
  window.dispatchEvent(
    new CustomEvent("openProduct", { detail: { id: productId } })
  );
}

const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${API_URL}${image.startsWith("/") ? image : `/${image}`}`;
};

const formatPrice = (price) => `Rs. ${Number(price || 0).toLocaleString()}`;

export default function ProductDrawer() {
  const [productId, setProductId] = useState(null);
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  const closeButtonRef = useRef(null);
  const bodyRef = useRef(null);

  const isOpen = productId !== null;

  const close = useCallback(() => {
    setProductId(null);
    setAdded(false);
  }, []);

  // Listen for openProduct events
  useEffect(() => {
    const handleOpen = (event) => {
      const id = event.detail?.id;
      if (id === undefined || id === null) return;
      setAdded(false);
      setProductId(id);
    };

    window.addEventListener("openProduct", handleOpen);
    return () => window.removeEventListener("openProduct", handleOpen);
  }, []);

  // Load the product and similar products
  useEffect(() => {
    if (productId === null) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setProduct(null);
      setSimilar([]);

      try {
        const response = await apiFetch(`/products/${productId}/`);
        if (!response.ok) throw new Error("This product could not be loaded.");
        const data = await response.json();
        if (!cancelled) setProduct(data);

        const similarResponse = await apiFetch(
          `/products/${productId}/recommendations/`
        );
        if (similarResponse.ok) {
          const similarData = await similarResponse.json();
          if (!cancelled) {
            setSimilar(Array.isArray(similarData) ? similarData.slice(0, 4) : []);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    bodyRef.current?.scrollTo({ top: 0 });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Escape to close, lock page scroll, move focus into the drawer
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event) => {
      if (event.key === "Escape") close();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, close]);

  const handleAdded = () => {
    setAdded(true);
    setProduct((current) =>
      current ? { ...current, stock: Math.max(0, current.stock - 1) } : current
    );
  };

  const inStock = product && product.stock > 0 && product.is_active !== false;

  return (
    <div
      className={`product-drawer-root ${isOpen ? "open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="product-drawer-overlay" onClick={close} />

      <aside
        className="product-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={product ? product.name : "Product details"}
      >
        <div className="product-drawer-header">
          <span className="product-drawer-breadcrumb">
            {product
              ? [product.category_name, product.subcategory_name]
                  .filter(Boolean)
                  .join(" / ")
              : "Product"}
          </span>

          <button
            ref={closeButtonRef}
            type="button"
            className="product-drawer-close"
            onClick={close}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="product-drawer-body" ref={bodyRef}>
          {loading && (
            <div className="product-drawer-skeleton">
              <div className="pd-skeleton pd-skeleton-image" />
              <div className="pd-skeleton pd-skeleton-line wide" />
              <div className="pd-skeleton pd-skeleton-line" />
              <div className="pd-skeleton pd-skeleton-line short" />
            </div>
          )}

          {!loading && error && (
            <div className="product-drawer-error">
              <p>{error}</p>
              <button type="button" onClick={close}>
                Close
              </button>
            </div>
          )}

          {!loading && product && (
            <>
              <div className="product-drawer-image">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImageUrl(product.image)} alt={product.name} />
                ) : (
                  <span aria-hidden="true">🛍️</span>
                )}
              </div>

              <h2 className="product-drawer-title">{product.name}</h2>

              <div className="product-drawer-price-row">
                <span className="price-tag">{formatPrice(product.price)}</span>

                <span className={`product-drawer-stock ${inStock ? "in" : "out"}`}>
                  {inStock
                    ? product.stock <= 5
                      ? `Only ${product.stock} left`
                      : "In stock"
                    : "Out of stock"}
                </span>
              </div>

              {product.description && (
                <p className="product-drawer-description">{product.description}</p>
              )}

              <dl className="product-drawer-facts">
                <div>
                  <dt>Category</dt>
                  <dd>{product.category_name || "—"}</dd>
                </div>
                {product.subcategory_name && (
                  <div>
                    <dt>Type</dt>
                    <dd>{product.subcategory_name}</dd>
                  </div>
                )}
                <div>
                  <dt>Delivery</dt>
                  <dd>Flat Rs. 200</dd>
                </div>
              </dl>

              {similar.length > 0 && (
                <section className="product-drawer-similar">
                  <h3>Similar products</h3>

                  <div className="product-drawer-similar-list">
                    {similar.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="similar-item"
                        onClick={() => openProduct(item.id)}
                      >
                        <span className="similar-image">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={getImageUrl(item.image)} alt="" />
                          ) : (
                            <span aria-hidden="true">🛍️</span>
                          )}
                        </span>
                        <span className="similar-name">{item.name}</span>
                        <span className="similar-price">{formatPrice(item.price)}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {!loading && product && (
          <div className="product-drawer-footer">
            {inStock ? (
              <AddToCartButton
                key={product.id}
                productId={product.id}
                className="product-drawer-add"
                label={added ? "Added ✓ Add another" : "Add to cart"}
                onCartAdded={handleAdded}
              />
            ) : (
              <button type="button" className="product-drawer-add" disabled>
                Out of stock
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
