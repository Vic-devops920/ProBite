import { useEffect, useState } from "react";
import { http, formatNaira, formatApiError } from "@/lib/api";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

const EMPTY = {
  name: "",
  category: "Cake",
  description: "",
  price: 0,
  currency: "NGN",
  image_url: "",
  available: true,
  featured: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = () =>
    http.get("/products").then((r) => setProducts(r.data || []));

  useEffect(() => {
    load();
    http.get("/categories").then((r) => setCategories(r.data || []));
  }, []);

  const openNew = () => {
    setEditing("new");
    setForm(EMPTY);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name || "",
      category: p.category || "Cake",
      description: p.description || "",
      price: p.price ?? 0,
      currency: p.currency || "NGN",
      image_url: p.image_url || "",
      available: Boolean(p.available),
      featured: Boolean(p.featured),
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
      };

      if (editing === "new") {
        await http.post("/products", payload);
        toast.success("Product created");
      } else {
        await http.put(`/products/${editing}`, payload);
        toast.success("Product updated");
      }

      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail) || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await http.delete(`/products/${id}`);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="admin-page-header">
        <div>
          <h1>Products</h1>
          <p className="muted text-sm">
            Manage your menu — what shoppers see live on the site.
          </p>
        </div>

        <button onClick={openNew} className="btn btn-primary">
          <Plus size={14} strokeWidth={1.5} /> New product
        </button>
      </div>

      {/* TABLE */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th className="right">Price</th>
              <th className="center">Status</th>
              <th className="center">Featured</th>
              <th className="right" style={{ width: 100 }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <img
                    src={p.image_url || "/placeholder.png"}
                    alt={p.name}
                    className="table-thumb"
                  />
                </td>

                <td className="cell-strong">{p.name || "Untitled"}</td>

                <td className="muted">{p.category || "—"}</td>

                <td className="right">{formatNaira(p.price || 0)}</td>

                <td className="center">
                  <span
                    className={`badge${
                      p.available ? "" : " badge-danger"
                    }`}
                  >
                    {p.available ? "Live" : "Hidden"}
                  </span>
                </td>

                <td className="center">{p.featured ? "★" : "–"}</td>

                <td className="right">
                  <span className="cell-actions">
                    <button
                      onClick={() => openEdit(p)}
                      className="icon-btn"
                    >
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>

                    <button
                      onClick={() => del(p.id)}
                      className="icon-btn danger"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {editing && (
        <>
          <div className="overlay" onClick={() => setEditing(null)} />

          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="drawer-close"
              onClick={() => setEditing(null)}
            >
              <X size={20} />
            </button>

            <h2 className="modal-title font-display mb-6">
              {editing === "new" ? "New product" : "Edit product"}
            </h2>

            <form
              onSubmit={save}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* NAME + CATEGORY */}
              <div className="form-grid form-grid-2">
                <div>
                  <label className="label">Name</label>
                  <input
                    required
                    className="input"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="label">Category</label>
                  <select
                    className="select"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  className="textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {/* PRICE + IMAGE */}
              <div className="form-grid form-grid-2">
                <div>
                  <label className="label">Price (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="input"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="label">Image URL</label>
                  <input
                    className="input"
                    value={form.image_url}
                    onChange={(e) =>
                      setForm({ ...form, image_url: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* SWITCHES */}
              <div style={{ display: "flex", gap: 24, paddingTop: 8 }}>
                <label className="switch-wrap">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={form.available}
                      onChange={(e) =>
                        setForm({ ...form, available: e.target.checked })
                      }
                    />
                    <span className="switch-slider" />
                  </label>
                  <span>Available</span>
                </label>

                <label className="switch-wrap">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) =>
                        setForm({ ...form, featured: e.target.checked })
                      }
                    />
                    <span className="switch-slider" />
                  </label>
                  <span>Featured on home</span>
                </label>
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={busy}
                  className="btn btn-primary"
                >
                  {busy ? "Saving…" : "Save product"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
