import React from 'react';
import './EbookCard.scss';
import { Ebook } from '../../types/ebook.types';
import { useNavigate } from 'react-router-dom';

export interface EbookCardProps {
  ebook: Ebook;
  onPurchase: (productId: Ebook['id']) => void;
}

const EbookCard: React.FC<EbookCardProps> = ({ ebook, onPurchase }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/ebooki/${ebook.id}`);
  };

  const handlePurchaseClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering
    onPurchase(ebook.id);
  };

  return (
    <div className="ebook-card" onClick={handleCardClick}>
      <div className="ebook-card__image">
        {ebook.imageUrl ? (
          <img src={ebook.imageUrl} alt={ebook.name} />
        ) : (
          <div className="ebook-card__placeholder">E-book</div>
        )}
      </div>
      <div className="ebook-card__content">
        <h3 className="ebook-card__title">{ebook.name}</h3>
        {ebook.description && <p className="ebook-card__description">{ebook.description}</p>}
        {ebook.price && <div className="ebook-card__price">{ebook.formattedPrice}</div>}
        <button
          className="ebook-card__button"
          onClick={handlePurchaseClick}
        >
          Kup teraz
        </button>
      </div>
    </div>
  );
};

export default EbookCard;
