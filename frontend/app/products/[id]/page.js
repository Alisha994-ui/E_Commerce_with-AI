"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "./page.css";

import AddToCartButton from "../../components/addcart";
import { apiFetch } from "../../components/apiFetch";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);

  const [error, setError] = useState("");

  const getImageUrl = (image) => {
    if (!image) {
      return null;
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    if (image.startsWith("/")) {
      return `http://localhost:8000${image}`;
    }

    return `http://localhost:8000/${image}`;
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        `/products/${productId}/`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }

      const data = await response.json();

      console.log("Product details:", data);

      setProduct(data);
    } catch (err) {
      console.error("Product details error:", err);

      setError(
        "Unable to load this product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setRecommendationsLoading(true);

      const response = await apiFetch(
        `/products/${productId}/recommendations/`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch recommendations"
        );
      }

      const data = await response.json();

      console.log(
        "Product recommendations:",
        data
      );

      setRecommendations(data);
    } catch (err) {
      console.error(
        "Recommendation error:",
        err
      );

      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  useEffect(() => {
    if (!productId) {
      return;
    }

    setProduct(null);
    setRecommendations([]);

    fetchProduct();
    fetchRecommendations();
  }, [productId]);

  if (loading) {
    return (
        <main className="product-details-page">
          <div className="product-details-container">
            <div className="product-details-loading">
              <div className="details-skeleton details-image-skeleton"></div>

              <div className="details-skeleton-content">
                <div className="details-skeleton details-small"></div>

                <div className="details-skeleton details-title"></div>

                <div className="details-skeleton details-description"></div>

                <div className="details-skeleton details-description short"></div>

                <div className="details-skeleton details-price"></div>

                <div className="details-skeleton details-button"></div>
              </div>
            </div>
          </div>
        </main>
    );
  }

  if (error || !product) {
    return (
      <>
        <main className="product-details-page">
          <div className="product-error">
            <div className="product-error-icon">
              !
            </div>

            <h1>
              Product Not Found
            </h1>

            <p>
              {error ||
                "This product could not be found."}
            </p>

            <button
              className="back-button"
              onClick={() =>
                router.push("/product")
              }
            >
              ← Back to Products
            </button>
          </div>
        </main>
      </>
    );
  }

  const isInStock = product.stock > 0;

  return (
    <>
      <main className="product-details-page">
        <div className="product-details-container">

          <div className="product-breadcrumb">

            <button
              onClick={() =>
                router.push("/product")
              }
            >
              Products
            </button>

            <span>
              {" "}
              /{" "}
            </span>

            <span>
              {product.name}
            </span>

          </div>

          <section className="product-detail-card">

            <div className="product-detail-image-section">

              <div className="product-detail-image-wrapper">

                {product.image ? (
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="product-detail-image"
                  />
                ) : (
                  <div className="product-detail-no-image">
                    <span>
                      🛍️
                    </span>

                    <p>
                      No Image Available
                    </p>
                  </div>
                )}

                <div className="product-detail-badge">
                  PRODUCT
                </div>

              </div>

            </div>

            <div className="product-detail-info">

              <span className="detail-category">
                {product.category_name ||
                  "General"}
              </span>

              <h1 className="detail-product-name">
                {product.name}
              </h1>

              <p className="detail-description">
                {product.description ||
                  "A quality product from our collection."}
              </p>

              <div className="detail-divider"></div>

              <div className="detail-price-section">

                <span className="detail-price-label">
                  PRICE
                </span>

                <span className="detail-price">
                  Rs.
                  {Number(
                    product.price
                  ).toFixed(2)}
                </span>

              </div>

              <div className="detail-stock">

                <span
                  className={
                    isInStock
                      ? "stock-dot in-stock"
                      : "stock-dot out-stock"
                  }
                ></span>

                <span>
                  {isInStock
                    ? `${product.stock} items available`
                    : "Out of stock"}
                </span>

              </div>

              <div className="detail-actions">

                {isInStock ? (
                  <AddToCartButton
                    productId={product.id}
                    className="add-cart-button"
                    label="Add to cart"
                    onCartAdded={fetchProduct}
                  />
                ) : (
                  <button
                    className="add-cart-button"
                    disabled
                  >
                    Out of Stock
                  </button>
                )}

                <button
                  className="back-products-button"
                  onClick={() =>
                    router.push("/product")
                  }
                >
                  ← Continue Shopping
                </button>

              </div>

              <div className="product-features">

                <div className="feature-item">

                  <div className="feature-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Quality Product
                    </strong>

                    <span>
                      Carefully selected for you
                    </span>
                  </div>

                </div>

                <div className="feature-item">

                  <div className="feature-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Available Now
                    </strong>

                    <span>
                      Ready to order
                    </span>
                  </div>

                </div>

                <div className="feature-item">

                  <div className="feature-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Secure Shopping
                    </strong>

                    <span>
                      Safe and reliable
                    </span>
                  </div>

                </div>

              </div>

            </div>

          </section>

          <section className="product-description-section">

            <div className="description-heading">

              <span>
                PRODUCT DETAILS
              </span>

              <h2>
                About this product
              </h2>

            </div>

            <p>
              {product.description ||
                "This product is part of our carefully selected collection. We focus on providing quality products that are suitable for your everyday needs."}
            </p>

          </section>

          {!recommendationsLoading &&
            recommendations.length > 0 && (

              <section className="recommendations-section">

                <div className="recommendations-heading">

                  <span>
                    AI RECOMMENDATIONS
                  </span>

                  <h2>
                    You May Also Like
                  </h2>

                  <p>
                    Products selected based on
                    similarity to this product.
                  </p>

                </div>

                <div className="recommendations-grid">

                  {recommendations.map(
                    (item) => (

                      <div
                        key={item.id}
                        className="recommendation-card"
                        onClick={() =>
                          router.push(
                            `/products/${item.id}`
                          )
                        }
                      >

                        <div className="recommendation-image-wrapper">

                          {item.image ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="recommendation-image"
                            />
                          ) : (
                            <div className="recommendation-no-image">
                              🛍️
                            </div>
                          )}

                        </div>

                        <div className="recommendation-info">

                          <span className="recommendation-category">
                            {item.category_name ||
                              "General"}
                          </span>

                          <h3>
                            {item.name}
                          </h3>

                          <p className="recommendation-description">
                            {item.description}
                          </p>

                          <div className="recommendation-bottom">

                            <span className="recommendation-price">
                              Rs.
                              {Number(
                                item.price
                              ).toFixed(2)}
                            </span>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </section>
            )}

        </div>
      </main>
    </>
  );
}