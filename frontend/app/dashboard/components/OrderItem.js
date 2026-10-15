"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/apiFetch";

import "./OrderItem.css";

export default function OrderItemManagement() {
  const [orderItems, setOrderItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");

  // ==========================================
  // PAGINATION STATES
  // ==========================================

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrderItems, setTotalOrderItems] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    order: "",
    product: "",
    quantity: "",
    price: "",
  });

  // ==========================================
  // FETCH ORDER ITEMS
  // ==========================================

  const fetchOrderItems = async (
    page = currentPage
  ) => {
    try {
      setLoading(true);

      const response = await apiFetch(
        `/orderitem/?page=${page}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch order items"
        );
      }

      const data = await response.json();

      // ==========================================
      // NORMAL ARRAY RESPONSE
      // ==========================================

      if (Array.isArray(data)) {
        setOrderItems(data);

        setTotalOrderItems(
          data.length
        );

        setTotalPages(1);
      }

      // ==========================================
      // PAGINATED RESPONSE
      // ==========================================

      else {
        setOrderItems(
          data.results || []
        );

        setTotalOrderItems(
          data.count || 0
        );

        setTotalPages(
          Math.ceil(
            (data.count || 0) / 10
          )
        );
      }

    } catch (error) {
      console.error(
        "Order items error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH ORDERS
  // ==========================================

  const fetchOrders = async () => {
    try {
      const response = await apiFetch(
        "/orders/"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch orders"
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders(
          data.results || []
        );
      }

    } catch (error) {
      console.error(
        "Orders error:",
        error
      );
    }
  };

  // ==========================================
  // FETCH PRODUCTS
  // ==========================================

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(
        "/products/"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch products"
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts(
          data.results || []
        );
      }

    } catch (error) {
      console.error(
        "Products error:",
        error
      );
    }
  };

  // ==========================================
  // INITIAL LOAD + PAGE CHANGE
  // ==========================================

  useEffect(() => {
    fetchOrderItems(
      currentPage
    );

    fetchOrders();

    fetchProducts();
  }, [currentPage]);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  // ==========================================
  // ADD ORDER ITEM
  // ==========================================

  const handleAddItem = () => {
    setEditingItem(null);

    setFormData({
      order: "",
      product: "",
      quantity: "",
      price: "",
    });

    setShowModal(true);
  };

  // ==========================================
  // EDIT ORDER ITEM
  // ==========================================

  const handleEdit = (item) => {
    setEditingItem(item);

    setFormData({
      order:
        item.order?.id ||
        item.order ||
        "",

      product:
        item.product?.id ||
        item.product ||
        "",

      quantity:
        item.quantity || "",

      price:
        item.price || "",
    });

    setShowModal(true);
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        order: Number(
          formData.order
        ),

        product: Number(
          formData.product
        ),

        quantity: Number(
          formData.quantity
        ),

        price: Number(
          formData.price
        ),
      };

      let response;

      // ==========================================
      // UPDATE
      // ==========================================

      if (editingItem) {
        response = await apiFetch(
          `/order-items/${editingItem.id}/`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );
      }

      // ==========================================
      // CREATE
      // ==========================================

      else {
        response = await apiFetch(
          "/order-items/",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Order item save error:",
          errorText
        );

        alert(
          "Failed to save order item."
        );

        return;
      }

      // Refresh current page
      await fetchOrderItems(
        currentPage
      );

      setShowModal(false);

      setFormData({
        order: "",
        product: "",
        quantity: "",
        price: "",
      });

    } catch (error) {
      console.error(
        "Save order item error:",
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
  // DELETE
  // ==========================================

  const handleDelete = async (
    id
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this order item?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await apiFetch(
          `/order-items/${id}/`,
          {
            method: "DELETE",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to delete order item"
        );
      }

      // Remove from current page
      setOrderItems(
        (previousItems) =>
          previousItems.filter(
            (item) =>
              item.id !== id
          )
      );

      // Update total count
      setTotalOrderItems(
        (previous) =>
          Math.max(
            previous - 1,
            0
          )
      );

      // ==========================================
      // IF CURRENT PAGE BECOMES EMPTY
      // MOVE TO PREVIOUS PAGE
      // ==========================================

      if (
        orderItems.length === 1 &&
        currentPage > 1
      ) {
        setCurrentPage(
          (previous) =>
            previous - 1
        );
      } else {
        // Refresh current page
        await fetchOrderItems(
          currentPage
        );
      }

    } catch (error) {
      console.error(
        "Delete order item error:",
        error
      );

      alert(
        "Failed to delete order item."
      );
    }
  };

  // ==========================================
  // SEARCH + FILTER
  // ==========================================

  const filteredItems =
    orderItems.filter(
      (item) => {
        const searchText =
          search.toLowerCase();

        const orderId =
          String(
            item.order?.id ||
              item.order ||
              ""
          );

        const productName =
          item.product?.name ||
          item.product_name ||
          "";

        const matchesSearch =
          orderId.includes(
            searchText
          ) ||
          productName
            .toLowerCase()
            .includes(
              searchText
            );

        const currentOrder =
          item.order?.id ||
          item.order;

        const matchesOrder =
          orderFilter ===
            "all" ||
          String(
            currentOrder
          ) ===
            String(
              orderFilter
            );

        return (
          matchesSearch &&
          matchesOrder
        );
      }
    );

  // ==========================================
  // GET PRODUCT NAME
  // ==========================================

  const getProductName = (
    item
  ) => {
    return (
      item.product?.name ||
      item.product_name ||
      `Product #${item.product}`
    );
  };

  // ==========================================
  // SUBTOTAL
  // ==========================================

  const getSubtotal = (
    item
  ) => {
    return (
      Number(
        item.price || 0
      ) *
      Number(
        item.quantity || 0
      )
    ).toFixed(2);
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
    <div className="order-item-management">

      {/* ================= HEADER ================= */}

      <div className="order-item-header">

        <div>

          <h2>
            Order Items
          </h2>

          <p>
            Manage products included in customer orders
          </p>

        </div>

        <button
          className="add-order-item-btn"
          onClick={
            handleAddItem
          }
        >
          + Add Order Item
        </button>

      </div>


      {/* ================= TOOLBAR ================= */}

      <div className="order-item-toolbar">

        <div className="order-item-search">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search order or product..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>


        <select
          className="order-filter"
          value={
            orderFilter
          }
          onChange={(e) =>
            setOrderFilter(
              e.target.value
            )
          }
        >

          <option value="all">
            All Orders
          </option>

          {orders.map(
            (order) => (

              <option
                key={order.id}
                value={order.id}
              >
                Order #{order.id}
              </option>

            )
          )}

        </select>


        <div className="order-item-count">

          {totalOrderItems} Items

        </div>

      </div>


      {/* ================= TABLE ================= */}

      <div className="order-items-table-container">

        {loading ? (

          <div className="order-item-loading">

            Loading order items...

          </div>

        ) : filteredItems.length === 0 ? (

          <div className="empty-order-items">

            <h3>
              No order items found
            </h3>

            <p>
              There are no order items matching your search.
            </p>

          </div>

        ) : (

          <table className="order-items-table">

            <thead>

              <tr>

                <th>
                  ID
                </th>

                <th>
                  Order
                </th>

                <th>
                  Product
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Unit Price
                </th>

                <th>
                  Subtotal
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredItems.map(
                (item) => {

                  const orderId =
                    item.order?.id ||
                    item.order;

                  return (

                    <tr
                      key={item.id}
                    >

                      {/* ID */}

                      <td>
                        #{item.id}
                      </td>


                      {/* ORDER */}

                      <td>

                        <span className="order-id-badge">

                          Order #
                          {orderId}

                        </span>

                      </td>


                      {/* PRODUCT */}

                      <td>

                        <div className="item-product">

                          <div className="item-product-icon">

                            {getProductName(
                              item
                            )
                              .charAt(
                                0
                              )
                              .toUpperCase()}

                          </div>

                          <strong>

                            {getProductName(
                              item
                            )}

                          </strong>

                        </div>

                      </td>


                      {/* QUANTITY */}

                      <td>

                        <span className="quantity-badge">

                          ×{" "}
                          {
                            item.quantity
                          }

                        </span>

                      </td>


                      {/* PRICE */}

                      <td>

                        Rs.{" "}
                        {item.price}

                      </td>


                      {/* SUBTOTAL */}

                      <td>

                        <strong>

                          Rs.{" "}
                          {getSubtotal(
                            item
                          )}

                        </strong>

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="order-item-actions">

                          <button
                            className="order-item-edit-btn"
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                          >
                            Edit
                          </button>


                          <button
                            className="order-item-delete-btn"
                            onClick={() =>
                              handleDelete(
                                item.id
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

      )}


      {/* ================= MODAL ================= */}

      {showModal && (

        <div className="order-item-modal-overlay">

          <div className="order-item-modal">

            {/* HEADER */}

            <div className="order-item-modal-header">

              <div>

                <h2>

                  {editingItem
                    ? "Edit Order Item"
                    : "Add Order Item"}

                </h2>

                <p>

                  {editingItem
                    ? "Update order item information"
                    : "Add a product to an order"}

                </p>

              </div>


              <button
                className="order-item-close-btn"
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
              >
                ×
              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* ORDER */}

              <div className="order-item-form-group">

                <label>
                  Order
                </label>

                <select
                  name="order"
                  value={
                    formData.order
                  }
                  onChange={
                    handleChange
                  }
                  required
                >

                  <option value="">
                    Select Order
                  </option>

                  {orders.map(
                    (order) => (

                      <option
                        key={order.id}
                        value={order.id}
                      >
                        Order #
                        {order.id}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* PRODUCT */}

              <div className="order-item-form-group">

                <label>
                  Product
                </label>

                <select
                  name="product"
                  value={
                    formData.product
                  }
                  onChange={
                    handleChange
                  }
                  required
                >

                  <option value="">
                    Select Product
                  </option>

                  {products.map(
                    (product) => (

                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >
                        {
                          product.name
                        }
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* QUANTITY + PRICE */}

              <div className="order-item-form-row">

                <div className="order-item-form-group">

                  <label>
                    Quantity
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    value={
                      formData.quantity
                    }
                    onChange={
                      handleChange
                    }
                    min="1"
                    required
                  />

                </div>


                <div className="order-item-form-group">

                  <label>
                    Price
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={
                      formData.price
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                    step="0.01"
                    required
                  />

                </div>

              </div>


              {/* ACTIONS */}

              <div className="order-item-modal-actions">

                <button
                  type="button"
                  className="order-item-cancel-btn"
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="order-item-save-btn"
                  disabled={
                    saving
                  }
                >

                  {saving
                    ? "Saving..."
                    : editingItem
                    ? "Update Order Item"
                    : "Create Order Item"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}