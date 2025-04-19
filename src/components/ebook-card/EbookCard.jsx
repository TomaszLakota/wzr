import React from 'react';
import './EbookCard.scss';

function EbookCard({ product, onPurchase }) {
  return (
    <div className="ebook-card">
      <div className="ebook-card__image">
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <div className="ebook-card__placeholder">E-book</div>
        )}
      </div>
      <div className="ebook-card__content">
        <h3 className="ebook-card__title">{product.name}</h3>
        {product.description && (
          <p className="ebook-card__description">{product.description}</p>
        )}
        {product.price && (
          <div className="ebook-card__price">{product.price.formatted}</div>
        )}
        <button 
          className="ebook-card__button" 
          onClick={() => onPurchase(product.id)}
        >
          Kup teraz
        </button>
      </div>
    </div>
  );
}

export default EbookCard; 