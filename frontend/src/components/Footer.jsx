import { Link } from "react-router-dom";
import { Phone, MapPin, Mail } from "lucide-react";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import { useEffect, useState } from "react";
import { http } from "@/lib/api";

export default function Footer() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    http
      .get("/site-content")
      .then((r) => setContent(r.data))
      .catch(() => setContent({}));
  }, []);

  if (!content) return null;

  return (
    <footer className="footer">
      <div className="footer-grid container">
        {/* BRAND */}
        <div>
          <div className="footer-brand font-display">ProBites</div>
          <p className="footer-brand-tag">
            …{content.tagline || "Delicious moments, beautifully crafted"}
          </p>
          <p className="footer-desc">
            Premium snacks, cakes and parfaits — handcrafted with love in Abuja
            and delivered to your door.
          </p>
        </div>

        {/* EXPLORE */}
        <div>
          <h3>Explore</h3>
          <ul>
            <li><Link to="/shop">Shop</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/admin/login">Admin</Link></li>
          </ul>
        </div>

        {/* VISIT */}
        <div>
          <h3>Visit</h3>
          <ul>
            <li>
              <MapPin size={14} strokeWidth={1.5} />
              <span>{content.business_address || "Abuja, Nigeria"}</span>
            </li>

            <li>
              <Phone size={14} strokeWidth={1.5} />
              {content.business_phone || "N/A"}
            </li>

            <li>
              <Mail size={14} strokeWidth={1.5} />
              {content.business_email || "N/A"}
            </li>

            <li className="footer-socials">
              {content.instagram && (
                <a
                  href={`https://instagram.com/${content.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <FaInstagram size={18} />
                </a>
              )}

              {content.facebook && (
                <a
                  href={`https://facebook.com/${content.facebook}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <FaFacebook size={18} />
                </a>
              )}
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>© {new Date().getFullYear()} ProBites Signature. All rights reserved.</div>
        <div>Bites that speak class.</div>
      </div>
    </footer>
  );
}
