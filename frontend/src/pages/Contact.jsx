import { useEffect, useState } from "react";
import { http } from "@/lib/api";
import { Phone, Mail, MapPin, Clock3 } from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";


export default function Contact() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    http.get("/site-content").then((r) => setContent(r.data));
  }, []);

  if (!content) return null;

  const address = content.business_address || "Abuja, Nigeria";
  const mapQuery = encodeURIComponent(address);
  const mapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  return (
    <div className="container" style={{ paddingBlock: 96, maxWidth: 1400, marginInline: "auto" }}>
      <div style={{ maxWidth: 640, marginBottom: 64 }}>
        <div className="eyebrow section-eyebrow">Contact</div>
        <h1 style={{ fontSize: "clamp(48px, 8vw, 80px)", lineHeight: 0.95 }}>
          Let&apos;s plan something delicious.
        </h1>
      </div>

      <div className="contact-grid">
        <div className="contact-list">
          <Row
            icon={<Phone strokeWidth={1.5} size={18} />}
            label="Call us"
            value={content.business_phone || "Not available"}
            href={content.business_phone ? `tel:${content.business_phone}` : null}
          />

          <Row
            icon={<Mail strokeWidth={1.5} size={18} />}
            label="Email"
            value={content.business_email || "Not available"}
            href={content.business_email ? `mailto:${content.business_email}` : null}
          />

          <Row
            icon={<MapPin strokeWidth={1.5} size={18} />}
            label="Visit"
            value={address}
          />

         <Row
            icon={<Clock3 strokeWidth={1.5} size={18} />}
            label="Hours"
            value="Mon – Sat, 9am – 7pm"
         />


          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Follow</div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {content.instagram && (
                <a
                  href={`https://instagram.com/${content.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-social"
                >
                  <FaInstagram size={16} />
                  @{content.instagram}
                </a>
              )}

              {content.facebook && (
                <a
                  href={`https://facebook.com/${content.facebook}`}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-social"
                >
                  <FaFacebook size={16} />
                  {content.facebook}
                </a>
              )}

            </div>
          </div>
        </div>

        <div className="map-wrap">
          <iframe
            title="ProBites Signature location"
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value, href }) {
  const body = (
    <>
      <div className="icon-box">{icon}</div>
      <div>
        <div className="contact-label">{label}</div>
        <div className="contact-value">{value}</div>
      </div>
    </>
  );

  return (
    <div className="contact-row">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer">
          {body}
        </a>
      ) : (
        body
      )}
    </div>
  );
}
