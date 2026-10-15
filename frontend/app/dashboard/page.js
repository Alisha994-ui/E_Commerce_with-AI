
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ProtectedRoute from "../components/ProtectedRoute";
import { apiFetch } from "../components/apiFetch";

import ProductManagement from "./components/ProductManagement";
import CategoryManagement from "./components/CategoryManagement";
import Order from "./components/Order";
import OrderItem from "./components/OrderItem";
import Cart from "./components/Cart";
import CartItem from "./components/CartItem";
import User from "./components/User";

import "./page.css";

export default function DashboardPage() {
  const router = useRouter();

  // ==========================================
  // USER
  // ==========================================

  const [user, setUser] = useState(null);

  // ==========================================
  // SIDEBAR
  // ==========================================

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.replace("/login");
  };

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    users: 0,
  });

  const [loading, setLoading] = useState(true);

  // ==========================================
  // LATEST ORDERS
  // ==========================================

  const [latestOrders, setLatestOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // ==========================================
  // CHECK ADMIN USER
  // ==========================================

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (!parsedUser.is_staff) {
        router.replace("/");
        return;
      }

      setUser(parsedUser);
    } catch (error) {
      console.error("Invalid user data:", error);

      localStorage.removeItem("user");

      router.replace("/login");
    }
  }, [router]);

  // ==========================================
  // FETCH DASHBOARD STATS
  // ==========================================

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const response = await apiFetch("/dashboard/stats/");

        if (!response.ok) {
          console.error(
            "Dashboard stats error:",
            response.status
          );
          return;
        }

        const data = await response.json();

        setStats({
          products: data.products || 0,
          categories: data.categories || 0,
          orders: data.orders || 0,
          users: data.users || 0,
        });
      } catch (error) {
        console.error(
          "Error fetching dashboard stats:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // ==========================================
  // FETCH LATEST ORDERS
  // ==========================================

  useEffect(() => {
    const fetchLatestOrders = async () => {
      try {
        setOrdersLoading(true);

        const response = await apiFetch("/order/?page=1");

        if (!response.ok) {
          console.error(
            "Latest orders error:",
            response.status
          );
          return;
        }

        const data = await response.json();

        const orders = Array.isArray(data)
          ? data
          : data.results || [];

        setLatestOrders(orders.slice(0, 5));
      } catch (error) {
        console.error(
          "Error fetching latest orders:",
          error
        );
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchLatestOrders();
  }, []);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  // ==========================================
  // DASHBOARD OVERVIEW
  // ==========================================

  const renderOverview = () => {
    return (
      <>
        {/* ======================================
            PAGE HEADER
        ====================================== */}

        <div className="page-heading">
          <div>
            <h1>Dashboard</h1>

            <p>
              Welcome back! Here is an overview of
              your store.
            </p>
          </div>
        </div>

        {/* ======================================
            STAT CARDS
        ====================================== */}

        <div className="stats-grid">

          {/* PRODUCTS */}

          <div className="stat-card stat-blue">
            <div className="stat-content">
              <span className="stat-title">
                TOTAL PRODUCTS
              </span>

              <strong>
                {loading ? "..." : stats.products}
              </strong>

              <span className="stat-description">
                Products in store
              </span>
            </div>

            <div className="stat-icon">
              📦
            </div>
          </div>

          {/* ORDERS */}

          <div className="stat-card stat-pink">
            <div className="stat-content">
              <span className="stat-title">
                TOTAL ORDERS
              </span>

              <strong>
                {loading ? "..." : stats.orders}
              </strong>

              <span className="stat-description">
                Orders received
              </span>
            </div>

            <div className="stat-icon">
              🧾
            </div>
          </div>

          {/* CATEGORIES */}

          <div className="stat-card stat-orange">
            <div className="stat-content">
              <span className="stat-title">
                TOTAL CATEGORIES
              </span>

              <strong>
                {loading
                  ? "..."
                  : stats.categories}
              </strong>

              <span className="stat-description">
                Product categories
              </span>
            </div>

            <div className="stat-icon">
              🏷️
            </div>
          </div>

          {/* USERS */}

          <div className="stat-card stat-green">
            <div className="stat-content">
              <span className="stat-title">
                TOTAL CUSTOMERS
              </span>

              <strong>
                {loading ? "..." : stats.users}
              </strong>

              <span className="stat-description">
                Registered customers
              </span>
            </div>

            <div className="stat-icon">
              👥
            </div>
          </div>

        </div>

        {/* ======================================
            LOWER DASHBOARD
        ====================================== */}

        <div className="dashboard-grid">

          {/* STORE OVERVIEW */}

          <div className="dashboard-card overview-card">

            <div className="card-header">
              <div>
                <h2>Store Overview</h2>

                <p>
                  Current store statistics
                </p>
              </div>
            </div>

            <div className="overview-chart">

              {/* PRODUCTS */}

              <div className="chart-row">
                <div className="chart-label">
                  <span>Products</span>

                  <strong>
                    {stats.products}
                  </strong>
                </div>

                <div className="chart-track">
                  <div
                    className="chart-bar bar-products"
                    style={{
                      width: `${Math.min(
                        stats.products * 5,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* CATEGORIES */}

              <div className="chart-row">
                <div className="chart-label">
                  <span>Categories</span>

                  <strong>
                    {stats.categories}
                  </strong>
                </div>

                <div className="chart-track">
                  <div
                    className="chart-bar bar-categories"
                    style={{
                      width: `${Math.min(
                        stats.categories * 10,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* ORDERS */}

              <div className="chart-row">
                <div className="chart-label">
                  <span>Orders</span>

                  <strong>
                    {stats.orders}
                  </strong>
                </div>

                <div className="chart-track">
                  <div
                    className="chart-bar bar-orders"
                    style={{
                      width: `${Math.min(
                        stats.orders * 5,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* CUSTOMERS */}

              <div className="chart-row">
                <div className="chart-label">
                  <span>Customers</span>

                  <strong>
                    {stats.users}
                  </strong>
                </div>

                <div className="chart-track">
                  <div
                    className="chart-bar bar-users"
                    style={{
                      width: `${Math.min(
                        stats.users * 5,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* QUICK ACTIONS */}

          <div className="dashboard-card quick-card">

            <div className="card-header">
              <div>
                <h2>Quick Actions</h2>

                <p>
                  Manage your store
                </p>
              </div>
            </div>

            <div className="quick-actions">

              {/* PRODUCTS */}

              <button
                onClick={() =>
                  handleSectionChange("products")
                }
              >
                <span className="quick-icon">
                  📦
                </span>

                <span>
                  <strong>
                    Manage Products
                  </strong>

                  <small>
                    Add or edit products
                  </small>
                </span>

                <span className="arrow">
                  →
                </span>
              </button>

              {/* CATEGORIES */}

              <button
                onClick={() =>
                  handleSectionChange("categories")
                }
              >
                <span className="quick-icon">
                  🏷️
                </span>

                <span>
                  <strong>
                    Manage Categories
                  </strong>

                  <small>
                    Organize your products
                  </small>
                </span>

                <span className="arrow">
                  →
                </span>
              </button>

              {/* ORDERS */}

              <button
                onClick={() =>
                  handleSectionChange("orders")
                }
              >
                <span className="quick-icon">
                  🧾
                </span>

                <span>
                  <strong>
                    View Orders
                  </strong>

                  <small>
                    Manage customer orders
                  </small>
                </span>

                <span className="arrow">
                  →
                </span>
              </button>

              {/* USERS */}

              <button
                onClick={() =>
                  handleSectionChange("users")
                }
              >
                <span className="quick-icon">
                  👥
                </span>

                <span>
                  <strong>
                    Manage Users
                  </strong>

                  <small>
                    View registered users
                  </small>
                </span>

                <span className="arrow">
                  →
                </span>
              </button>

            </div>
          </div>

        </div>

        {/* ======================================
            LATEST ORDERS
        ====================================== */}

        <div className="latest-section-grid">

          <div className="dashboard-card latest-orders-card">

            <div className="card-header">
              <div>
                <h2>Latest Orders</h2>

                <p>
                  Recently received customer orders
                </p>
              </div>
            </div>

            <div className="latest-orders-table">

              <div className="latest-orders-header">
                <span>Order ID</span>
                <span>Customer</span>
                <span>Status</span>
                <span>Total</span>
              </div>

              {ordersLoading ? (

                <div className="latest-orders-empty">
                  Loading orders...
                </div>

              ) : latestOrders.length === 0 ? (

                <div className="latest-orders-empty">
                  No orders available!
                </div>

              ) : (

                latestOrders.map((order) => (

                  <div
                    className="latest-order-row"
                    key={order.id}
                  >

                    <span>
                      {order.id}
                    </span>

                    <span>
                      {order.user?.username ||
                        order.username ||
                        "Customer"}
                    </span>

                    <span>
                      <span
                        className={`order-status ${String(
                          order.status || "pending"
                        ).toLowerCase()}`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </span>

                    <span>
                      Rs.{" "}
                      {Number(
                        order.total_amount || 0
                      ).toFixed(2)}
                    </span>

                  </div>

                ))

              )}

            </div>
          </div>

        </div>

        {/* ======================================
            AI SECTION
        ====================================== */}

        <div className="ai-dashboard-card">

          <div className="ai-icon">
            🤖
          </div>

          <div className="ai-content">

            <h2>
              Smart Product Recommendations
            </h2>

            <p>
              Your AI recommendation system will
              provide personalized product
              suggestions to customers based on
              product similarity and user behavior.
            </p>

          </div>

          <button
            className="ai-button"
            onClick={() =>
              handleSectionChange("products")
            }
          >
            View Products →
          </button>

        </div>
      </>
    );
  };

  // ==========================================
  // CONTENT
  // ==========================================

  const renderContent = () => {
    switch (activeSection) {
      case "products":
        return <ProductManagement />;

      case "categories":
        return <CategoryManagement />;

      case "orders":
        return <Order />;

      case "order-items":
        return <OrderItem />;

      case "carts":
        return <Cart />;

      case "cart-items":
        return <CartItem />;

      case "users":
        return <User />;

      default:
        return renderOverview();
    }
  };

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <ProtectedRoute>

      <div className="admin-layout">

        {/* ====================================
            SIDEBAR
        ==================================== */}

        <aside
          className={`admin-sidebar ${
            sidebarOpen ? "open" : "closed"
          }`}
        >

          {/* LOGO */}

          <div className="sidebar-logo">

            <div className="logo-icon">
              S
            </div>

            {sidebarOpen && (
              <span>
                ShopEase
              </span>
            )}

          </div>

          {/* MAIN MENU */}

          <div className="sidebar-section">

            {sidebarOpen && (
              <p className="sidebar-title">
                MAIN MENU
              </p>
            )}

            {/* DASHBOARD */}

            <button
              className={
                activeSection === "overview"
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                handleSectionChange("overview")
              }
            >
              <span>
                ▦
              </span>

              {sidebarOpen && (
                <span>
                  Dashboard
                </span>
              )}
            </button>

            {/* PRODUCTS */}

            <button
              className={
                activeSection === "products"
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                handleSectionChange("products")
              }
            >
              <span>
                📦
              </span>

              {sidebarOpen && (
                <span>
                  Products
                </span>
              )}

              {sidebarOpen && (
                <span className="sidebar-arrow">
                  ›
                </span>
              )}
            </button>

            {/* CATEGORIES */}

            <button
              className={
                activeSection === "categories"
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                handleSectionChange("categories")
              }
            >
              <span>
                🏷️
              </span>

              {sidebarOpen && (
                <span>
                  Categories
                </span>
              )}

              {sidebarOpen && (
                <span className="sidebar-arrow">
                  ›
                </span>
              )}
            </button>

            {/* ORDERS */}

            <button
              className={
                activeSection === "orders"
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                handleSectionChange("orders")
              }
            >
              <span>
                🧾
              </span>

              {sidebarOpen && (
                <span>
                  Orders
                </span>
              )}

              {sidebarOpen && (
                <span className="sidebar-arrow">
                  ›
                </span>
              )}
            </button>

          </div>

          {/* STORE */}

          <div className="sidebar-section">

            {sidebarOpen && (
              <p className="sidebar-title">
                STORE
              </p>
            )}

            {/* CARTS */}

            <button
              className={
                activeSection === "carts"
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                handleSectionChange("carts")
              }
            >
              <span>
                🛒
              </span>

              {sidebarOpen && (
                <span>
                  Carts
                </span>
              )}
            </button>

            {/* USERS */}

            <button
              className={
                activeSection === "users"
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                handleSectionChange("users")
              }
            >
              <span>
                👥
              </span>

              {sidebarOpen && (
                <span>
                  Users
                </span>
              )}

              {sidebarOpen && (
                <span className="sidebar-arrow">
                  ›
                </span>
              )}
            </button>

          </div>

          {/* SYSTEM */}

          <div className="sidebar-section">

            {sidebarOpen && (
              <p className="sidebar-title">
                SYSTEM
              </p>
            )}

            {/* ORDER ITEMS */}

            <button
              className={
                activeSection === "order-items"
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                handleSectionChange("order-items")
              }
            >
              <span>
                📋
              </span>

              {sidebarOpen && (
                <span>
                  Order Items
                </span>
              )}
            </button>

            {/* CART ITEMS */}

            <button
              className={
                activeSection === "cart-items"
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                handleSectionChange("cart-items")
              }
            >
              <span>
                🧺
              </span>

              {sidebarOpen && (
                <span>
                  Cart Items
                </span>
              )}
            </button>

          </div>

        </aside>

        {/* ====================================
            RIGHT SIDE
        ==================================== */}

        <div
          className={`admin-main ${
            sidebarOpen ? "sidebar-open" : ""
          }`}
        >

          {/* ==================================
              TOP HEADER
          ================================== */}

          <header className="admin-header">

            <div className="header-left">

              {/* SIDEBAR TOGGLE */}

              <button
                className="sidebar-toggle"
                onClick={() =>
                  setSidebarOpen(!sidebarOpen)
                }
              >
                {sidebarOpen ? "‹" : "›"}
              </button>

              {/* STOREFRONT */}

              <div className="storefront">
                <span>
                  🏪
                </span>

                <span
                  onClick={() =>
                    window.open("/", "_blank")
                  }
                >
                  Storefront
                </span>
              </div>

            </div>

            <div className="header-right">

              {/* FULLSCREEN */}

              <button
                className="header-button"
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                  } else {
                    document.exitFullscreen();
                  }
                }}
              >
                ⛶
              </button>

              {/* LANGUAGE */}

              {/* PROFILE */}

              <div className="admin-profile-wrapper">

                <button
                  className="admin-profile"
                  onClick={() =>
                    setProfileMenuOpen(
                      !profileMenuOpen
                    )
                  }
                >

                  <div className="profile-avatar">
                    {user?.username
                      ?.charAt(0)
                      ?.toUpperCase() || "A"}
                  </div>

                  <div className="profile-info">

                    <strong>
                      {user?.username || "Admin"}
                    </strong>

                    <small>
                      Administrator
                    </small>

                  </div>

                  <span className="profile-arrow">
                    {profileMenuOpen
                      ? "⌃"
                      : "⌄"}
                  </span>

                </button>

                {/* PROFILE DROPDOWN */}

                {profileMenuOpen && (

                  <div className="profile-dropdown">

                    <div className="dropdown-user">

                      <div className="dropdown-avatar">
                        {user?.username
                          ?.charAt(0)
                          ?.toUpperCase() || "A"}
                      </div>

                      <div>

                        <strong>
                          {user?.username || "Admin"}
                        </strong>

                        <div className="dropdown-email">
                          {user?.email ||
                            "admin@email.com"}
                        </div>

                      </div>

                      <span className="admin-badge">
                        Admin
                      </span>

                    </div>

                    <div className="dropdown-divider" />

                    {/* PROFILE */}

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setProfileMenuOpen(false);

                        router.push(
                          "/admin/profile?tab=account"
                        );
                      }}
                    >
                      <span>
                        ♙
                      </span>

                      <span>
                        Profile
                      </span>
                    </button>

                    {/* LOGOUT */}

                    <button
                      className="dropdown-item"
                      onClick={handleLogout}
                    >
                      <span>
                        ↪
                      </span>

                      <span>
                        Logout
                      </span>
                    </button>

                  </div>

                )}

              </div>

            </div>

          </header>

          {/* ==================================
              CONTENT
          ================================== */}

          <main className="dashboard-content">
            {renderContent()}
          </main>

        </div>

      </div>

    </ProtectedRoute>
  );
}

