"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AddToCartButton from "./components/addcart";
import { apiFetch } from "./components/apiFetch";
import { openProduct } from "./components/ProductDrawer";
import "./page.css";

export default function Home() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [loginMessage, setLoginMessage] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const loginMessageTimer = useRef(null);
  const cartMessageTimer = useRef(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

  const getImageUrl = (image) => {
    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `${API_URL}${image.startsWith("/") ? image : `/${image}`}`;
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");

    setIsLoggedIn(Boolean(accessToken));

    return () => {
      if (loginMessageTimer.current) {
        clearTimeout(loginMessageTimer.current);
      }

      if (cartMessageTimer.current) {
        clearTimeout(cartMessageTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);

        const response = await apiFetch("/categories/");

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();

        setCategories(data.results || data || []);
      } catch (error) {
        console.error("Category fetch error:", error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);

        const response = await apiFetch("/products/?ordering=popular");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        setProducts(data.results || data || []);
      } catch (error) {
        console.error("Product fetch error:", error);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const showLoginMessage = () => {
    setLoginMessage(true);

    if (loginMessageTimer.current) {
      clearTimeout(loginMessageTimer.current);
    }

    loginMessageTimer.current = setTimeout(() => {
      setLoginMessage(false);
    }, 1800);
  };

  const showCartMessage = () => {
    setCartMessage("Product added to your cart.");

    setCartItems((previous) => previous + 1);

    if (cartMessageTimer.current) {
      clearTimeout(cartMessageTimer.current);
    }

    cartMessageTimer.current = setTimeout(() => {
      setCartMessage("");
    }, 1800);
  };

  const requireLogin = () => {
    if (!isLoggedIn) {
      showLoginMessage();
      return false;
    }

    return true;
  };

  const handleProductDetails = (productId) => {
    openProduct(productId);
  };

  const handleCategory = (categoryId) => {
    if (!requireLogin()) return;

    router.push(`/product?category=${categoryId}`);
  };

  const handleShopNow = () => {
    document
      .getElementById("products")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  const handleExploreCategories = () => {
    if (!requireLogin()) return;

    router.push("/categories");
  };

  const handleViewAllProducts = () => {
    if (!requireLogin()) return;

    router.push("/product");
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setCartItems(0);

    router.push("/");
  };

  const handleAccount = () => {
    if (isLoggedIn) {
      router.push("/profile");
    } else {
      router.push("/login");
    }
  };

  const featuredProduct = products[0];

  return (
    <main className="home-page">

      {loginMessage && (
        <div className="login-required-message">
          <div className="message-icon">
            🔒
          </div>

          <div className="message-content">
            <strong>
              Login Required
            </strong>

            <span>
              Please login to continue.
            </span>
          </div>
        </div>
      )}

      {cartMessage && (
        <div className="cart-success-message">
          <div className="cart-success-icon">
            ✓
          </div>

          <div className="cart-success-content">
            <strong>
              Added to Cart
            </strong>

            <span>
              {cartMessage}
            </span>
          </div>
        </div>
      )}

      {/* HERO */}

      {/* HERO */}
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Good things,
            <br />
            fairly priced.
          </h1>

          <p>
            {categories.length > 0
              ? `Browse ${categories
                  .slice(0, 4)
                  .map((category) => category.name.toLowerCase())
                  .join(", ")} and more.`
              : "Browse our latest collection."}{" "}
            Prices in rupees, a flat Rs. 200 delivery fee, and every
            order tracked from your profile.
          </p>

          <div className="hero-buttons">
            <button
              type="button"
              className="primary-button"
              onClick={handleViewAllProducts}
            >
              Shop all products
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleExploreCategories}
            >
              Browse categories
            </button>
          </div>

          <ul className="hero-facts">
            <li>
              <strong>Rs. 200</strong>
              <span>flat delivery fee</span>
            </li>
            <li>
              <strong>Live</strong>
              <span>order tracking</span>
            </li>
            <li>
              <strong>AI</strong>
              <span>shopping assistant</span>
            </li>
          </ul>
        </div>

        <div className="hero-feature">
          {featuredProduct ? (
            <button
              type="button"
              className="hero-feature-card"
              onClick={() => handleProductDetails(featuredProduct.id)}
            >
              <span className="hero-feature-label">Featured</span>

              <span className="hero-feature-image">
                {featuredProduct.image ? (
                  <img
                    src={getImageUrl(featuredProduct.image)}
                    alt={featuredProduct.name}
                  />
                ) : (
                  <span aria-hidden="true">🛍️</span>
                )}
              </span>

              <span className="hero-feature-meta">
                <span>
                  {featuredProduct.category_name ||
                    featuredProduct.category?.name ||
                    "Featured"}
                </span>
                <strong>{featuredProduct.name}</strong>
              </span>

              <span className="price-tag">
                Rs. {Number(featuredProduct.price || 0).toLocaleString()}
              </span>
            </button>
          ) : (
            <div className="hero-feature-card is-empty">
              {productsLoading ? "Loading..." : "New products coming soon."}
            </div>
          )}
        </div>
      </section>


      {/* CATEGORIES */}

      <section
        className="categories-section"
        id="categories"
      >

        <div className="section-heading">

          <div>

            <h2>
              Shop by category
            </h2>

          </div>

          <button
            type="button"
            className="view-all-button"
            onClick={handleExploreCategories}
          >
            View all
          </button>

        </div>


        <div className="categories-grid">

          {categoriesLoading ? (

            <div className="section-message">
              Loading categories...
            </div>

          ) : categories.length > 0 ? (

            categories.slice(0, 4).map((category) => (

              <div
                className="category-card"
                key={category.id}
                onClick={() =>
                  handleCategory(category.id)
                }
              >

                <div className="category-icon">

                  {category.image ? (

                    <img
                      src={getImageUrl(category.image)}
                      alt={category.name}
                    />

                  ) : (

                    <span>
                      {category.icon || "🛍️"}
                    </span>

                  )}

                </div>

                <h3>
                  {category.name}
                </h3>

                <p>
                  {category.description ||
                    "Explore products from this category."}
                </p>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCategory(category.id);
                  }}
                >
                  Explore
                </button>

              </div>

            ))

          ) : (

            <div className="section-message">
              No categories available.
            </div>

          )}

        </div>

      </section>


      {/* PRODUCTS */}

      <section
        className="products-section"
        id="products"
      >

        <div className="products-inner">

          <div className="section-heading">

            <div>

              <h2>
                Popular right now
              </h2>

            </div>

            <button
              type="button"
              className="view-all-button"
              onClick={handleViewAllProducts}
            >
              View all
            </button>

          </div>


          <div className="products-grid">

            {productsLoading ? (

              <div className="section-message">
                Loading products...
              </div>

            ) : products.length > 0 ? (

              products.slice(0, 4).map((product) => (

                <div
                  className="product-card"
                  key={product.id}
                >

                  <div
                    className="product-image"
                    onClick={() => handleProductDetails(product.id)}
                  >

                    {product.image ? (

                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                      />

                    ) : (

                      <span>
                        🛍️
                      </span>

                    )}

                  </div>


                  <div className="product-info">

                    <span className="product-category">
                      {product.category_name ||
                        product.category?.name ||
                        "PRODUCT"}
                    </span>

                    <h3>
                      {product.name}
                    </h3>

                    <div className="product-bottom">

                      <strong className="product-price">
                        Rs.{" "}
                        {Number(
                          product.price || 0
                        ).toLocaleString()}
                      </strong>

                      <AddToCartButton
                        productId={product.id}
                        onCartAdded={showCartMessage}
                      />

                    </div>

                    <button
                      type="button"
                      className="details-button"
                      onClick={() =>
                        handleProductDetails(
                          product.id
                        )
                      }
                    >
                      View details
                    </button>

                  </div>

                </div>

              ))

            ) : (

              <div className="section-message">
                No products available.
              </div>

            )}

          </div>

        </div>

      </section>


      {/* CTA */}

      <section className="cta-section">
        <div className="cta-content">
          <h2>Not sure what to pick?</h2>

          <p>
            Tell ShopEase AI your budget and what you need — it searches
            the store and shows you real products and prices.
          </p>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("openChatbot"))}
          >
            Ask the assistant
          </button>
        </div>
      </section>


      {/* FOOTER */}

      <footer className="footer">

        <div className="footer-container">

          <div className="footer-column brand-column">

            <div className="footer-logo">

              <span className="logo-mark" aria-hidden="true">S</span>
              ShopEase

            </div>

            <p>
              Your one-stop destination for
              everything you love.
            </p>

          </div>


          <div className="footer-column">

            <h4>
              Quick Links
            </h4>

            <button
              type="button"
              onClick={() => router.push("/")}
            >
              Home
            </button>

            <button
              type="button"
              onClick={handleExploreCategories}
            >
              Categories
            </button>

            <button
              type="button"
              onClick={handleViewAllProducts}
            >
              Products
            </button>

          </div>


          <div className="footer-column">

            <h4>
              Account
            </h4>

            {!isLoggedIn ? (

              <>
                <button
                  type="button"
                  onClick={() =>
                    router.push("/login")
                  }
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/signup")
                  }
                >
                  Sign Up
                </button>
              </>

            ) : (

              <>
                <button
                  type="button"
                  onClick={() =>
                    router.push("/profile")
                  }
                >
                  Profile
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                >
                  Logout
                </button>

                <button type="button" onClick={() => router.push("/contact")} >
                  Contact us
                </button>
              </>

            )}

          </div>


          <div className="footer-column">

            <h4>
              Contact
            </h4>

            <p>
              📧 support@shopease.com
            </p>

            <p>
              📞 +92 300 1234567
            </p>

          </div>

        </div>


        <div className="footer-bottom">

          <span>
            © 2026 ShopEase. All rights reserved.
          </span>

          <span>
            Built with Next.js & Django
          </span>

        </div>

      </footer>
    </main>
  );
}