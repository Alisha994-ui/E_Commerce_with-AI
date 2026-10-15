"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import "./page.css";
import { apiFetch } from "../components/apiFetch";
import { openProduct } from "../components/ProductDrawer";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "price", label: "Price: low to high" },
  { value: "-price", label: "Price: high to low" },
];

const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${API_URL}${image.startsWith("/") ? image : `/${image}`}`;
};

const toList = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---------------------------------------------------------
  // URL parameters
  // ---------------------------------------------------------
  const categoryId = searchParams.get("category") || "";
  const subcategoryId = searchParams.get("subcategory") || "";
  const searchQuery = (searchParams.get("search") || "").trim();
  const ordering = searchParams.get("ordering") || "popular";

  // ---------------------------------------------------------
  // State
  // ---------------------------------------------------------
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const currentCategory = useMemo(
    () => categories.find((item) => String(item.id) === categoryId),
    [categories, categoryId]
  );

  const currentSubcategory = useMemo(
    () => subcategories.find((item) => String(item.id) === subcategoryId),
    [subcategories, subcategoryId]
  );

  // ---------------------------------------------------------
  // Update the URL (keeps filters shareable and the back button working)
  // ---------------------------------------------------------
  const updateParams = useCallback(
    (changes) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const query = params.toString();
      router.replace(query ? `/product?${query}` : "/product", { scroll: false });
    },
    [router, searchParams]
  );

  // ---------------------------------------------------------
  // Categories and sub categories (for the filter chips)
  // ---------------------------------------------------------
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiFetch("/categories/");
        if (response.ok) setCategories(toList(await response.json()));
      } catch (err) {
        console.error("Category fetch error:", err);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    const loadSubcategories = async () => {
      try {
        const response = await apiFetch(`/subcategories/?category=${categoryId}`);
        if (response.ok) setSubcategories(toList(await response.json()));
      } catch (err) {
        console.error("Sub category fetch error:", err);
      }
    };

    loadSubcategories();
  }, [categoryId]);

  // ---------------------------------------------------------
  // Products (with "Load more" pagination)
  // ---------------------------------------------------------
  const fetchProducts = useCallback(
    async (pageNumber = 1) => {
      const append = pageNumber > 1;

      try {
        append ? setLoadingMore(true) : setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (categoryId) params.set("category", categoryId);
        if (subcategoryId) params.set("subcategory", subcategoryId);
        if (searchQuery) params.set("search", searchQuery);
        if (ordering) params.set("ordering", ordering);
        params.set("page", String(pageNumber));
        params.set("page_size", "12");

        const response = await apiFetch(`/products/?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to fetch products");
        }

        const data = await response.json();
        const list = toList(data).filter((item) => item.is_active !== false);

        setProducts((previous) => (append ? [...previous, ...list] : list));
        setCount(typeof data.count === "number" ? data.count : list.length);
        setHasMore(Boolean(data.next));
        setPage(pageNumber);
      } catch (err) {
        console.error("Product fetch error:", err);
        setError(err.message || "Unable to load products. Please try again.");
        if (!append) setProducts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categoryId, subcategoryId, searchQuery, ordering]
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // ---------------------------------------------------------
  // Text
  // ---------------------------------------------------------
  const title = searchQuery
    ? `Results for “${searchQuery}”`
    : currentSubcategory
    ? currentSubcategory.name
    : currentCategory
    ? currentCategory.name
    : "All products";

  const description = searchQuery
    ? "Products matching your search."
    : currentCategory?.description ||
      "Shoes, clothing, bags, electronics and more, priced in rupees.";

  // ---------------------------------------------------------
  // Page
  // ---------------------------------------------------------
  return (
    <main className="products-page">
      <section className="products-hero">
        <div className="products-hero-content">
          {currentSubcategory && currentCategory && (
            <button
              type="button"
              className="products-back-link"
              onClick={() => updateParams({ subcategory: null })}
            >
              ← {currentCategory.name}
            </button>
          )}

          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      <section className="products-container">
        {/* FILTERS */}
        <div className="filter-bar">
          <div className="chip-rows">
            <div className="chip-row" role="group" aria-label="Categories">
              <button
                type="button"
                className={`chip ${!categoryId ? "active" : ""}`}
                onClick={() => updateParams({ category: null, subcategory: null })}
              >
                All
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`chip ${String(category.id) === categoryId ? "active" : ""}`}
                  onClick={() =>
                    updateParams({ category: category.id, subcategory: null })
                  }
                >
                  {category.name}
                </button>
              ))}
            </div>

            {categoryId && subcategories.length > 0 && (
              <div className="chip-row sub" role="group" aria-label="Sub categories">
                <button
                  type="button"
                  className={`chip small ${!subcategoryId ? "active" : ""}`}
                  onClick={() => updateParams({ subcategory: null })}
                >
                  All {currentCategory?.name || ""}
                </button>

                {subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    className={`chip small ${String(sub.id) === subcategoryId ? "active" : ""}`}
                    onClick={() => updateParams({ subcategory: sub.id })}
                  >
                    {sub.name}
                    <span className="chip-count">{sub.product_count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="filter-side">
            {!loading && !error && (
              <span className="products-count">
                {count} {count === 1 ? "product" : "products"}
              </span>
            )}

            <label className="sort-control">
              <span>Sort</span>
              <select
                value={ordering}
                onChange={(event) => updateParams({ ordering: event.target.value })}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="products-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="product-card skeleton-card" key={index}>
                <div className="skeleton skeleton-product-image"></div>
                <div className="skeleton-content">
                  <div className="skeleton skeleton-category"></div>
                  <div className="skeleton skeleton-title"></div>
                  <div className="skeleton skeleton-text"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="products-message">
            <h3>Products could not be loaded</h3>
            <p>{error}</p>
            <button type="button" className="retry-button" onClick={() => fetchProducts(1)}>
              Try again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && products.length === 0 && (
          <div className="products-message">
            <h3>No products found</h3>
            <p>Try another category or search term.</p>
            <button
              type="button"
              className="retry-button"
              onClick={() => router.push("/product")}
            >
              View all products
            </button>
          </div>
        )}

        {/* PRODUCTS */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="products-grid">
              {products.map((product) => (
                <article
                  className="product-card"
                  key={product.id}
                  onClick={() => openProduct(product.id)}
                >
                  <div className="product-image-wrapper">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="product-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="product-no-image">🛍️</div>
                    )}
                  </div>

                  <div className="product-content">
                    <span className="product-category">
                      {[product.category_name, product.subcategory_name]
                        .filter(Boolean)
                        .join(" / ")}
                    </span>

                    <h3 className="product-name">{product.name}</h3>

                    {product.description && (
                      <p className="product-description">{product.description}</p>
                    )}

                    <div className="product-bottom">
                      <div className="product-price">
                        <strong>Rs. {Number(product.price || 0).toLocaleString()}</strong>
                      </div>

                      <button
                        type="button"
                        className="view-product-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openProduct(product.id);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {hasMore && (
              <div className="load-more">
                <span>
                  Showing {products.length} of {count}
                </span>
                <button
                  type="button"
                  className="load-more-button"
                  onClick={() => fetchProducts(page + 1)}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="products-cta">
        <div className="cta-content">
          <h2>Can&apos;t find what you need?</h2>
          <p>
            Tell ShopEase AI your budget and what you&apos;re looking for, and it
            will search the store for you.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("openChatbot"))}
          >
            Ask the assistant
          </button>
        </div>
      </section>
    </main>
  );
}

// useSearchParams() needs a Suspense boundary for `next build`.
export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}
