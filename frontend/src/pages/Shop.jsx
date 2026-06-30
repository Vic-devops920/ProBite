import { useEffect, useState, useMemo } from "react";
import { http } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [active, setActive] = useState("All");

  useEffect(() => {
    http.get("/products").then((r) => setProducts(r.data || []));
    http.get("/categories").then((r) =>
      setCategories(["All", ...(r.data || [])])
    );
  }, []);

  const filtered = useMemo(() => {
    if (active === "All") return products;
    return products.filter((p) => p.category === active);
  }, [products, active]);

  return (
    <div
      className="container"
      style={{
        paddingTop: 48,
        paddingBottom: 96,
        maxWidth: 1400,
        marginInline: "auto",
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: 48, maxWidth: 640 }}>
        <div className="eyebrow section-eyebrow">The menu</div>
        <h1
          style={{
            fontSize: "clamp(48px, 8vw, 80px)",
            lineHeight: 0.95,
          }}
        >
          Every bite,
          <br />
          a small celebration.
        </h1>
      </div>

      {/* FILTERS */}
      <div className="filters">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`filter-btn${active === c ? " active" : ""}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "96px 0",
            color: "var(--muted-fg)",
          }}
        >
          No products in this category yet.
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
