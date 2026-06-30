import { useEffect, useState } from "react";
import { http, formatNaira } from "@/lib/api";
import { X } from "lucide-react";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    http.get("/orders").then((r) => setOrders(r.data || []));
  }, []);

  const closeModal = () => setSelected(null);

  return (
    <div>
      <div className="mb-8">
        <h1>Orders</h1>
        <p className="muted text-sm">Every order placed via the live site.</p>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th className="center">Items</th>
              <th className="right">Amount</th>
              <th className="center">Status</th>
              <th className="right">Created</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "48px",
                    color: "var(--muted-fg)",
                  }}
                >
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  key={o.id}
                  className="clickable"
                  onClick={() => setSelected(o)}
                >
                  <td>
                    <div className="cell-strong">{o.customer_name || "Unknown"}</div>
                    <div className="cell-sub">{o.customer_email || "—"}</div>
                  </td>

                  <td className="muted">{o.customer_phone || "—"}</td>

                  <td className="center">{o.items?.length || 0}</td>

                  <td className="right">{formatNaira(o.amount || 0)}</td>

                  <td className="center">
                    <span
                      className={`badge${
                        o.status === "paid" ? " badge-success" : ""
                      }`}
                    >
                      {o.status || "unknown"}
                    </span>
                  </td>

                  <td className="right cell-sub">
                    {o.created_at
                      ? new Date(o.created_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <>
          <div className="overlay" onClick={closeModal} />

          <div
            className="modal"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="drawer-close" onClick={closeModal}>
              <X size={20} />
            </button>

            <h2 className="modal-title font-display mb-4">
              Order for {selected.customer_name || "Unknown"}
            </h2>

            <div className="muted text-sm mb-6">
              <div>
                {selected.customer_email || "—"} ·{" "}
                {selected.customer_phone || "—"}
              </div>
              <div>{selected.customer_address || "No address provided"}</div>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: 16,
              }}
            >
              {(selected.items || []).map((it, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  <span>
                    {it.name} × {it.quantity}
                  </span>
                  <span>{formatNaira(it.line_total)}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: 16,
                marginTop: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span
                className="text-xs"
                style={{
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Total
              </span>

              <span
                className="font-display"
                style={{ fontSize: 24, color: "var(--primary)" }}
              >
                {formatNaira(selected.amount || 0)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
