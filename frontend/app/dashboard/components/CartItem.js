"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/apiFetch";
import "./CartItem.css";

export default function CartItem() {
  const [cartItems, setCartItems] = useState([]);
  const [carts, setCarts] = useState([]);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [cartFilter, setCartFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  // ==========================================
  // PAGINATION
  // ==========================================

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCartItems, setTotalCartItems] = useState(0);

  const [showModal, setShowModal] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    cart: "",
    product: "",
    quantity: 1,
  });

  // ==========================================
  // FETCH CART ITEMS
  // ==========================================

  const fetchCartItems = async (page = currentPage) => {
    try {
      setLoading(true);

      const response = await apiFetch(
        `/cartitem/?page=${page}`
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Cart Items API error:",
          response.status,
          errorText
        );

        return;
      }

      const data = await response.json();

      // If API returns normal array
      if (Array.isArray(data)) {
        setCartItems(data);

        setTotalCartItems(data.length);

        setTotalPages(1);
      }

      // If API returns paginated response
      else {
        setCartItems(data.results || []);

        setTotalCartItems(data.count || 0);

        setTotalPages(
          Math.ceil(
            (data.count || 0) / 10
          )
        );
      }
    } catch (error) {
      console.error(
        "Error fetching cart items:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH CARTS
  // ==========================================

  const fetchCarts = async () => {
    try {
      const response = await apiFetch(
        "/carts/"
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch carts"
        );

        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setCarts(data);
      } else {
        setCarts(data.results || []);
      }
    } catch (error) {
      console.error(
        "Error fetching carts:",
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
        console.error(
          "Failed to fetch products"
        );

        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts(data.results || []);
      }
    } catch (error) {
      console.error(
        "Error fetching products:",
        error
      );
    }
  };

  // ==========================================
  // INITIAL LOAD + PAGE CHANGE
  // ==========================================

  useEffect(() => {
    fetchCartItems(currentPage);
  }, [currentPage]);

  // Load carts and products only once
  useEffect(() => {
    fetchCarts();
    fetchProducts();
  }, []);

  // ==========================================
  // GET CART ID
  // ==========================================

  const getCartId = (item) => {
    return (
      item.cart?.id ||
      item.cart_id ||
      item.cart
    );
  };

  // ==========================================
  // GET PRODUCT ID
  // ==========================================

  const getProductId = (item) => {
    return (
      item.product?.id ||
      item.product_id ||
      item.product
    );
  };

  // ==========================================
  // GET PRODUCT NAME
  // ==========================================

  const getProductName = (item) => {
    return (
      item.product?.name ||
      item.product_name ||
      `Product #${
        getProductId(item) || "-"
      }`
    );
  };

  // ==========================================
  // GET USERNAME
  // ==========================================

  const getUsername = (item) => {
    return (
      item.cart?.user?.username ||
      item.username ||
      `Cart #${
        getCartId(item) || "-"
      }`
    );
  };

  // ==========================================
  // FILTER
  // ==========================================

  const filteredItems = cartItems.filter(
    (item) => {
      const productName =
        getProductName(item).toLowerCase();

      const username =
        getUsername(item).toLowerCase();

      const cartId = String(
        getCartId(item) || ""
      );

      const searchText =
        search.toLowerCase();

      const matchesSearch =
        productName.includes(searchText) ||
        username.includes(searchText) ||
        cartId.includes(searchText);

      const matchesCart =
        cartFilter === "all" ||
        String(getCartId(item)) ===
          String(cartFilter);

      return (
        matchesSearch &&
        matchesCart
      );
    }
  );

  // ==========================================
  // OPEN ADD MODAL
  // ==========================================

  const handleAdd = () => {
    setEditingItem(null);

    setFormData({
      cart: "",
      product: "",
      quantity: 1,
    });

    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const handleEdit = (item) => {
    setEditingItem(item);

    setFormData({
      cart: getCartId(item) || "",
      product: getProductId(item) || "",
      quantity: item.quantity || 1,
    });

    setShowModal(true);
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,

      [name]:
        name === "quantity"
          ? Number(value)
          : value,
    }));
  };

  // ==========================================
  // SAVE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cart) {
      alert("Please select a cart.");
      return;
    }

    if (!formData.product) {
      alert("Please select a product.");
      return;
    }

    if (
      !formData.quantity ||
      formData.quantity < 1
    ) {
      alert(
        "Quantity must be at least 1."
      );
      return;
    }

    try {
      let response;

      // ======================================
      // UPDATE
      // ======================================

      if (editingItem) {
        response = await apiFetch(
          `/cart-items/${editingItem.id}/`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              quantity:
                formData.quantity,
            }),
          }
        );
      }

      // ======================================
      // CREATE
      // ======================================

      else {
        response = await apiFetch(
          "/cart-items/",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              cart: Number(
                formData.cart
              ),

              product: Number(
                formData.product
              ),

              quantity: Number(
                formData.quantity
              ),
            }),
          }
        );
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Save cart item error:",
          errorText
        );

        alert(
          "Failed to save cart item."
        );

        return;
      }

      const savedItem =
        await response.json();

      // ======================================
      // UPDATE UI
      // ======================================

      if (editingItem) {
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? savedItem
              : item
          )
        );
      }

      // ======================================
      // ADD UI
      // ======================================

      else {
        setCartItems((prev) => [
          ...prev,
          savedItem,
        ]);

        setTotalCartItems(
          (prev) => prev + 1
        );
      }

      setShowModal(false);

      setEditingItem(null);

      alert(
        editingItem
          ? "Cart item updated successfully."
          : "Cart item added successfully."
      );

    } catch (error) {
      console.error(
        "Error saving cart item:",
        error
      );

      alert(
        "Something went wrong."
      );
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (itemId) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this cart item?"
      );

    if (!confirmDelete) return;

    try {
      const response = await apiFetch(
        `/cart-items/${itemId}/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Delete cart item error:",
          errorText
        );

        alert(
          "Failed to delete cart item."
        );

        return;
      }

      setCartItems((prev) =>
        prev.filter(
          (item) =>
            item.id !== itemId
        )
      );

      setTotalCartItems(
        (prev) =>
          Math.max(0, prev - 1)
      );

      alert(
        "Cart item deleted successfully."
      );

      // If current page becomes empty,
      // go to previous page
      if (
        cartItems.length === 1 &&
        currentPage > 1
      ) {
        setCurrentPage(
          (prev) => prev - 1
        );
      } else {
        fetchCartItems(currentPage);
      }

    } catch (error) {
      console.error(
        "Error deleting cart item:",
        error
      );

      alert(
        "Something went wrong."
      );
    }
  };

  // ==========================================
  // PRODUCT PRICE
  // ==========================================

  const getProductPrice = (item) => {
    if (item.product?.price) {
      return Number(
        item.product.price
      );
    }

    if (item.price) {
      return Number(item.price);
    }

    const product = products.find(
      (p) =>
        String(p.id) ===
        String(getProductId(item))
    );

    return Number(
      product?.price || 0
    );
  };

  // ==========================================
  // SUBTOTAL
  // ==========================================

  const getSubtotal = (item) => {
    const price =
      getProductPrice(item);

    const quantity =
      Number(item.quantity || 0);

    return (
      price * quantity
    ).toFixed(2);
  };

  // ==========================================
  // NEXT PAGE
  // ==========================================

  const handleNextPage = () => {
    if (
      currentPage < totalPages
    ) {
      setCurrentPage(
        (prev) => prev + 1
      );
    }
  };

  // ==========================================
  // PREVIOUS PAGE
  // ==========================================

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(
        (prev) => prev - 1
      );
    }
  };

  return (
    <div className="cart-item-management">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="cart-item-header">

        <div>

          <h2>
            Cart Items
          </h2>

          <p>
            Manage products inside customer carts
          </p>

        </div>

        <button
          className="add-cart-item-btn"
          onClick={handleAdd}
        >
          + Add Cart Item
        </button>

      </div>


      {/* =====================================
          TOOLBAR
      ===================================== */}

      <div className="cart-item-toolbar">

        <div className="cart-item-search">

          <span>
            🔎
          </span>

          <input
            type="text"
            placeholder="Search product, customer or cart..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <select
          value={cartFilter}
          onChange={(e) =>
            setCartFilter(
              e.target.value
            )
          }
        >

          <option value="all">
            All Carts
          </option>

          {carts.map((cart) => (

            <option
              key={cart.id}
              value={cart.id}
            >
              Cart #{cart.id}
            </option>

          ))}

        </select>


        <button
          className="refresh-cart-item-btn"
          onClick={() =>
            fetchCartItems(currentPage)
          }
        >
          ↻ Refresh
        </button>

      </div>


      {/* =====================================
          TABLE
      ===================================== */}

      <div className="cart-item-table-container">

        {loading ? (

          <div className="cart-item-loading">
            Loading cart items...
          </div>

        ) : filteredItems.length === 0 ? (

          <div className="cart-item-empty">

            <div className="cart-item-empty-icon">
              🛒
            </div>

            <h3>
              No cart items found
            </h3>

            <p>
              {search
                ? "Try a different search."
                : "There are no cart items available."}
            </p>

          </div>

        ) : (

          <table className="cart-item-table">

            <thead>

              <tr>

                <th>
                  Cart
                </th>

                <th>
                  Customer
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
                (item) => (

                  <tr key={item.id}>

                    {/* Cart */}

                    <td>

                      <span className="cart-number">
                        #{getCartId(item)}
                      </span>

                    </td>


                    {/* Customer */}

                    <td>

                      <div className="cart-item-user">

                        <div className="cart-item-avatar">

                          {getUsername(item)
                            .charAt(0)
                            .toUpperCase()}

                        </div>

                        <span>
                          {getUsername(item)}
                        </span>

                      </div>

                    </td>


                    {/* Product */}

                    <td>

                      <div className="cart-item-product">

                        <div className="product-mini-icon">
                          📦
                        </div>

                        <span>
                          {getProductName(item)}
                        </span>

                      </div>

                    </td>


                    {/* Quantity */}

                    <td>

                      <span className="quantity-badge">
                        {item.quantity}
                      </span>

                    </td>


                    {/* Price */}

                    <td>

                      Rs.{" "}
                      {getProductPrice(
                        item
                      ).toFixed(2)}

                    </td>


                    {/* Subtotal */}

                    <td>

                      <strong>

                        Rs.{" "}
                        {getSubtotal(
                          item
                        )}

                      </strong>

                    </td>


                    {/* Actions */}

                    <td>

                      <div className="cart-item-actions">

                        <button
                          className="edit-cart-item-btn"
                          onClick={() =>
                            handleEdit(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-cart-item-btn"
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

                )
              )}

            </tbody>

          </table>

        )}

      </div>


      {/* =====================================
          PAGINATION
      ===================================== */}

      {!loading && (

  <div className="pagination">

    <button
      disabled={currentPage === 1}
      onClick={handlePreviousPage}
    >
      Previous
    </button>

    <span>
      Page {currentPage} of {totalPages}
    </span>

    <button
      disabled={currentPage === totalPages}
      onClick={handleNextPage}
    >
      Next
    </button>

  </div>

)}


      {/* =====================================
          ADD / EDIT MODAL
      ===================================== */}

      {showModal && (

        <div
          className="cart-item-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="cart-item-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Header */}

            <div className="cart-item-modal-header">

              <div>

                <h3>

                  {editingItem
                    ? "Edit Cart Item"
                    : "Add Cart Item"}

                </h3>

                <p>

                  {editingItem
                    ? "Update cart item quantity"
                    : "Add a product to a customer cart"}

                </p>

              </div>


              <button
                className="cart-item-modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            {/* Form */}

            <form
              onSubmit={handleSubmit}
            >

              {/* Cart */}

              <div className="cart-item-form-group">

                <label>
                  Cart
                </label>

                <select
                  name="cart"
                  value={
                    formData.cart
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    !!editingItem
                  }
                  required
                >

                  <option value="">
                    Select Cart
                  </option>

                  {carts.map(
                    (cart) => (

                      <option
                        key={cart.id}
                        value={cart.id}
                      >

                        Cart #{cart.id} —{" "}

                        {cart.user?.username ||
                          cart.username ||
                          `User #${
                            cart.user_id || "-"
                          }`}

                      </option>

                    )
                  )}

                </select>

              </div>


              {/* Product */}

              <div className="cart-item-form-group">

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
                  disabled={
                    !!editingItem
                  }
                  required
                >

                  <option value="">
                    Select Product
                  </option>

                  {products.map(
                    (product) => (

                      <option
                        key={product.id}
                        value={product.id}
                      >

                        {product.name}

                        {product.price
                          ? ` — Rs. ${product.price}`
                          : ""}

                      </option>

                    )
                  )}

                </select>

              </div>


              {/* Quantity */}

              <div className="cart-item-form-group">

                <label>
                  Quantity
                </label>

                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={
                    formData.quantity
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>


              {/* Actions */}

              <div className="cart-item-modal-actions">

                <button
                  type="button"
                  className="cancel-cart-item-btn"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-cart-item-btn"
                >

                  {editingItem
                    ? "Save Changes"
                    : "Add Item"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}
