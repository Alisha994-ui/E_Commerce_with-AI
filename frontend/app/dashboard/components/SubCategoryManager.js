"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "../../components/apiFetch";
import "./SubCategoryManager.css";

const toList = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

export default function SubCategoryManager({ categories = [] }) {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [newCategory, setNewCategory] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/subcategories/");
      if (!response.ok) throw new Error("Failed to load sub categories.");
      setSubcategories(toList(await response.json()));
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: subcategories.filter(
          (sub) => String(sub.category) === String(category.id)
        ),
      })),
    [categories, subcategories]
  );

  const showResult = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const readError = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));
    if (typeof data === "object" && data) {
      const first = Object.values(data)[0];
      if (Array.isArray(first)) return first[0];
      if (typeof first === "string") return first;
    }
    return fallback;
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!newCategory || !newName.trim()) return;

    try {
      setSaving(true);
      const response = await apiFetch("/subcategories/", {
        method: "POST",
        body: JSON.stringify({ category: newCategory, name: newName.trim() }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Could not create sub category."));
      }

      setNewName("");
      showResult("success", "Sub category created.");
      load();
    } catch (error) {
      showResult("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async (sub) => {
    if (!editingName.trim() || editingName.trim() === sub.name) {
      setEditingId(null);
      return;
    }

    try {
      const response = await apiFetch(`/subcategories/${sub.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ name: editingName.trim() }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Could not rename sub category."));
      }

      setEditingId(null);
      showResult("success", "Sub category renamed.");
      load();
    } catch (error) {
      showResult("error", error.message);
    }
  };

  const handleDelete = async (sub) => {
    const confirmed = window.confirm(
      `Delete "${sub.name}"? Its products will stay in "${sub.category_name}" without a sub category.`
    );
    if (!confirmed) return;

    try {
      const response = await apiFetch(`/subcategories/${sub.id}/`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete sub category.");
      showResult("success", "Sub category deleted.");
      load();
    } catch (error) {
      showResult("error", error.message);
    }
  };

  return (
    <section className="subcategory-manager">
      <div className="subcategory-manager-header">
        <div>
          <h2>Sub categories</h2>
          <p>Group products inside each category, for example Shoes → Sneakers.</p>
        </div>

        <form className="subcategory-form" onSubmit={handleCreate}>
          <select
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            required
            aria-label="Category"
          >
            <option value="">Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Sub category name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={100}
            required
            aria-label="Sub category name"
          />

          <button type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      {message.text && (
        <p className={`subcategory-message ${message.type}`}>{message.text}</p>
      )}

      {loading ? (
        <p className="subcategory-empty">Loading sub categories...</p>
      ) : (
        <div className="subcategory-groups">
          {grouped.map((group) => (
            <div className="subcategory-group" key={group.id}>
              <h3>
                {group.name}
                <span>{group.items.length}</span>
              </h3>

              {group.items.length === 0 ? (
                <p className="subcategory-empty">No sub categories yet.</p>
              ) : (
                <ul>
                  {group.items.map((sub) => (
                    <li key={sub.id}>
                      {editingId === sub.id ? (
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          onBlur={() => handleRename(sub)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") handleRename(sub);
                            if (event.key === "Escape") setEditingId(null);
                          }}
                          aria-label="Sub category name"
                        />
                      ) : (
                        <span className="subcategory-name">
                          {sub.name}
                          <small>{sub.product_count} products</small>
                        </span>
                      )}

                      <span className="subcategory-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(sub.id);
                            setEditingName(sub.name);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDelete(sub)}
                        >
                          Delete
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
