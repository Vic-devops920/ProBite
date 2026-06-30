import { useEffect, useState } from "react";
import { http, formatNaira } from "@/lib/api";
import { Package, ShoppingBag, MessageSquare, TrendingUp } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    testimonials: 0,
    revenue: 0,
  });

  const [recent, setRecent] = useState([]);

  useEffect(() => {
    Promise.all([
      http.get("/products"),
      http.get("/orders"),
      http.get("/testimonials"),
    ])
      .then(([p, o, t]) => {
        const products = p.data || [];
        const orders = o.data || [];
        const testimonials = t.data || [];

        const paidOrders = orders.filter((x) => x.status === "paid");

        setStats({
          products: products.length,
          orders: orders.length,
          testimonials: testimonials.length,
          revenue: paidOrders.reduce((sum, x) => sum + (x.amount || 0), 0),
        });

        setRecent(orders.slice(0, 5));
      })
      .catch(() => {
        // Fail silently but safely
        setStats({
          products: 0,
          orders: 0,
          testimonials: 0,
          revenue: 0,
        });
        setRecent([]);
      });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1>Overview</h1>
        <p className="muted text-sm">A snapshot of your ProBites business today.</p>
      </div>

      {/* STATS */}
      <div className="stats">
        <StatCard icon={Package} label="Products" value={stats.products} />
        <StatCard icon={ShoppingBag} label="Orders" value={stats.orders} />
        <StatCard
          icon={TrendingUp}
          label="Revenue (paid)"
          value={formatNaira(stats.revenue)}
        />
        <StatCard
          icon={MessageSquare}
          label="Testimonials"
          value={stats.testimonials}
        />
      </div>

      {/* RECENT ORDERS */}
      <div className="table-wrap">
        <div className="table-head-row">
          <h2 className="font-display" style={{ fontSize: 22 }}>
            Recent orders
          </h2>
        </div>

        {recent.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--muted-fg)",
              fontSize: 14,
            }}
          >
            No orders yet.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Items</th>
                <th className="right">Amount</th>
                <th className="right">Status</th>
              </tr>
            </thead>

            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="cell-strong">{o.customer_name || "Unknown"}</div>
                    <div className="cell-sub">{o.customer_email || "—"}</div>
                  </td>

                  <td className="muted">{o.items?.length || 0}</td>

                  <td className="right">{formatNaira(o.amount || 0)}</td>

                  <td className="right">
                    <span
                      className={`badge${
                        o.status === "paid" ? " badge-success" : ""
                      }`}
                    >
                      {o.status || "unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        <Icon size={16} strokeWidth={1.5} />
        <span>{label}</span>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
