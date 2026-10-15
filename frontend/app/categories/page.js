"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./page.css";

import { apiFetch } from "../components/apiFetch";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export default function CategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `${API_URL}${image.startsWith("/") ? image : `/${image}`}`;
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/categories/");

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();

      setCategories(data.results || data);
    } catch (err) {
      console.error("Category fetch error:", err);

      setError(
        "Unable to load categories. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId) => {
    router.push(`/product?category=${categoryId}`);
  };

  return (
      <main className="categories-page">

        {/* ================= HEADER ================= */}

        <section className="categories-header">

          <h1>
            Categories
          </h1>

          <p>
            Discover products across different
            categories and find exactly what you
            are looking for.
          </p>
        </section>

        {/* ================= LOADING ================= */}

        {loading && (
          <div className="categories-loading">
            <div className="loading-spinner"></div>

            <p>
              Loading categories...
            </p>
          </div>
        )}

        {/* ================= ERROR ================= */}

        {!loading && error && (
          <div className="categories-error">

            <span className="error-icon">
              ⚠️
            </span>

            <h2>
              Something went wrong
            </h2>

            <p>
              {error}
            </p>

            <button
              onClick={fetchCategories}
            >
              Try Again
            </button>

          </div>
        )}

        {/* ================= CATEGORIES ================= */}

        {!loading &&
          !error &&
          categories.length > 0 && (
            <div className="categories-grid">

              {categories.map((category) => (

                <div
                  className="large-category-card"
                  key={category.id}
                  onClick={() =>
                    handleCategoryClick(category.id)
                  }
                >

                  {/* CATEGORY IMAGE */}

                  <div className="large-category-icon">

                    {category.image ? (
                      <img
                        src={getImageUrl(category.image)}
                        alt={category.name}
                        className="category-image"
                      />
                    ) : (
                      <span className="category-fallback">
                        {category.icon || "🛍️"}
                      </span>
                    )}

                  </div>

                  {/* CATEGORY CONTENT */}

                  <div className="large-category-content">

                    <span className="category-label">
                      CATEGORY
                    </span>

                    <h2>
                      {category.name}
                    </h2>

                    <p>
                      {category.description ||
                        "Explore products from this category."}
                    </p>

                    {category.subcategories?.length > 0 && (
                      <div className="subcategory-chips">
                        {category.subcategories.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            className="subcategory-chip"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(
                                `/product?category=${category.id}&subcategory=${sub.id}`
                              );
                            }}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={(event) => {
                        event.stopPropagation();

                        handleCategoryClick(
                          category.id
                        );
                      }}
                    >
                      View all {category.name}
                      <span className="arrow">→</span>
                    </button>

                  </div>

                </div>

              ))}

            </div>
          )}

        {/* ================= EMPTY ================= */}

        {!loading &&
          !error &&
          categories.length === 0 && (
            <div className="categories-empty">

              <div className="empty-icon">
                🛍️
              </div>

              <h2>
                No categories found
              </h2>

              <p>
                There are currently no categories
                available.
              </p>

            </div>
          )}

      </main>
  );
}