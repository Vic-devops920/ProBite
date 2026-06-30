import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { http, formatNaira } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { Check, AlertCircle, Loader2 } from "lucide-react";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  const [status, setStatus] = useState("checking");
  const [info, setInfo] = useState(null);

  const { clear } = useCart();
  const clearedRef = useRef(false); // prevent double-clear

  const poll = useCallback(
    async (attempt = 0) => {
      if (!sessionId) {
        setStatus("error");
        return;
      }

      if (attempt >= 10) {
        setStatus("error");
        return;
      }

      try {
        const { data } = await http.get(`/checkout/status/${sessionId}`);
        setInfo(data);

        if (data.payment_status === "paid") {
          setStatus("paid");

          if (!clearedRef.current) {
            clear();
            clearedRef.current = true;
          }

          return;
        }

        if (data.status === "expired") {
          setStatus("expired");
          return;
        }

        // Continue polling
        setTimeout(() => poll(attempt + 1), 2000);
      } catch {
        setStatus("error");
      }
    },
    [sessionId, clear]
  );

  useEffect(() => {
    poll(0);

    return () => {
      // cleanup: prevent polling after unmount
      clearedRef.current = true;
    };
  }, [poll]);

  return (
    <div className="container cs-wrap">
      <div className="cs-card">
        {status === "checking" && (
          <>
            <Loader2
              size={48}
              strokeWidth={1.5}
              className="spin"
              style={{ margin: "0 auto 24px", color: "var(--primary)" }}
            />
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Confirming your payment…</h1>
            <p className="muted" style={{ fontSize: 14 }}>
              Hold tight, this only takes a moment.
            </p>
          </>
        )}

        {status === "paid" && (
          <>
            <div className="cs-icon-wrap">
              <Check size={28} strokeWidth={2} />
            </div>

            <h1 style={{ fontSize: 36, marginBottom: 12 }}>Thank you!</h1>

            <p className="muted" style={{ marginBottom: 24 }}>
              Your order has been received. We&apos;ll reach out shortly to confirm delivery details.
            </p>

            {info?.amount_total != null && (
              <div
                className="font-display"
                style={{ fontSize: 26, color: "var(--primary)", marginBottom: 32 }}
              >
                {formatNaira(info.amount_total)}
              </div>
            )}

            <Link to="/shop" className="btn btn-primary">
              Continue shopping
            </Link>
          </>
        )}

        {(status === "expired" || status === "error") && (
          <>
            <AlertCircle
              size={48}
              strokeWidth={1.5}
              style={{ margin: "0 auto 24px", color: "var(--destructive)" }}
            />

            <h1 style={{ fontSize: 28, marginBottom: 12 }}>
              {status === "expired" ? "Session expired" : "Something went wrong"}
            </h1>

            <p className="muted" style={{ marginBottom: 24 }}>
              Please try placing your order again.
            </p>

            <Link to="/shop" className="btn btn-primary">
              Back to shop
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
