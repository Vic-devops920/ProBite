import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatNaira, http, formatApiError } from "@/lib/api";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

export default function CartDrawer() {
  const { items, open, setOpen, updateQty, remove, total, count } = useCart();

  const [checkoutMode, setCheckoutMode] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setCheckoutMode(false);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    setBusy(true);

    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        customer_address: form.address,
        origin_url: window.location.origin,
      };

      const { data } = await http.post("/checkout/session", payload);

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not start checkout");
      }
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="overlay" onClick={close} />

      <aside className="drawer">
        <button className="drawer-close" onClick={close} aria-label="Close">
          <X size={20} strokeWidth={1.5} />
        </button>

        <h2 className="drawer-title font-display">
          {checkoutMode ? "Your details" : "Your Bag"}
        </h2>

        <p className="drawer-meta">
          {count} {count === 1 ? "item" : "items"}
        </p>

        {!checkoutMode ? (
          <>
            <div className="drawer-list">
              {items.length === 0 && (
                <div className="empty-cart">
                  <ShoppingBag
                    size={32}
                    strokeWidth={1}
                    style={{ margin: "0 auto 12px", opacity: 0.5 }}
                  />
                  Your bag is empty
                </div>
              )}

              {items.map((it) => (
                <div key={it.product_id} className="drawer-item">
                  <img src={it.image_url} alt={it.name} />

                  <div className="drawer-item-body">
                    <div className="drawer-item-name">{it.name}</div>
                    <div className="drawer-item-price">{formatNaira(it.price)}</div>

                    <div className="qty-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateQty(it.product_id, it.quantity - 1)}
                      >
                        <Minus size={12} />
                      </button>

                      <span className="qty-num">{it.quantity}</span>

                      <button
                        className="qty-btn"
                        onClick={() => updateQty(it.product_id, it.quantity + 1)}
                      >
                        <Plus size={12} />
                      </button>

                      <button
                        className="qty-btn"
                        onClick={() => remove(it.product_id)}
                        style={{ marginLeft: "auto" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="drawer-item-total">
                    {formatNaira(it.price * it.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-footer">
              <div className="drawer-total">
                <span>Subtotal</span>
                <span>{formatNaira(total)}</span>
              </div>

              <button
                onClick={() => setCheckoutMode(true)}
                disabled={items.length === 0}
                className="btn btn-primary btn-full"
              >
                Proceed to checkout
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={handleCheckout}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 16,
              marginTop: 8,
            }}
          >
            <div>
              <label className="label">Full name</label>
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                required
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                required
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Delivery address</label>
              <input
                required
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="drawer-footer" style={{ marginTop: "auto" }}>
              <div className="drawer-total">
                <span>Total</span>
                <span>{formatNaira(total)}</span>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary btn-full"
              >
                {busy ? "Redirecting…" : "Pay securely"}
              </button>

              <button
                type="button"
                onClick={() => setCheckoutMode(false)}
                className="drawer-back"
              >
                ← Back to bag
              </button>
            </div>
          </form>
        )}
      </aside>
    </>
  );
}
