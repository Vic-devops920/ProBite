import { useEffect, useState } from "react";
import { http, formatApiError } from "@/lib/api";
import toast from "react-hot-toast";

const FIELDS = [
  { key: "hero_eyebrow", label: "Hero eyebrow", type: "text" },
  { key: "hero_title", label: "Hero title", type: "text" },
  { key: "hero_subtitle", label: "Hero subtitle", type: "textarea" },
  { key: "hero_cta", label: "Hero button text", type: "text" },
  { key: "about_title", label: "About section title", type: "text" },
  { key: "about_body", label: "About section body", type: "textarea" },
  { key: "tagline", label: "Brand tagline", type: "text" },
  { key: "business_phone", label: "Business phone", type: "text" },
  { key: "business_address", label: "Business address", type: "textarea" },
  { key: "business_email", label: "Business email", type: "text" },
  { key: "instagram", label: "Instagram handle", type: "text" },
  { key: "facebook", label: "Facebook handle", type: "text" },
];

export default function AdminSiteContent() {
  const [content, setContent] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    http
      .get("/site-content")
      .then((r) => setContent(r.data || {}))
      .catch(() => setContent({}));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      const payload = { ...content };
      await http.put("/site-content", payload);
      toast.success("Site content updated");
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail) || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (!content) return null;

  return (
    <div>
      <div className="mb-8">
        <h1>Site Content</h1>
        <p className="muted text-sm">
          Edit the text and contact info that appears on your live website.
        </p>
      </div>

      <form
        onSubmit={save}
        className="card"
        style={{
          padding: 32,
          maxWidth: 760,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>

            {f.type === "textarea" ? (
              <textarea
                rows={3}
                className="textarea"
                value={content[f.key] || ""}
                onChange={(e) =>
                  setContent({ ...content, [f.key]: e.target.value })
                }
              />
            ) : (
              <input
                className="input"
                value={content[f.key] || ""}
                onChange={(e) =>
                  setContent({ ...content, [f.key]: e.target.value })
                }
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary"
          style={{ alignSelf: "flex-start" }}
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
