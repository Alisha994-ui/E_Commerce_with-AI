"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import "./navbar.css";
import { apiFetch } from "./apiFetch";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartItems, setCartItems] = useState(0);
  const [loginMessage, setLoginMessage] = useState(false);

  const [categories, setCategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] =
    useState("All Categories");

  const [searchText, setSearchText] = useState("");

  // =========================================
  // CHECK LOGIN
  // =========================================

  useEffect(() => {
    const checkLogin = () => {
      const accessToken = localStorage.getItem("access_token");

      setIsLoggedIn(Boolean(accessToken));
    };

    checkLogin();

    window.addEventListener("authChanged", checkLogin);

    return () => {
      window.removeEventListener("authChanged", checkLogin);
    };
  }, [pathname]);

  // =========================================
  // FETCH CATEGORIES
  // =========================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiFetch("/categories/");

        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data?.results) {
          setCategories(data.results);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // =========================================
  // FETCH CART COUNT
  // =========================================

 useEffect(() => {
  const fetchCartCount = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setCartItems(0);
      return;
    }

    try {
      const response = await apiFetch("/cartitem/");

      if (!response.ok) {
        setCartItems(0);
        return;
      }

      const data = await response.json();

      const items = Array.isArray(data)
        ? data
        : data?.results || [];

      const totalQuantity = items.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      );

      setCartItems(totalQuantity);
    } catch (error) {
      console.error("Error fetching cart count:", error);
      setCartItems(0);
    }
  };

  fetchCartCount();

  window.addEventListener("cartUpdated", fetchCartCount);

  return () => {
    window.removeEventListener(
      "cartUpdated",
      fetchCartCount
    );
  };
}, [pathname, isLoggedIn]);

  // =========================================
  // LOGIN MESSAGE
  // =========================================

  const showLoginMessage = () => {
    setLoginMessage(true);

    setTimeout(() => {
      setLoginMessage(false);
    }, 1800);
  };

  // =========================================
  // HOME
  // =========================================

  const handleHome = () => {
    setShowCategories(false);
    router.push("/");
  };

  // =========================================
  // CONTACT
  // =========================================

  const handleContact = () => {
    setShowCategories(false);
    router.push("/contact");
  };

  // =========================================
  // LOGIN
  // =========================================

  const handleLogin = () => {
    setShowCategories(false);
    router.push("/login");
  };

  // =========================================
  // SIGN UP
  // =========================================

  const handleSignup = () => {
    setShowCategories(false);
    router.push("/signup");
  };

  // =========================================
  // PROFILE
  // =========================================

  const handleProfile = () => {
    if (!isLoggedIn) {
      showLoginMessage();
      return;
    }

    setShowCategories(false);
    router.push("/profile");
  };

  // =========================================
  // CART
  // =========================================

  const handleCart = () => {
    if (!isLoggedIn) {
      showLoginMessage();
      return;
    }

    setShowCategories(false);
    router.push("/cart");
  };

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setCartItems(0);
    setSelectedCategory(null);
    setSelectedCategoryName("All Categories");
    setSearchText("");
    setShowCategories(false);

    window.dispatchEvent(new Event("authChanged"));
    window.dispatchEvent(new Event("cartUpdated"));

    router.push("/");
  };

  // =========================================
  // CATEGORY CLICK
  // =========================================

  const handleCategoryClick = (categoryId, categoryName) => {
    setShowCategories(false);

    if (!isLoggedIn) {
      showLoginMessage();
      return;
    }

    setSelectedCategory(categoryId);
    setSelectedCategoryName(categoryName);
    setSearchText("");

    router.push(`/product?category=${categoryId}`);
  };

  // =========================================
  // ALL CATEGORIES
  // =========================================

  const handleAllCategories = () => {
    setShowCategories(false);

    if (!isLoggedIn) {
      showLoginMessage();
      return;
    }

    setSelectedCategory(null);
    setSelectedCategoryName("All Categories");
    setSearchText("");

    router.push("/categories");
  };

  // =========================================
  // SEARCH
  // =========================================

  const handleSearch = (event) => {
    event.preventDefault();

    const value = searchText.trim();

    if (!value) {
      return;
    }

    if (!isLoggedIn) {
      showLoginMessage();
      return;
    }

    let searchUrl = `/product?search=${encodeURIComponent(value)}`;

    if (selectedCategory) {
      searchUrl += `&category=${selectedCategory}`;
    }

    setShowCategories(false);

    router.push(searchUrl);
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/product" },
    { label: "Categories", href: "/categories" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <header className="navbar">
        {/* ANNOUNCEMENT */}
        <div className="top-bar">
          <div className="top-container">
            <span className="welcome-text">
              Flat Rs. 200 delivery on every order.
            </span>

            <div className="top-links">
              {!isLoggedIn ? (
                <button type="button" className="top-link" onClick={handleLogin}>
                  Log in / Sign up
                </button>
              ) : (
                <button
                  type="button"
                  className="top-link logout-link"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MAIN NAVBAR */}
        <div className="main-navbar">
          <div className="main-container">
            <div
              className="logo"
              onClick={handleHome}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleHome();
              }}
            >
              <span className="logo-mark" aria-hidden="true">S</span>
              <span className="logo-text">ShopEase</span>
            </div>

            <nav className="nav-links" aria-label="Main">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  className={`nav-link ${
                    pathname === link.href ? "active" : ""
                  }`}
                  onClick={() => router.push(link.href)}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <form className="search-area" onSubmit={handleSearch} role="search">
              <svg className="search-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                type="search"
                className="search-input"
                placeholder="Search products"
                aria-label="Search products"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />

              <button type="submit" className="search-button">
                Search
              </button>
            </form>

            <div className="header-actions">
              <button
                type="button"
                className="cart-button"
                onClick={handleCart}
                title="Cart"
                aria-label="Cart"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
                  <circle cx="10" cy="20" r="1.3" />
                  <circle cx="17" cy="20" r="1.3" />
                </svg>

                {isLoggedIn && cartItems > 0 && (
                  <span className="cart-count">{cartItems}</span>
                )}
              </button>

              {isLoggedIn ? (
                <button
                  type="button"
                  className="account-icon-button"
                  onClick={handleProfile}
                  title="My account"
                  aria-label="My account"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="login-button"
                  onClick={handleLogin}
                >
                  Log in
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {loginMessage && (
        <div className="login-required-message">
          <span className="message-icon">🔒</span>
          <div className="message-content">
            <strong>Login required</strong>
            <span>Please log in to continue.</span>
          </div>
        </div>
      )}
    </>
  );
}
