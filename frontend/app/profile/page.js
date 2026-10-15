"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./page.css";

import { apiFetch } from "../components/apiFetch";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState({
    username: "ShopEase User",
    email: "user@example.com",
  });

  const [isLoading, setIsLoading] = useState(true);

  const [activeSection, setActiveSection] = useState("profile");

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [feedback, setFeedback] = useState({});

  const [feedbackSubmitted, setFeedbackSubmitted] = useState({});

  // =========================================================
  // GET USER
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);

        const currentUser = {
          username: userData.username || "ShopEase User",
          email: userData.email || "user@example.com",
        };

        setUser(currentUser);
        setEditUsername(currentUser.username);
        setEditEmail(currentUser.email);
      } catch (error) {
        console.error("Could not read user data:", error);
      }
    }

    fetchSubmittedFeedback();

    setIsLoading(false);
  }, [router]);

  // =========================================================
  // LOAD SUBMITTED FEEDBACK
  // =========================================================

  const fetchSubmittedFeedback = async () => {
    try {
      const response = await apiFetch("/feedback/");

      const contentType = response.headers.get("content-type");

      let data;

      if (
        contentType &&
        contentType.includes("application/json")
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error(
          "Feedback API returned non-JSON:",
          text
        );

        return;
      }

      console.log(
        "Feedback list response:",
        response.status,
        data
      );

      if (!response.ok) {
        console.error(
          "Unable to load feedback:",
          data
        );

        return;
      }

      const feedbackList = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : [];

      const submitted = {};

      feedbackList.forEach((feedbackItem) => {
        if (feedbackItem.product) {
          submitted[feedbackItem.product] = true;
        }
      });

      console.log(
        "Already submitted feedback:",
        submitted
      );

      setFeedbackSubmitted(submitted);

    } catch (error) {
      console.error(
        "Could not load submitted feedback:",
        error
      );
    }
  };

  // =========================================================
  // LOAD ORDERS
  // =========================================================

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError("");
      setSelectedOrder(null);

      const response = await apiFetch("/order/");

      const contentType =
        response.headers.get("content-type");

      let data;

      if (
        contentType &&
        contentType.includes("application/json")
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error(
          "Orders API returned non-JSON:",
          text
        );

        throw new Error(
          `Server returned ${response.status} instead of JSON.`
        );
      }

      console.log(
        "Orders response:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load your orders."
        );
      }

      const ordersList = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : [];

      console.log(
        "Orders List:",
        ordersList
      );

      ordersList.forEach((order) => {
        console.log(
          `Order #${order.id} items:`,
          order.items
        );
      });

      setOrders(ordersList);

    } catch (error) {
      console.error(
        "Orders error:",
        error
      );

      setOrdersError(
        error.message ||
          "Unable to load your orders."
      );

    } finally {
      setOrdersLoading(false);
    }
  };

  // =========================================================
  // OPEN ORDERS
  // =========================================================

  const handleOrdersClick = () => {
    setActiveSection("orders");
    setSelectedOrder(null);

    fetchOrders();
  };

  // =========================================================
  // OPEN EDIT PROFILE
  // =========================================================

  const openEditProfile = () => {
    setEditUsername(user.username);
    setEditEmail(user.email);

    setProfileMessage("");
    setProfileError("");

    setIsEditing(true);
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setProfileMessage("");
    setProfileError("");

    if (!editUsername.trim()) {
      setProfileError(
        "Username cannot be empty."
      );
      return;
    }

    if (!editEmail.trim()) {
      setProfileError(
        "Email cannot be empty."
      );
      return;
    }

    try {
      setSavingProfile(true);

      const response = await apiFetch(
        "/users/me/",
        {
          method: "PATCH",
          body: JSON.stringify({
            username: editUsername.trim(),
            email: editEmail.trim(),
          }),
        }
      );

      const contentType =
        response.headers.get("content-type");

      let data;

      if (
        contentType &&
        contentType.includes("application/json")
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error(
          "Profile API returned non-JSON:",
          text
        );

        throw new Error(
          `Server returned ${response.status} instead of JSON.`
        );
      }

      console.log(
        "Profile update response:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.username?.[0] ||
            data.email?.[0] ||
            "Unable to update profile."
        );
      }

      const updatedUser = {
        username:
          data.username ||
          editUsername.trim(),

        email:
          data.email ||
          editEmail.trim(),
      };

      setUser(updatedUser);

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setProfileMessage(
        "Profile updated successfully!"
      );

      setTimeout(() => {
        setIsEditing(false);
        setProfileMessage("");
      }, 1200);

    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      setProfileError(
        error.message ||
          "Something went wrong."
      );

    } finally {
      setSavingProfile(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    router.replace("/");
  };

  // =========================================================
  // FEEDBACK CHANGE
  // =========================================================

  const handleFeedbackChange = (
    itemId,
    value
  ) => {
    setFeedback((previous) => ({
      ...previous,
      [itemId]: value,
    }));
  };

  // =========================================================
  // FEEDBACK SUBMIT
  // =========================================================

  const handleFeedbackSubmit = async (
    itemId
  ) => {
    const currentFeedback =
      feedback[itemId]?.trim();

    if (!currentFeedback) {
      alert(
        "Please write your feedback first."
      );
      return;
    }

    try {
      const item =
        selectedOrder?.items?.find(
          (orderItem) =>
            orderItem.id === itemId
        );

      if (!item) {
        alert(
          "Product information not found."
        );
        return;
      }

      if (!item.product) {
        alert(
          "Product ID not found."
        );
        return;
      }

      const response = await apiFetch(
        "/feedback/",
        {
          method: "POST",
          body: JSON.stringify({
            product: item.product,
            comment: currentFeedback,
          }),
        }
      );

      console.log(
        "Feedback status:",
        response.status
      );

      const contentType =
        response.headers.get(
          "content-type"
        );

      let data;

      if (
        contentType &&
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text =
          await response.text();

        console.log(
          "Backend response:",
          text
        );

        throw new Error(
          `Server returned ${response.status} instead of JSON.`
        );
      }

      console.log(
        "Feedback response:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.feedback?.[0] ||
            data.product?.[0] ||
            data.comment?.[0] ||
            "Unable to submit feedback."
        );
      }

      // IMPORTANT:
      // Store PRODUCT ID, not order item ID
      setFeedbackSubmitted(
        (previous) => ({
          ...previous,
          [item.product]: true,
        })
      );

      setFeedback(
        (previous) => ({
          ...previous,
          [itemId]: "",
        })
      );

      alert(
        "Thank you for your feedback!"
      );

    } catch (error) {
      console.error(
        "Feedback submission error:",
        error
      );

      alert(
        error.message ||
          "Something went wrong while submitting feedback."
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (isLoading) {
    return (
      <main className="profile-loading">
        <div className="loading-spinner"></div>

        <p>
          Loading profile...
        </p>
      </main>
    );
  }

  // =========================================================
  // ORDER STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    if (!status) {
      return "status-default";
    }

    const value =
      String(status).toLowerCase();

    if (
      value.includes("complete") ||
      value.includes("deliver")
    ) {
      return "status-success";
    }

    if (
      value.includes("cancel") ||
      value.includes("fail")
    ) {
      return "status-danger";
    }

    if (
      value.includes("pending") ||
      value.includes("process")
    ) {
      return "status-warning";
    }

    return "status-default";
  };

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <main className="profile-page">

      {/* HEADER */}

      <section className="profile-header">

        <p className="profile-label">
          MY ACCOUNT
        </p>

        <h1>
          My Profile
        </h1>

        <p>
          Manage your account and shopping activity
        </p>

      </section>

      {/* PROFILE CONTAINER */}

      <section className="profile-container">

        {/* SIDEBAR */}

        <aside className="profile-sidebar">

          <div className="profile-avatar">
            {user.username
              .charAt(0)
              .toUpperCase()}
          </div>

          <h2>
            {user.username}
          </h2>

          <p className="profile-email">
            {user.email}
          </p>

          <div className="member-badge">
            ✓ Active Member
          </div>

          <div className="sidebar-menu">

            {/* PROFILE */}

            <button
              className={
                activeSection === "profile"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setActiveSection(
                  "profile"
                );
                setSelectedOrder(null);
              }}
            >
              <span>👤</span>
              Profile
            </button>

            {/* ORDERS */}

            <button
              className={
                activeSection === "orders"
                  ? "active"
                  : ""
              }
              onClick={
                handleOrdersClick
              }
            >
              <span>📦</span>
              My Orders
            </button>

            {/* CART */}

            <button
              onClick={() =>
                router.push("/cart")
              }
            >
              <span>🛒</span>
              My Cart
            </button>

          </div>

          {/* LOGOUT */}

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </aside>

        {/* MAIN CONTENT */}

        <div className="profile-content">

          {/* PROFILE SECTION */}

          {activeSection === "profile" && (
            <>

              {/* PERSONAL INFORMATION */}

              <div className="profile-card">

                <div className="card-header">

                  <div>

                    <p className="card-label">
                      ACCOUNT
                    </p>

                    <h2>
                      Personal Information
                    </h2>

                  </div>

                  <button
                    className="edit-btn"
                    onClick={
                      openEditProfile
                    }
                  >
                    ✎ Edit Profile
                  </button>

                </div>

                {/* EDIT FORM */}

                {isEditing ? (
                  <form
                    className="edit-profile-form"
                    onSubmit={
                      handleSaveProfile
                    }
                  >

                    <div className="form-group">

                      <label>
                        Username
                      </label>

                      <input
                        type="text"
                        value={
                          editUsername
                        }
                        onChange={(e) =>
                          setEditUsername(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Email Address
                      </label>

                      <input
                        type="email"
                        value={
                          editEmail
                        }
                        onChange={(e) =>
                          setEditEmail(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    {profileError && (
                      <div className="profile-error">
                        {profileError}
                      </div>
                    )}

                    {profileMessage && (
                      <div className="profile-success">
                        ✓{" "}
                        {profileMessage}
                      </div>
                    )}

                    <div className="edit-actions">

                      <button
                        type="submit"
                        className="save-profile-btn"
                        disabled={
                          savingProfile
                        }
                      >
                        {savingProfile
                          ? "Saving..."
                          : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        className="cancel-profile-btn"
                        onClick={() => {
                          setIsEditing(
                            false
                          );
                          setProfileError(
                            ""
                          );
                          setProfileMessage(
                            ""
                          );
                        }}
                      >
                        Cancel
                      </button>

                    </div>

                  </form>
                ) : (
                  <div className="information-grid">

                    <div className="information-item">

                      <span className="information-icon">
                        👤
                      </span>

                      <div>

                        <p>
                          Username
                        </p>

                        <strong>
                          {user.username}
                        </strong>

                      </div>

                    </div>

                    <div className="information-item">

                      <span className="information-icon">
                        ✉
                      </span>

                      <div>

                        <p>
                          Email Address
                        </p>

                        <strong>
                          {user.email}
                        </strong>

                      </div>

                    </div>

                    <div className="information-item">

                      <span className="information-icon">
                        ✓
                      </span>

                      <div>

                        <p>
                          Account Status
                        </p>

                        <strong className="status">
                          Active
                        </strong>

                      </div>

                    </div>

                    <div className="information-item">

                      <span className="information-icon">
                        ★
                      </span>

                      <div>

                        <p>
                          Membership
                        </p>

                        <strong>
                          ShopEase Member
                        </strong>

                      </div>

                    </div>

                  </div>
                )}

              </div>

              {/* QUICK ACCESS */}

              <div className="profile-card">

                <div className="card-header">

                  <div>

                    <p className="card-label">
                      QUICK ACCESS
                    </p>

                    <h2>
                      Your Shopping
                    </h2>

                  </div>

                </div>

                <div className="quick-actions">

                  <div
                    className="quick-card"
                    onClick={
                      handleOrdersClick
                    }
                  >

                    <div className="quick-icon">
                      📦
                    </div>

                    <div>

                      <h3>
                        My Orders
                      </h3>

                      <p>
                        Track and manage your orders
                      </p>

                    </div>

                    <span className="arrow">
                      →
                    </span>

                  </div>

                  <div
                    className="quick-card"
                    onClick={() =>
                      router.push(
                        "/cart"
                      )
                    }
                  >

                    <div className="quick-icon">
                      🛒
                    </div>

                    <div>

                      <h3>
                        Shopping Cart
                      </h3>

                      <p>
                        View items in your cart
                      </p>

                    </div>

                    <span className="arrow">
                      →
                    </span>

                  </div>

                </div>

              </div>

              {/* SHOPPING CTA */}

              <div className="shopping-cta">

                <div>

                  <p>
                    READY TO SHOP?
                  </p>

                  <h2>
                    Find something you'll love.
                  </h2>

                  <span>
                    Explore our latest products
                    and discover great deals.
                  </span>

                </div>

                <button
                  onClick={() =>
                    router.push("/")
                  }
                >
                  Continue Shopping →
                </button>

              </div>

            </>
          )}

          {/* ORDERS SECTION */}

          {activeSection === "orders" && (

            <div className="profile-card orders-card">

              <div className="card-header">

                <div>

                  <p className="card-label">
                    SHOPPING ACTIVITY
                  </p>

                  <h2>
                    My Orders
                  </h2>

                </div>

                <button
                  className="back-profile-btn"
                  onClick={() => {
                    setActiveSection(
                      "profile"
                    );
                    setSelectedOrder(
                      null
                    );
                  }}
                >
                  ← Profile
                </button>

              </div>

              {/* LOADING */}

              {ordersLoading && (
                <div className="orders-loading">

                  <div className="loading-spinner"></div>

                  <p>
                    Loading your orders...
                  </p>

                </div>
              )}

              {/* ERROR */}

              {!ordersLoading &&
                ordersError && (
                  <div className="orders-error">

                    <div>
                      !
                    </div>

                    <p>
                      {ordersError}
                    </p>

                    <button
                      onClick={
                        fetchOrders
                      }
                    >
                      Try Again
                    </button>

                  </div>
                )}

              {/* NO ORDERS */}

              {!ordersLoading &&
                !ordersError &&
                orders.length === 0 && (
                  <div className="empty-orders">

                    <div className="empty-orders-icon">
                      📦
                    </div>

                    <h3>
                      No Orders Yet
                    </h3>

                    <p>
                      You haven't placed any
                      orders yet.
                    </p>

                    <button
                      onClick={() =>
                        router.push("/")
                      }
                    >
                      Start Shopping
                    </button>

                  </div>
                )}

              {/* ORDERS LIST */}

              {!ordersLoading &&
                !ordersError &&
                orders.length > 0 &&
                !selectedOrder && (

                  <div className="orders-list">

                    {orders.map((order) => {

                      const itemCount =
                        Array.isArray(
                          order.items
                        )
                          ? order.items.length
                          : 0;

                      const totalQuantity =
                        Array.isArray(
                          order.items
                        )
                          ? order.items.reduce(
                              (
                                total,
                                item
                              ) =>
                                total +
                                Number(
                                  item.quantity ||
                                    0
                                ),
                              0
                            )
                          : 0;

                      return (
                        <div
                          className="order-card"
                          key={order.id}
                        >

                          <div className="order-card-top">

                            <div>

                              <span className="order-label">
                                ORDER
                              </span>

                              <h3>
                                #{order.id}
                              </h3>

                            </div>

                            <span
                              className={`order-status ${getStatusClass(
                                order.status
                              )}`}
                            >
                              {order.status ||
                                "Pending"}
                            </span>

                          </div>

                          <div className="order-summary">

                            <div>

                              <span>
                                Date
                              </span>

                              <strong>
                                {order.created_at
                                  ? new Date(
                                      order.created_at
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </strong>

                            </div>

                            <div>

                              <span>
                                Total
                              </span>

                              <strong>
                                Rs.{" "}
                                {Number(
                                  order.total_amount ||
                                    0
                                ).toFixed(2)}
                              </strong>

                            </div>

                            <div>

                              <span>
                                Products
                              </span>

                              <strong>
                                {itemCount}
                              </strong>

                            </div>

                            <div>

                              <span>
                                Quantity
                              </span>

                              <strong>
                                {totalQuantity}
                              </strong>

                            </div>

                          </div>

                          <button
                            className="view-order-btn"
                            onClick={() =>
                              setSelectedOrder(
                                order
                              )
                            }
                          >
                            View Order Details →
                          </button>

                        </div>
                      );
                    })}

                  </div>
                )}

              {/* SELECTED ORDER DETAILS */}

              {!ordersLoading &&
                selectedOrder && (

                  <div className="order-detail-view">

                    <button
                      className="order-back-btn"
                      onClick={() =>
                        setSelectedOrder(
                          null
                        )
                      }
                    >
                      ← Back to Orders
                    </button>

                    <div className="order-detail-header">

                      <div>

                        <span>
                          ORDER
                        </span>

                        <h2>
                          #{selectedOrder.id}
                        </h2>

                      </div>

                      <span
                        className={`order-status ${getStatusClass(
                          selectedOrder.status
                        )}`}
                      >
                        {selectedOrder.status ||
                          "Pending"}
                      </span>

                    </div>

                    <div className="order-info-grid">

                      <div>

                        <span>
                          Order Date
                        </span>

                        <strong>
                          {selectedOrder.created_at
                            ? new Date(
                                selectedOrder.created_at
                              ).toLocaleString()
                            : "N/A"}
                        </strong>

                      </div>

                      <div>

                        <span>
                          Customer
                        </span>

                        <strong>
                          {selectedOrder.user_name ||
                            user.username}
                        </strong>

                      </div>

                      <div>

                        <span>
                          Products
                        </span>

                        <strong>
                          {Array.isArray(
                            selectedOrder.items
                          )
                            ? selectedOrder
                                .items.length
                            : 0}
                        </strong>

                      </div>

                    </div>

                    {/* PRODUCTS */}

                    <div className="order-products-section">

                      <h3>
                        Order Items
                      </h3>

                      {Array.isArray(
                        selectedOrder.items
                      ) &&
                      selectedOrder.items.length >
                        0 ? (

                        <div className="order-products">

                          {selectedOrder.items.map(
                            (item) => {

                              const isDelivered =
                                selectedOrder?.status
                                  ?.toString()
                                  .toLowerCase() ===
                                "delivered";

                              return (
                                <div
                                  className="order-product-wrapper"
                                  key={item.id}
                                >

                                  <div className="order-product">

                                    {/* PRODUCT IMAGE */}

                                    <div className="order-product-image">

                                      {item.product_image ? (
                                        <img
                                          src={
                                            item.product_image
                                          }
                                          alt={
                                            item.product_name ||
                                            "Product"
                                          }
                                        />
                                      ) : (
                                        <span>
                                          🛍️
                                        </span>
                                      )}

                                    </div>

                                    {/* PRODUCT INFO */}

                                    <div className="order-product-info">

                                      <h4>
                                        {item.product_name ||
                                          "Product"}
                                      </h4>

                                      <p>
                                        Quantity:{" "}
                                        {item.quantity ||
                                          0}
                                      </p>

                                      <p>
                                        Unit Price: Rs.{" "}
                                        {Number(
                                          item.price ||
                                            0
                                        ).toFixed(2)}
                                      </p>

                                    </div>

                                    {/* PRODUCT TOTAL */}

                                    <div className="order-product-price">

                                      Rs.{" "}
                                      {(
                                        Number(
                                          item.price ||
                                            0
                                        ) *
                                        Number(
                                          item.quantity ||
                                            0
                                        )
                                      ).toFixed(2)}

                                    </div>

                                  </div>

                                  {/* FEEDBACK */}

                                  {isDelivered &&
                                    !feedbackSubmitted[
                                      item.product
                                    ] && (

                                      <div className="product-feedback-box">

                                        <div className="feedback-heading">

                                          <div>

                                            <span className="feedback-label">
                                              PRODUCT FEEDBACK
                                            </span>

                                            <h4>
                                              How was your
                                              experience
                                              with{" "}
                                              {item.product_name ||
                                                "this product"}?
                                            </h4>

                                            <p>
                                              Share your
                                              honest
                                              feedback
                                              about this
                                              product.
                                            </p>

                                          </div>

                                          <span className="feedback-icon">
                                            💬
                                          </span>

                                        </div>

                                        <textarea
                                          value={
                                            feedback[
                                              item.id
                                            ] || ""
                                          }
                                          onChange={(
                                            e
                                          ) =>
                                            handleFeedbackChange(
                                              item.id,
                                              e.target
                                                .value
                                            )
                                          }
                                          placeholder="Write your feedback here..."
                                          rows={4}
                                        />

                                        <div className="feedback-actions">

                                          <span>
                                            Your feedback
                                            will help
                                            improve our
                                            products.
                                          </span>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleFeedbackSubmit(
                                                item.id
                                              )
                                            }
                                          >
                                            Submit Feedback →
                                          </button>

                                        </div>

                                      </div>
                                    )}

                                </div>
                              );
                            }
                          )}

                        </div>

                      ) : (
                        <p className="no-order-items">
                          No item details available.
                        </p>
                      )}

                    </div>

                    {/* SHIPPING */}

                    <div className="shipping-section">

                      <h3>
                        Shipping Address
                      </h3>

                      <p>
                        {selectedOrder.shipping_address ||
                          "No shipping address provided."}
                      </p>

                    </div>

                    {/* TOTAL */}

                    <div className="order-total">

                      <span>
                        Total Amount
                      </span>

                      <strong>
                        Rs.{" "}
                        {Number(
                          selectedOrder.total_amount ||
                            0
                        ).toFixed(2)}
                      </strong>

                    </div>

                  </div>
                )}

            </div>
          )}

        </div>

      </section>

      {/* FOOTER */}

      <footer className="profile-footer">

        <div>

          <h2>
            ShopEase<span>.</span>
          </h2>

          <p>
            Your simple and trusted online
            shopping destination.
          </p>

        </div>

        <div>

          <h4>
            Shop
          </h4>

          <button
            onClick={() =>
              router.push("/")
            }
          >
            Home
          </button>

          <button
            onClick={() =>
              router.push("/cart")
            }
          >
            Cart
          </button>

        </div>

        <div>

          <h4>
            Account
          </h4>

          <button
            onClick={() => {
              setActiveSection(
                "profile"
              );
              setSelectedOrder(null);
            }}
          >
            Profile
          </button>

          <button
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

        <div>

          <h4>
            Contact
          </h4>

          <p>
            support@shopease.com
          </p>

        </div>

      </footer>

      <div className="profile-copyright">
        © 2026 ShopEase. All rights reserved.
      </div>

    </main>
  );
}