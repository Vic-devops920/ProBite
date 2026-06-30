import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const { user, login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  // Prevent flicker while checking auth state
  if (loading) return null;

  // Already logged in as admin → redirect
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      await login(email, password);
      navigate("/admin");
    } catch (e) {
      const message =
        formatApiError(e?.response?.data?.detail) || "Login failed. Please try again.";
      setErr(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container login-wrap">
      <form onSubmit={submit} className="login-card">
        <div className="login-icon">
          <Lock size={20} strokeWidth={1.5} />
        </div>

        <h1 style={{ fontSize: 36, marginBottom: 8 }}>Admin</h1>

        <p className="muted text-sm mb-8">
          Sign in to manage products, orders and live content.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
            />
          </div>

          {err && <div className="login-error">{err}</div>}

          <button type="submit" disabled={busy} className="btn btn-primary btn-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
