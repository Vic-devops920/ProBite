import { useEffect, useState } from "react";
import { http, formatApiError } from "@/lib/api";
import { Plus, Pencil, Trash2, Star, X } from "lucide-react";
import toast from "react-hot-toast";

const EMPTY = {
  name: "",
  location: "",
  quote: "",
  rating: 5,
  image_url: "",
};

export default function AdminTestimonials() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () =>
    http.get("/testimonials").then((r) => setItems(r.data || []));

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing("new");
    setForm(EMPTY);
  };

  const openEdit = (t) => {
    setEditing(t.id);
    setForm({
      name: t.name || "",
      location: t.location || "",
      quote: t.quote || "",
      rating: t.rating ?? 5,
      image_url: t.image_url || "",
    });
  };

  const save = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        rating: Math.min(5, Math.max(1, parseInt(form.rating) || 5)),
      };

      if (editing === "new") {
        await http.post("/testimonials", payload);
      } else {
        await http.put(`/testimonials/${editing}`, payload);
      }

      toast.success("Saved");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail) || "Save failed");
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this testimonial?")) return;

    try {
      await http.delete(`/testimonials/${id}`);
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
          <h1>Testimonials</h1>
          <p className="muted text-sm">Curate the reviews on your home page.</p>
        </div>

        <button onClick={openNew} className="btn btn-primary">
          <Plus size={14} strokeWidth={1.5} /> New
        </button>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        {items.map((t) => (
          <div key={t.id} className="card" style={{ padding: 24 }}>
            <div className="stars mb-3">
              {Array.from({ length: t.rating || 5 }).map((_, i) => (
                <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
              ))}
            </div>

            <p
              className="font-display"
              style={{
                fontSize: 16,
                color: "var(--primary)",
                marginBottom: 16,
              }}
            >
              “{t.quote}”
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div className="cell-strong text-sm">{t.name}</div>
                <div className="quote-loc">{t.location}</div>
              </div>

              <span className="cell-actions">
                <button onClick={() => openEdit(t)} className="icon-btn">
                  <Pencil size={14} strokeWidth={1.5} />
                </button>

                <button
                  onClick={() => del(t.id)}
                  className="icon-btn danger"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </span>
            </div>
          </div>
        ))}
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
              {editing === "new" ? "New testimonial" : "Edit testimonial"}
            </h2>

            <form
              onSubmit={save}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
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
                <label className="label">Location</label>
                <input
                  className="input"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="label">Quote</label>
                <textarea
                  required
                  rows={3}
                  className="textarea"
                  value={form.quote}
                  onChange={(e) =>
                    setForm({ ...form, quote: e.target.value })
                  }
                />
              </div>

              <div className="form-grid form-grid-2">
                <div>
                  <label className="label">Rating (1–5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="input"
                    value={form.rating}
                    onChange={(e) =>
                      setForm({ ...form, rating: e.target.value })
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

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>

                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
