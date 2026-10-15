"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/apiFetch";

import "./Order.css";

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ==========================================
  // PAGINATION STATES
  // ==========================================

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // ==========================================
  // FETCH ORDERS
  // ==========================================

  const fetchOrders = async (page = currentPage) => {
    try {
      setLoading(true);

      const response = await apiFetch(
        `/order/?page=${page}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();

      // ==========================================
      // NORMAL ARRAY RESPONSE
      // ==========================================

      if (Array.isArray(data)) {
        setOrders(data);

        setTotalOrders(data.length);

        setTotalPages(1);
      }

      // ==========================================
      // PAGINATED RESPONSE
      // ==========================================

      else {
        setOrders(data.results || []);

        setTotalOrders(data.count || 0);

        setTotalPages(
          Math.ceil(
            (data.count || 0) / 10
          )
        );
      }

    } catch (error) {
      console.error(
        "Orders error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD + PAGE CHANGE
  // ==========================================

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  // ==========================================
  // VIEW ORDER
  // ==========================================

  const handleViewOrder = (order) => {
    setSelectedOrder(order);

    setShowModal(true);
  };

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const handleStatusChange = async (
    orderId,
    newStatus
  ) => {
    try {
      setSaving(true);

      const response = await apiFetch(
        `/order/${orderId}/`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Order update error:",
          errorText
        );

        alert(
          "Failed to update order status."
        );

        return;
      }

      const updatedOrder =
        await response.json();

      // Update order in current page
      setOrders(
        (previousOrders) =>
          previousOrders.map(
            (order) =>
              order.id === orderId
                ? updatedOrder
                : order
          )
      );

      // Update selected order inside modal
      if (
        selectedOrder &&
        selectedOrder.id === orderId
      ) {
        setSelectedOrder(
          updatedOrder
        );
      }

    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        "Something went wrong."
      );

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE ORDER
  // ==========================================

  const handleDelete = async (
    orderId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this order?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await apiFetch(
          `/order/${orderId}/`,
          {
            method: "DELETE",
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Delete order error:",
          errorText
        );

        alert(
          "Failed to delete order."
        );

        return;
      }

      // Remove deleted order
      setOrders(
        (previousOrders) =>
          previousOrders.filter(
            (order) =>
              order.id !== orderId
          )
      );

      // Update total count
      setTotalOrders(
        (previous) =>
          Math.max(
            previous - 1,
            0
          )
      );

      // Close modal if deleted order is open
      if (
        selectedOrder &&
        selectedOrder.id === orderId
      ) {
        setSelectedOrder(null);

        setShowModal(false);
      }

      // ==========================================
      // CHECK IF CURRENT PAGE BECAME EMPTY
      // ==========================================

      if (
        orders.length === 1 &&
        currentPage > 1
      ) {
        setCurrentPage(
          (previous) =>
            previous - 1
        );
      } else {
        // Refresh current page
        await fetchOrders(
          currentPage
        );
      }

    } catch (error) {
      console.error(
        "Delete order error:",
        error
      );

      alert(
        "Something went wrong."
      );
    }
  };

  // ==========================================
  // SEARCH + STATUS FILTER
  // ==========================================

  const filteredOrders =
    orders.filter((order) => {
      const searchText =
        search.toLowerCase();

      const customerName =
        order.user?.username ||
        order.username ||
        order.user_name ||
        "";

      const orderId =
        String(order.id);

      const matchesSearch =
        orderId.includes(
          searchText
        ) ||
        customerName
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        order.status ===
          statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "pending":
        return "order-status pending";

      case "processing":
        return "order-status processing";

      case "shipped":
        return "order-status shipped";

      case "delivered":
        return "order-status delivered";

      case "cancelled":
        return "order-status cancelled";

      default:
        return "order-status";
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "N/A";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  // ==========================================
  // PAGINATION HANDLERS
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

  const handlePreviousPage = () => {
    if (
      currentPage > 1
    ) {
      setCurrentPage(
        (previous) =>
          previous - 1
      );
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="order-management">

      {/* ================= HEADER ================= */}

      <div className="order-management-header">

        <div>

          <h2>
            Orders
          </h2>

          <p>
            Manage and monitor customer orders
          </p>

        </div>

      </div>


      {/* ================= TOOLBAR ================= */}

      <div className="order-toolbar">

        <div className="order-search-box">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => {
              setSearch(
                e.target.value
              );

              // Search current page se hoga
            }}
          />

        </div>


        <select
          className="order-status-filter"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
        >

          <option value="all">
            All Statuses
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="processing">
            Processing
          </option>

          <option value="shipped">
            Shipped
          </option>

          <option value="delivered">
            Delivered
          </option>

          <option value="cancelled">
            Cancelled
          </option>

        </select>


        <div className="order-count">

          {totalOrders} Orders

        </div>

      </div>


      {/* ================= TABLE ================= */}

      <div className="orders-table-container">

        {loading ? (

          <div className="order-loading">

            Loading orders...

          </div>

        ) : filteredOrders.length === 0 ? (

          <div className="empty-orders">

            <h3>
              No orders found
            </h3>

            <p>
              There are no orders matching
              your search.
            </p>

          </div>

        ) : (

          <table className="orders-table">

            <thead>

              <tr>

                <th>
                  Order
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Total
                </th>

                <th>
                  Status
                </th>

                <th>
                  Date
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredOrders.map(
                (order) => {

                  const customerName =
                    order.user_name ||
                    order.user?.username ||
                    order.username ||
                    "Unknown";

                  return (

                    <tr
                      key={order.id}
                    >

                      {/* ORDER ID */}

                      <td>

                        <strong>
                          #{order.id}
                        </strong>

                      </td>


                      {/* CUSTOMER */}

                      <td>

                        <div className="customer-info">

                          <div className="customer-avatar">

                            {customerName
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <span>
                            {customerName}
                          </span>

                        </div>

                      </td>


                      {/* TOTAL */}

                      <td>

                        <strong>
                          Rs.{" "}
                          {
                            order.total_amount
                          }
                        </strong>

                      </td>


                      {/* STATUS */}

                      <td>

                        <span
                          className={getStatusClass(
                            order.status
                          )}
                        >

                          {
                            order.status
                          }

                        </span>

                      </td>


                      {/* DATE */}

                      <td>

                        {formatDate(
                          order.created_at
                        )}

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="order-actions">

                          <button
                            className="view-order-btn"
                            onClick={() =>
                              handleViewOrder(
                                order
                              )
                            }
                          >
                            View
                          </button>


                          <button
                            className="delete-order-btn"
                            onClick={() =>
                              handleDelete(
                                order.id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  );
                }
              )}

            </tbody>

          </table>

        )}

      </div>


      {/* ================= PAGINATION ================= */}

      {!loading && (

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

            Page {currentPage} of{" "}
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

      )}


      {/* ================= ORDER DETAILS MODAL ================= */}

      {showModal &&
        selectedOrder && (

          <div className="order-modal-overlay">

            <div className="order-modal">

              {/* HEADER */}

              <div className="order-modal-header">

                <div>

                  <h2>
                    Order #
                    {
                      selectedOrder.id
                    }
                  </h2>

                  <p>
                    Order details and management
                  </p>

                </div>


                <button
                  className="order-close-btn"
                  onClick={() => {

                    setShowModal(
                      false
                    );

                    setSelectedOrder(
                      null
                    );

                  }}
                >
                  ×
                </button>

              </div>


              {/* CUSTOMER */}

              <div className="order-detail-section">

                <h3>
                  Customer Information
                </h3>

                <div className="order-detail-grid">

                  <div>

                    <span>
                      Customer
                    </span>

                    <strong>
                      {
                        selectedOrder.user_name ||
                        selectedOrder.user?.username ||
                        selectedOrder.username ||
                        "Unknown"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Order Date
                    </span>

                    <strong>

                      {formatDate(
                        selectedOrder.created_at
                      )}

                    </strong>

                  </div>

                </div>

              </div>


              {/* SHIPPING */}

              <div className="order-detail-section">

                <h3>
                  Shipping Address
                </h3>

                <div className="shipping-address">

                  {
                    selectedOrder.shipping_address ||
                    "No shipping address"
                  }

                </div>

              </div>


              {/* ITEMS */}

              <div className="order-detail-section">

                <h3>
                  Order Items
                </h3>

                <div className="order-items">

                  {selectedOrder.items &&
                  selectedOrder.items.length >
                    0 ? (

                    selectedOrder.items.map(
                      (item) => (

                        <div
                          className="order-item"
                          key={item.id}
                        >

                          <div>

                            <strong>

                              {
                                item.product_name ||
                                item.product?.name ||
                                `Product #${item.product}`
                              }

                            </strong>

                            <span>

                              Quantity:{" "}
                              {
                                item.quantity
                              }

                            </span>

                          </div>


                          <strong>

                            Rs.{" "}
                            {
                              item.price
                            }

                          </strong>

                        </div>

                      )
                    )

                  ) : (

                    <p className="no-items">

                      No items available.

                    </p>

                  )}

                </div>

              </div>


              {/* TOTAL */}

              <div className="order-total">

                <span>
                  Total Amount
                </span>

                <strong>

                  Rs.{" "}
                  {
                    selectedOrder.total_amount
                  }

                </strong>

              </div>


              {/* STATUS */}

              <div className="order-status-update">

                <label>
                  Update Order Status
                </label>

                <select
                  value={
                    selectedOrder.status ||
                    ""
                  }
                  disabled={saving}
                  onChange={(e) =>
                    handleStatusChange(
                      selectedOrder.id,
                      e.target.value
                    )
                  }
                >

                  <option value="pending">
                    Pending
                  </option>

                  <option value="processing">
                    Processing
                  </option>

                  <option value="shipped">
                    Shipped
                  </option>

                  <option value="delivered">
                    Delivered
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>

                </select>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}