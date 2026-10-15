
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/apiFetch";
import "./Cart.css";

export default function Cart() {
  const [carts, setCarts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ==========================================
  // PAGINATION
  // ==========================================

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCarts, setTotalCarts] = useState(0);

  const [selectedCart, setSelectedCart] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ==========================================
  // FETCH CARTS
  // ==========================================

  const fetchCarts = async (page = currentPage) => {
    try {
      setLoading(true);

      const response = await apiFetch(
        `/cart/?page=${page}`
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Cart API error:",
          response.status,
          errorText
        );

        return;
      }

      const data = await response.json();

      // ======================================
      // IF PAGINATION IS NOT ENABLED
      // ======================================

      if (Array.isArray(data)) {
        setCarts(data);

        setTotalCarts(data.length);
        setTotalPages(1);
      }

      // ======================================
      // DJANGO PAGINATED RESPONSE
      // ======================================

      else {
        setCarts(data.results || []);

        setTotalCarts(data.count || 0);

        const pageSize = 10;

        setTotalPages(
          Math.ceil(
            (data.count || 0) / pageSize
          )
        );
      }

    } catch (error) {
      console.error(
        "Error fetching carts:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH WHEN PAGE CHANGES
  // ==========================================

  useEffect(() => {
    fetchCarts(currentPage);
  }, [currentPage]);

  // ==========================================
  // GET USERNAME
  // ==========================================

  const getUsername = (cart) => {
    return (
      cart.cart_username ||
      `User #${cart.user || "-"}`
    );
  };

  // ==========================================
  // GET USER EMAIL
  // ==========================================

  const getUserEmail = (cart) => {
    return cart.cart_email || "-";
  };

  // ==========================================
  // GET CART ITEMS
  // ==========================================

  const getCartItems = (cart) => {
    if (Array.isArray(cart.items)) {
      return cart.items;
    }

    return [];
  };

  // ==========================================
  // GET ITEMS COUNT
  // ==========================================

  const getItemsCount = (cart) => {
    if (!Array.isArray(cart.items)) {
      return 0;
    }

    return cart.items.reduce(
      (total, item) => {
        return (
          total +
          Number(item.quantity || 0)
        );
      },
      0
    );
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredCarts = carts.filter(
    (cart) => {
      const username =
        cart.cart_username?.toLowerCase() ||
        "";

      const email =
        cart.cart_email?.toLowerCase() ||
        "";

      const userId =
        String(cart.user || "");

      const cartId =
        String(cart.id || "");

      const searchText =
        search.toLowerCase();

      return (
        username.includes(searchText) ||
        email.includes(searchText) ||
        userId.includes(searchText) ||
        cartId.includes(searchText)
      );
    }
  );

  // ==========================================
  // VIEW CART
  // ==========================================

  const handleView = (cart) => {
    setSelectedCart(cart);
    setShowModal(true);
  };

  // ==========================================
  // DELETE CART
  // ==========================================

  const handleDelete = async (cartId) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this cart?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const response =
        await apiFetch(
          `/carts/${cartId}/`,
          {
            method: "DELETE",
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Delete cart error:",
          errorText
        );

        alert(
          "Failed to delete cart."
        );

        return;
      }

      // Remove from current page
      setCarts(
        (previousCarts) =>
          previousCarts.filter(
            (cart) =>
              cart.id !== cartId
          )
      );

      // Update total count
      setTotalCarts(
        (previous) =>
          Math.max(
            previous - 1,
            0
          )
      );

      if (
        selectedCart?.id === cartId
      ) {
        setSelectedCart(null);
        setShowModal(false);
      }

      // Refresh current page
      await fetchCarts(
        currentPage
      );

      alert(
        "Cart deleted successfully."
      );

    } catch (error) {
      console.error(
        "Error deleting cart:",
        error
      );

      alert(
        "Something went wrong."
      );
    }
  };

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // GET PRODUCT NAME
  // ==========================================

  const getProductName = (item) => {
    return (
      item.product_name ||
      item.product?.name ||
      `Product #${item.product || "-"}`
    );
  };

  // ==========================================
  // NEXT PAGE
  // ==========================================

  const handleNextPage = () => {
    if (
      currentPage <
      totalPages
    ) {
      setCurrentPage(
        (previous) =>
          previous + 1
      );
    }
  };

  // ==========================================
  // PREVIOUS PAGE
  // ==========================================

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(
        (previous) =>
          previous - 1
      );
    }
  };

  // ==========================================
  // RETURN
  // ==========================================

  return (
    <div className="cart-management">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="cart-header">

        <div>

          <h2>
            Carts
          </h2>

          <p>
            Manage customer shopping carts
          </p>

        </div>

        <div className="cart-count">

          <span>
            {totalCarts}
          </span>{" "}
          Carts

        </div>

      </div>


      {/* =====================================
          TOOLBAR
      ===================================== */}

      <div className="cart-toolbar">

        <div className="cart-search">

          <span>
            🔎
          </span>

          <input
            type="text"
            placeholder="Search by user or cart ID..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <button
          className="refresh-cart-btn"
          onClick={() =>
            fetchCarts(
              currentPage
            )
          }
        >
          ↻ Refresh
        </button>

      </div>


      {/* =====================================
          TABLE
      ===================================== */}

      <div className="cart-table-container">

        {loading ? (

          <div className="cart-loading">
            Loading carts...
          </div>

        ) : filteredCarts.length === 0 ? (

          <div className="cart-empty">

            <div className="cart-empty-icon">
              🛒
            </div>

            <h3>
              No carts found
            </h3>

            <p>
              {search
                ? "Try a different search."
                : "There are no customer carts available."}
            </p>

          </div>

        ) : (

          <>

            {/* =================================
                CART TABLE
            ================================= */}

            <table className="cart-table">

              <thead>

                <tr>

                  <th>
                    Cart
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Items
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Updated
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredCarts.map(
                  (cart) => (

                    <tr
                      key={
                        cart.id
                      }
                    >

                      {/* Cart */}

                      <td>

                        <div className="cart-id">

                          <div className="cart-icon">
                            🛒
                          </div>

                          <div>

                            <strong>
                              Cart #{cart.id}
                            </strong>

                            <small>
                              ID #{cart.id}
                            </small>

                          </div>

                        </div>

                      </td>


                      {/* Customer */}

                      <td>

                        <div className="cart-user">

                          <div className="cart-user-avatar">

                            {getUsername(
                              cart
                            )
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <div>

                            <strong>
                              {getUsername(
                                cart
                              )}
                            </strong>

                            <small>
                              {getUserEmail(
                                cart
                              )}
                            </small>

                          </div>

                        </div>

                      </td>


                      {/* Items */}

                      <td>

                        <span className="cart-items-badge">

                          {getItemsCount(
                            cart
                          )}

                        </span>

                      </td>


                      {/* Created */}

                      <td>

                        {formatDate(
                          cart.created_at
                        )}

                      </td>


                      {/* Updated */}

                      <td>

                        {formatDate(
                          cart.updated_at
                        )}

                      </td>


                      {/* Actions */}

                      <td>

                        <div className="cart-actions">

                          <button
                            className="view-cart-btn"
                            onClick={() =>
                              handleView(
                                cart
                              )
                            }
                          >
                            View
                          </button>

                          <button
                            className="delete-cart-btn"
                            onClick={() =>
                              handleDelete(
                                cart.id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>


            {/* =================================
                PAGINATION
            ================================= */}

            <div className="pagination">

              <button
                disabled={
                  currentPage === 1
                }
                onClick={
                  handlePreviousPage
                }
              >
                Previous
              </button>


              <span>

                Page{" "}
                {currentPage}{" "}
                of{" "}
                {totalPages}

              </span>


              <button
                disabled={
                  currentPage ===
                  totalPages
                }
                onClick={
                  handleNextPage
                }
              >
                Next
              </button>

            </div>

          </>

        )}

      </div>


      {/* =====================================
          CART DETAILS MODAL
      ===================================== */}

      {showModal &&
        selectedCart && (

        <div
          className="cart-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="cart-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Modal Header */}

            <div className="cart-modal-header">

              <div>

                <h3>
                  Cart #{selectedCart.id}
                </h3>

                <p>
                  Customer cart details
                </p>

              </div>

              <button
                className="cart-modal-close"
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
              >
                ×
              </button>

            </div>


            {/* Customer */}

            <div className="cart-detail-section">

              <h4>
                Customer
              </h4>

              <div className="cart-customer-detail">

                <div className="cart-user-avatar large">

                  {getUsername(
                    selectedCart
                  )
                    .charAt(0)
                    .toUpperCase()}

                </div>

                <div>

                  <strong>
                    {getUsername(
                      selectedCart
                    )}
                  </strong>

                  <span>
                    {getUserEmail(
                      selectedCart
                    )}
                  </span>

                </div>

              </div>

            </div>


            {/* Cart Information */}

            <div className="cart-detail-section">

              <h4>
                Cart Information
              </h4>

              <div className="cart-info-grid">

                <div>

                  <span>
                    Cart ID
                  </span>

                  <strong>
                    #{selectedCart.id}
                  </strong>

                </div>

                <div>

                  <span>
                    Total Items
                  </span>

                  <strong>
                    {getItemsCount(
                      selectedCart
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    Created
                  </span>

                  <strong>
                    {formatDate(
                      selectedCart.created_at
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    Updated
                  </span>

                  <strong>
                    {formatDate(
                      selectedCart.updated_at
                    )}
                  </strong>

                </div>

              </div>

            </div>


            {/* Cart Items */}

            <div className="cart-detail-section">

              <h4>
                Cart Items
              </h4>

              {getCartItems(
                selectedCart
              ).length > 0 ? (

                <div className="cart-modal-items">

                  {getCartItems(
                    selectedCart
                  ).map((item) => (

                    <div
                      className="cart-modal-item"
                      key={
                        item.id
                      }
                    >

                      <div>

                        <strong>
                          {getProductName(
                            item
                          )}
                        </strong>

                        <span>
                          Category:{" "}
                          {item.category_name ||
                            "-"}
                        </span>

                        <span>
                          Quantity:{" "}
                          {item.quantity}
                        </span>

                      </div>

                      <strong>

                        {item.price
                          ? `Rs. ${item.price}`
                          : "-"}

                      </strong>

                    </div>

                  ))}

                </div>

              ) : (

                <p className="no-items">
                  This cart has no items.
                </p>

              )}

            </div>


            {/* Footer */}

            <div className="cart-modal-footer">

              <button
                className="close-cart-btn"
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
