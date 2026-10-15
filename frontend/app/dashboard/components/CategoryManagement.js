"use client";

import { useEffect, useState } from "react";
import SubCategoryManager from "./SubCategoryManager";
import { apiFetch } from "../../components/apiFetch";

import "./CategoryManagement.css";

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState(null);

  const [formData, setFormData] = useState({
    name: "",
    image: null,
  });

  const [imagePreview, setImagePreview] =
    useState("");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (image.startsWith("http")) {
      return image;
    }

    return `${API_URL}${image}`;
  };

  const fetchCategories = async (
    page = currentPage
  ) => {
    try {
      setLoading(true);

      const response = await apiFetch(
        `/categories/?page=${page}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch categories"
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setCategories(data);
        setTotalCategories(data.length);
        setTotalPages(1);
      } else {
        setCategories(
          data.results || []
        );

        setTotalCategories(
          data.count || 0
        );

        setTotalPages(
          Math.max(
            1,
            Math.ceil(
              (data.count || 0) / 10
            )
          )
        );
      }
    } catch (error) {
      console.error(
        "Categories error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(
      currentPage
    );
  }, [currentPage]);

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]:
        e.target.value,
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

  const handleAddCategory = () => {
    setEditingCategory(null);

    setFormData({
      name: "",
      image: null,
    });

    setImagePreview("");
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);

    setFormData({
      name: category.name || "",
      image: null,
    });

    setImagePreview(
      category.image
        ? getImageUrl(
            category.image
          )
        : ""
    );

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);

    setFormData({
      name: "",
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
        formData.name.trim()
      );

      if (formData.image) {
        data.append(
          "image",
          formData.image
        );
      }

      let response;

      if (editingCategory) {
        response = await apiFetch(
          `/categories/${editingCategory.id}/`,
          {
            method: "PUT",
            body: data,
          }
        );
      } else {
        response = await apiFetch(
          "/categories/",
          {
            method: "POST",
            body: data,
          }
        );
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Category save error:",
          errorText
        );

        alert(
          "Failed to save category."
        );

        return;
      }

      await fetchCategories(
        currentPage
      );

      handleCloseModal();
    } catch (error) {
      console.error(
        "Save category error:",
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
        "Are you sure you want to delete this category?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await apiFetch(
          `/categories/${id}/`,
          {
            method: "DELETE",
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Delete category error:",
          errorText
        );

        alert(
          "This category cannot be deleted."
        );

        return;
      }

      setCategories(
        (previous) =>
          previous.filter(
            (category) =>
              category.id !== id
          )
      );

      setTotalCategories(
        (previous) =>
          Math.max(
            previous - 1,
            0
          )
      );

      await fetchCategories(
        currentPage
      );
    } catch (error) {
      console.error(
        "Delete category error:",
        error
      );

      alert(
        "Failed to delete category."
      );
    }
  };

  const filteredCategories =
    categories.filter((category) =>
      category.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

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
    <div className="category-management">

      <div className="category-management-header">

        <div>
          <h2>Categories</h2>

          <p>
            Manage your product categories
          </p>
        </div>

        <button
          className="add-category-btn"
          onClick={
            handleAddCategory
          }
        >
          + Add Category
        </button>

      </div>

      <div className="category-toolbar">

        <div className="category-search-box">

          <span>🔍</span>

          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => {
              setSearch(
                e.target.value
              );

              setCurrentPage(1);
            }}
          />

        </div>

        <div className="category-count">
          {totalCategories} Categories
        </div>

      </div>

      <div className="categories-table-container">

        {loading ? (

          <div className="category-loading">
            Loading categories...
          </div>

        ) : filteredCategories.length === 0 ? (

          <div className="empty-categories">

            <h3>
              No categories found
            </h3>

            <p>
              Add a category to get started.
            </p>

          </div>

        ) : (

          <table className="categories-table">

            <thead>

              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {filteredCategories.map(
                (category) => (

                  <tr
                    key={
                      category.id
                    }
                  >

                    <td>
                      #{category.id}
                    </td>

                    <td>

                      <div className="category-name">

                        <div className="category-image-box">

                          {category.image ? (

                            <img
                              src={getImageUrl(
                                category.image
                              )}
                              alt={
                                category.name
                              }
                              className="category-table-image"
                            />

                          ) : (

                            <div className="category-icon">
                              {category.name
                                ?.charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                          )}

                        </div>

                        <strong>
                          {category.name}
                        </strong>

                      </div>

                    </td>

                    <td>

                      <span className="product-badge">
                        {category
                          .category_products
                          ?.length ??
                          0}{" "}
                        Products
                      </span>

                    </td>

                    <td>

                      <div className="category-actions">

                        <button
                          className="category-edit-btn"
                          onClick={() =>
                            handleEdit(
                              category
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="category-delete-btn"
                          onClick={() =>
                            handleDelete(
                              category.id
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

      {showModal && (

        <div className="category-modal-overlay">

          <div className="category-modal">

            <div className="category-modal-header">

              <div>

                <h2>
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p>
                  {editingCategory
                    ? "Update category information"
                    : "Create a new product category"}
                </p>

              </div>

              <button
                type="button"
                className="category-close-btn"
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

              <div className="category-form-group">

                <label>
                  Category Name
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
                  placeholder="Enter category name"
                  required
                />

              </div>

              <div className="category-form-group">

                <label>
                  Category Image
                </label>

                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                  className="category-image-input"
                />

                {imagePreview && (

                  <div className="category-image-preview-wrapper">

                    <img
                      src={imagePreview}
                      alt="Category preview"
                      className="category-image-preview"
                    />

                  </div>

                )}

              </div>

              <div className="category-modal-actions">

                <button
                  type="button"
                  className="category-cancel-btn"
                  onClick={
                    handleCloseModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="category-save-btn"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      <SubCategoryManager categories={categories} />
    </div>
  );
}