import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/api";

export default function ProductCard({ product }) {
  const { add } = useCart();

  if (!product) return null; // safety guard

  const { image_url, name, description, price, available, category } = product;

  return (
    <article className="product-card">
      <div className="product-img-wrap">
        <img
          src={image_url}
          alt={name}
          className="product-img"
          loading="lazy"
        />

        {!available && (
          <div className="product-soldout">Sold out</div>
        )}

        {category && (
          <div className="product-tag">{category}</div>
        )}
      </div>

      <div className="product-body">
        <div>
          <h3 className="product-name font-display">{name}</h3>
          <p className="product-desc">{description}</p>
        </div>

        <div className="product-price">
          {formatNaira(price)}
        </div>
      </div>

      <button
        onClick={() => add(product)}
        disabled={!available}
        className="btn btn-outline btn-full mt-4"
      >
        {available ? "Add to bag" : "Unavailable"}
      </button>
    </article>
  );
}
