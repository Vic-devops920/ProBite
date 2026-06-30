import { useEffect, useState } from "react";
import { http } from "@/lib/api";

const ABOUT_IMG =
  "https://res.cloudinary.com/deciigiyk/image/upload/v1782681954/chef_4_uzclya.png";

export default function About() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    http.get("/site-content").then((r) => setContent(r.data));
  }, []);

  const facts = [
    { k: "Made", v: "Daily" },
    { k: "Ingredients", v: "Premium" },
    { k: "Delivery", v: "Abuja-wide" },
    { k: "Custom orders", v: "Welcome" },
    { k: "Events", v: "Catered" },
    { k: "Made with", v: "Love" },
  ];

  return (
    <div
      className="container"
      style={{ paddingBlock: 96, maxWidth: 1400, marginInline: "auto" }}
    >
      <div className="about-grid">
        {/* LEFT SIDE */}
        <div>
          <div className="eyebrow section-eyebrow">About ProBites Signature</div>

          <h1
            style={{
              fontSize: "clamp(48px, 8vw, 80px)",
              lineHeight: 0.95,
              marginBottom: 32,
            }}
          >
            Premium bites,
            <br />
            professional taste.
          </h1>

          <div className="about-text">
            <p>
              {content?.about_body ||
                "At ProBites Signature, every bite is crafted with care, consistency and a passion for premium flavour."}
            </p>

            <p>
              From our kitchen in Kadokushi, Abuja, we craft each cake, parfait
              and snack with meticulous attention — using only quality
              ingredients and recipes refined over years of feeding families,
              friends and celebrations.
            </p>

            <p>
              Our signature is a balance of indulgence and elegance: small chops
              that crackle, parfaits that glisten, peanuts that snap, and cakes
              that you’ll remember long after the last slice.
            </p>
          </div>

          {/* FACTS */}
          <div className="facts">
            {facts.map((f, i) => (
              <div key={i} className="fact">
                <div className="fact-label">{f.k}</div>
                <div className="fact-value">{f.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="about-img">
          <img src={ABOUT_IMG} alt="ProBites Founder" />

          <div className="about-badge">
            <div className="eyebrow">Founder</div>

            <div
              className="font-display"
              style={{ fontSize: 24, color: "var(--primary)" }}
            >
              Madame ProBites
            </div>

            <p
              style={{
                fontSize: 12,
                color: "var(--muted-fg)",
                marginTop: 4,
              }}
            >
              Pastry chef · Abuja, Nigeria
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
