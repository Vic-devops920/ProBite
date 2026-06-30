import { Link, NavLink } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_59822a32-15c9-4c0f-ab9f-cf5961e49efd/artifacts/htl2ghme_PROBITES%20SIGNATURE_STICKER.png";

export default function Navbar() {
  const { count, setOpen } = useCart();

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        {/* BRAND */}
        <Link to="/" className="brand" aria-label="ProBites Home">
          <img
            src={LOGO_URL}
            alt="ProBites Signature Logo"
            className="brand-logo"
            loading="lazy"
          />
          <div className="brand-text">
            <div className="brand-name">ProBites</div>
            <div className="brand-tag">Signature</div>
          </div>
        </Link>

        {/* NAV LINKS */}
        <nav className="nav-links">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* CART BUTTON */}
        <button
          onClick={() => setOpen(true)}
          className="cart-btn"
          aria-label="Open cart"
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
          <span>Cart</span>
          {count > 0 && <span className="cart-badge">{count}</span>}
        </button>
      </div>
    </header>
  );
}
