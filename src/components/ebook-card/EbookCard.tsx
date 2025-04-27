import React from 'react';
import './EbookCard.scss';
import { Ebook } from '../../types/ebook.types';
import { useNavigate } from 'react-router-dom';

export interface EbookCardProps {
  ebook: Ebook;
  onPurchase?: (productId: Ebook['id']) => void;
  isLibraryItem?: boolean;
  purchaseDate?: string | Date;
  downloadUrl?: string;
  purchasePriceFormatted?: string;
}

const EbookCard: React.FC<EbookCardProps> = ({
  ebook,
  onPurchase,
  isLibraryItem = false,
  purchaseDate,
  downloadUrl,
  purchasePriceFormatted,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (isLibraryItem) {
      if (downloadUrl) {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        console.log('Download URL not available for this item.');
      }
    } else {
      navigate(`/ebooki/${ebook.id}`);
    }
  };

  const handlePurchaseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPurchase) {
      onPurchase(ebook.id);
    }
  };

  return (
    <div className="ebook-card" onClick={handleCardClick}>
      <div className="ebook-card__image">
        {ebook.imageUrl && <img src={ebook.imageUrl} alt={ebook.name} />}
      </div>
      <div className="ebook-card__content">
        <h3 className="ebook-card__title">{ebook.name}</h3>
        {ebook.description && <p className="ebook-card__description">{ebook.description}</p>}

        {isLibraryItem ? (
          <>
            {purchaseDate && (
              <p className="ebook-card__purchase-date">
                Zakupiono:{' '}
                {typeof purchaseDate === 'string' || purchaseDate instanceof Date
                  ? new Date(purchaseDate).toLocaleDateString('pl-PL')
                  : 'Invalid Date'}
              </p>
            )}
            {purchasePriceFormatted && (
              <p className="ebook-card__purchase-price">Cena zakupu: {purchasePriceFormatted}</p>
            )}
            {downloadUrl ? (
              <a
                href={downloadUrl}
                className="ebook-card__button ebook-card__button--download"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Pobierz ebooka
              </a>
            ) : (
              <span className="ebook-card__download-unavailable">Link do pobrania niedostępny</span>
            )}
          </>
        ) : (
          <>
            {ebook.price && <div className="ebook-card__price">{ebook.formattedPrice}</div>}
            <button
              className="ebook-card__button"
              onClick={handlePurchaseClick}
              disabled={!onPurchase}
            >
              Kup teraz
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EbookCard;
