"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/apiFetch";

import "./ProductManagement.css";

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    subcategory: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (image.startsWith("http")) {
      return image;
    }

    return `${API_URL}${image}`;
  };

  const fetchProducts = async (page = currentPage) => {
    try {
      setLoading(true);

      const response = await apiFetch(
        `/products/?page=${page}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setProducts(data);
        setTotalProducts(data.length);
        setTotalPages(1);
      } else {
        setProducts(data.results || []);
        setTotalProducts(data.count || 0);

        const pageSize = 10;

        setTotalPages(
          Math.max(
            1,
            Math.ceil(
              (data.count || 0) / pageSize
            )
          )
        );
      }
    } catch (error) {
      console.error(
        "Products error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiFetch(
        "/categories/"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch categories"
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories(
          data.results || []
        );
      }
    } catch (error) {
      console.error(
        "Categories error:",
        error
      );
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    try {
      const response = await apiFetch("/subcategories/");
      if (response.ok) {
        const data = await response.json();
        setSubcategories(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error("Sub category fetch error:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      image: file,
    }));

    setImagePreview(
      URL.createObjectURL(file)
    );
  };

  const handleAddProduct = () => {
    setEditingProduct(null);

    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      subcategory: "",
      image: null,
    });

    setImagePreview("");
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      stock: product.stock || "",
      category:
        product.category?.id ||
        product.category ||
        "",
      subcategory: product.subcategory || "",
      image: null,
    });

    setImagePreview(
      product.image
        ? getImageUrl(product.image)
        : ""
    );

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);

    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      subcategory: "",
      image: null,
    });

    setImagePreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const data = new FormData();

      data.append(
        "name",
        formData.name
      );

      data.append(
        "description",
        formData.description
      );

      data.append(
        "price",
        formData.price
      );

      data.append(
        "stock",
        formData.stock
      );

      data.append(
        "category",
        formData.category
      );

      data.append("subcategory", formData.subcategory || "");

      if (formData.image) {
        data.append(
          "image",
          formData.image
        );
      }

      let response;

      if (editingProduct) {
        response = await apiFetch(
          `/products/${editingProduct.id}/`,
          {
            method: "PUT",
            body: data,
          }
        );
      } else {
        response = await apiFetch(
          "/products/",
          {
            method: "POST",
            body: data,
          }
        );
      }

      if (!response.ok) {
        const errorData =
          await response.text();

        console.error(
          "Product save error:",
          errorData
        );

        alert(
          "Failed to save product."
        );

        return;
      }

      await fetchProducts(
        currentPage
      );

      handleCloseModal();
    } catch (error) {
      console.error(
        "Save product error:",
        error
      );

      alert(
        "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this product?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await apiFetch(
          `/products/${id}/`,
          {
            method: "DELETE",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to delete product"
        );
      }

      setProducts(
        (previousProducts) =>
          previousProducts.filter(
            (product) =>
              product.id !== id
          )
      );

      setTotalProducts(
        (previous) =>
          Math.max(previous - 1, 0)
      );

      await fetchProducts(
        currentPage
      );
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      alert(
        "Failed to delete product."
      );
    }
  };

  const filteredProducts =
    products.filter((product) => {
      const searchText =
        search.toLowerCase();

      return (
        product.name
          ?.toLowerCase()
          .includes(searchText) ||
        product.description
          ?.toLowerCase()
          .includes(searchText)
      );
    });

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
    if (currentPage > 1) {
      setCurrentPage(
        (previous) =>
          previous - 1
      );
    }
  };

  return (
    <div className="product-management">

      <div className="product-management-header">

        <div>
          <h2>Products</h2>

          <p>
            Manage your store products
          </p>
        </div>

        <button
          className="add-product-btn"
          onClick={
            handleAddProduct
          }
        >
          + Add Product
        </button>

      </div>

      <div className="product-toolbar">

        <div className="search-box">

          <span>🔍</span>

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <div className="product-count">
          {totalProducts} Products
        </div>

      </div>

      <div className="products-table-container">

        {loading ? (

          <div className="product-loading">
            Loading products...
          </div>

        ) : filteredProducts.length === 0 ? (

          <div className="empty-products">

            <h3>
              No products found
            </h3>

            <p>
              Add a product to get started.
            </p>

          </div>

        ) : (

          <>

            <table className="products-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Feedback</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {filteredProducts.map(
                  (product) => (

                    <tr
                      key={
                        product.id
                      }
                    >

                      <td>
                        #{product.id}
                      </td>

                      <td>

                        <div className="product-info">

                          <div className="product-image-box">

                            {product.image ? (

                              <img
                                src={getImageUrl(
                                  product.image
                                )}
                                alt={
                                  product.name
                                }
                                className="product-table-image"
                              />

                            ) : (

                              <div className="product-image-placeholder">
                                📦
                              </div>

                            )}

                          </div>

                          <div className="product-name">

                            <strong>
                              {product.name}
                            </strong>

                            <small>
                              {product.description
                                ? product.description.substring(
                                    0,
                                    50
                                  )
                                : "No description"}
                            </small>

                          </div>

                        </div>

                      </td>

                      <td>
                        {product.category_name ||
                          product.category?.name ||
                          "N/A"}
                        {product.subcategory_name && (
                          <small className="table-subcategory">
                            {product.subcategory_name}
                          </small>
                        )}
                      </td>

                      <td>
                        Rs. {product.price}
                      </td>

                      <td>

                        <span
                          className={
                            product.stock > 10
                              ? "stock good"
                              : product.stock > 0
                              ? "stock low"
                              : "stock out"
                          }
                        >
                          {product.stock}
                        </span>

                      </td>

                      <td>

                        <div className="feedback-counts">

                          <span className="positive-feedback">
                            👍 {product.positive_feedback || 0}
                          </span>

                          <span className="negative-feedback">
                            👎 {product.negative_feedback || 0}
                          </span>

                        </div>

                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            className="edit-btn"
                            onClick={() =>
                              handleEdit(
                                product
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDelete(
                                product.id
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

          </>

        )}

      </div>

      {showModal && (

        <div className="modal-overlay">

          <div className="product-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p>
                  {editingProduct
                    ? "Update product information"
                    : "Add a new product to your store"}
                </p>

              </div>

              <button
                type="button"
                className="close-modal"
                onClick={
                  handleCloseModal
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-group">

                <label>
                  Product Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter product name"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter product description"
                  rows="4"
                />

              </div>

              <div className="form-row">

                <div className="form-group">

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
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Stock
                  </label>

                  <input
                    type="number"
                    name="stock"
                    value={
                      formData.stock
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0"
                    min="0"
                    required
                  />

                </div>

              </div>

              <div className="form-group">

                <label>
                  Category
                </label>

                <select
                  name="category"
                  value={
                    formData.category
                  }
                  onChange={
                    handleChange
                  }
                  required
                >

                  <option value="">
                    Select Category
                  </option>

                  {categories.map(
                    (category) => (

                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {category.name}
                      </option>

                    )
                  )}

                </select>

              </div>

              <div className="form-group">
                <label>Sub category</label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  disabled={!formData.category}
                >
                  <option value="">
                    {formData.category ? "No sub category" : "Select a category first"}
                  </option>
                  {subcategories
                    .filter((sub) => String(sub.category) === String(formData.category))
                    .map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">

                <label>
                  Product Image
                </label>

                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                  className="image-input"
                />

                {imagePreview && (

                  <div className="image-preview-wrapper">

                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="image-preview"
                    />

                  </div>

                )}

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    handleCloseModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Create Product"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}