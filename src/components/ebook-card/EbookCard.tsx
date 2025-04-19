import React from 'react';
import './EbookCard.scss';

interface ProductPrice {
  formatted: string;
}

interface Product {
  id: string | number; // Assuming ID can be string or number
  name: string;
  images?: string[];
  description?: string;
  price?: ProductPrice;
}

interface EbookCardProps {
  product: Product;
  onPurchase: (productId: string | number) => void; // Define the function signature
}

const EbookCard: React.FC<EbookCardProps> = ({ product, onPurchase }) => {
  return (
    <div className="ebook-card">
      <div className="ebook-card__image">
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <div className="ebook-card__placeholder">E-book</div> // Polish text already
        )}
      </div>
      <div className="ebook-card__content">
        <h3 className="ebook-card__title">{product.name}</h3>
        {product.description && <p className="ebook-card__description">{product.description}</p>}
        {product.price && <div className="ebook-card__price">{product.price.formatted}</div>}
        <button
          className="ebook-card__button"
          onClick={() => onPurchase(product.id)} // Call the passed function
        >
          Kup teraz {/* Polish text already */}
        </button>
      </div>
    </div>
  );
};

export default EbookCard;
