import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { ArrowRight, Star, Sparkles } from "lucide-react";

const LOGO =
  "https://customer-assets.emergentagent.com/job_59822a32-15c9-4c0f-ab9f-cf5961e49efd/artifacts/htl2ghme_PROBITES%20SIGNATURE_STICKER.png";

const HERO_IMG =
  "https://customer-assets.emergentagent.com/job_59822a32-15c9-4c0f-ab9f-cf5961e49efd/artifacts/a8dt4cg4_WhatsApp%20Image%202026-05-18%20at%2014.37.06.jpeg";

const ABOUT_IMG =
  "https://images.unsplash.com/photo-1709837167684-47d7ccf0ed89?crop=entropy&cs=srgb&fm=jpg&q=85";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [content, setContent] = useState(null);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    http.get("/products", { params: { featured: true } }).then((r) => setProducts(r.data));
    http.get("/site-content").then((r) => setContent(r.data));
    http.get("/testimonials").then((r) => setTestimonials(r.data));
  }, []);

  return (
    <div>
      {/* HERO SECTION */}
      <section>
        <div className="hero container">
          <div className="fade-up">
            <div className="hero-eyebrow">
              <Sparkles size={14} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
              {content?.hero_eyebrow || "Premium Bites · Made in Abuja"}
            </div>

            <h1>{content?.hero_title || "Bites that speak class."}</h1>

            <p className="hero-sub">
              {content?.hero_subtitle || "Handcrafted bites delivered with love across Abuja."}
            </p>

            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary">
                {content?.hero_cta || "Order Now"} <ArrowRight size={14} strokeWidth={1.5} />
              </Link>

              <Link to="/about" className="btn btn-outline">Our story</Link>
            </div>

            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">7</div>
                <div className="hero-stat-label">Categories</div>
              </div>
              <div>
                <div className="hero-stat-num">500+</div>
                <div className="hero-stat-label">Happy bites</div>
              </div>
              <div>
                <div className="hero-stat-num">Abuja</div>
                <div className="hero-stat-label">Delivered</div>
              </div>
            </div>
          </div>

          <div className="hero-img-wrap">
            <div className="hero-img-glow" />
            <div className="hero-img">
              <img src={HERO_IMG} alt="ProBites Signature Hero" />
            </div>

            <div className="hero-badge">
              <img
                src={LOGO}
                alt="ProBites Logo"
                style={{ width: 48, height: 48, objectFit: "contain" }}
              />
              <div>
                <div className="eyebrow">Premium</div>
                <div className="font-display" style={{ color: "var(--primary)", fontSize: 18 }}>
                  Made with love
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MARQUEE */}
        <div className="marquee">
          <div className="marquee-track">
            {["Cake", "Small Chops", "Chinchin", "Peanuts", "Yoghurt", "Cake Parfait", "Fruit Parfait"]
              .flatMap((w) => [w, w])
              .map((w, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 48 }}>
                  {w} <span className="dot">✦</span>
                </span>
              ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="section container">
        <div className="section-header">
          <div>
            <div className="eyebrow section-eyebrow">The Signature Edit</div>
            <h2>
              Our most-loved bites,
              <br />
              beautifully boxed.
            </h2>
          </div>

          <Link
            to="/shop"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--primary)",
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            View full menu <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="product-grid">
          {products.length > 0 ? (
            products.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            <p className="muted">No featured products available.</p>
          )}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="section-bg">
        <div className="section container about-grid">
          <div className="about-img">
            <img src={ABOUT_IMG} alt="ProBites Founder" />
          </div>

          <div>
            <div className="eyebrow section-eyebrow">The maker</div>
            <h2 className="mb-6">{content?.about_title || "Our Story"}</h2>

            <p
              className="muted"
              style={{ lineHeight: 1.7, marginBottom: 32, maxWidth: 520 }}
            >
              {content?.about_body ||
                "ProBites Signature was born from a passion for handcrafted treats made with love."}
            </p>

            <Link
              to="/about"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "var(--primary)",
                fontSize: 11,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                borderBottom: "1px solid var(--primary)",
                paddingBottom: 4,
              }}
            >
              Read full story <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section container">
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="eyebrow section-eyebrow">Whispers from happy tables</div>
          <h2>Loved across Abuja</h2>
        </div>

        <div className="testimonials">
          {testimonials.slice(0, 3).map((t) => (
            <figure key={t.id} className="testimonial">
              <div className="stars">
                {Array.from({ length: t.rating || 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>

              <blockquote className="quote">"{t.quote}"</blockquote>

              <figcaption className="quote-author">
                {t.image_url && (
                  <img src={t.image_url} alt={t.name} className="quote-avatar" />
                )}
                <div>
                  <div className="quote-name">{t.name}</div>
                  <div className="quote-loc">{t.location}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="container" style={{ paddingBottom: 96 }}>
        <div className="cta-banner">
          <div className="cta-eyebrow">Order with a tap</div>

          <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)" }}>Hungry yet?</h2>

          <p className="cta-sub">
            Browse the full menu and have ProBites delivered to your address in Abuja today.
          </p>

          <Link to="/shop" className="btn btn-accent">
            Shop the menu <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}
