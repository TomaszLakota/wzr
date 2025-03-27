import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPurchasedEbooks } from '../services/ebookService';
import './Library.scss';

function Library() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const purchasedEbooks = await getPurchasedEbooks();
        setPurchases(purchasedEbooks);
        setLoading(false);
      } catch (error) {
        console.error('Błąd podczas pobierania zakupionych ebooków:', error);
        setMessage('Nie udało się załadować zakupionych ebooków. Spróbuj ponownie później.');
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Moja biblioteka</h1>
        <p>Wszystkie Twoje zakupione ebooki w jednym miejscu</p>
      </div>

      {message && (
        <div className="library-message">
          <p>{message}</p>
        </div>
      )}

      {loading ? (
        <div className="library-loading">Ładowanie biblioteki...</div>
      ) : purchases.length > 0 ? (
        <div className="library-grid">
          {purchases.map((purchase) => (
            <div className="library-item" key={purchase.id}>
              <div className="library-item__image">
                {purchase.images && purchase.images[0] ? (
                  <img src={purchase.images[0]} alt={purchase.name} />
                ) : (
                  <div className="library-item__no-image">Brak okładki</div>
                )}
              </div>
              <div className="library-item__content">
                <h3 className="library-item__title">{purchase.name}</h3>
                {purchase.description && (
                  <p className="library-item__description">{purchase.description}</p>
                )}
                <p className="library-item__date">
                  Zakupiono: {new Date(purchase.purchaseInfo.purchaseDate).toLocaleDateString('pl-PL')}
                </p>
                <p className="library-item__price">
                  Cena zakupu: {purchase.price.formatted}
                </p>
                {purchase.purchaseInfo.downloadUrl ? (
                  <a
                    href={purchase.purchaseInfo.downloadUrl}
                    className="library-item__download"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pobierz ebooka
                  </a>
                ) : (
                  <span className="library-item__download-unavailable">
                    Link do pobrania niedostępny
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="library-empty">
          <p>Nie masz jeszcze żadnych zakupionych ebooków.</p>
          <Link to="/ebooki" className="library-empty__link">
            Przeglądaj dostępne ebooki
          </Link>
        </div>
      )}
    </div>
  );
}

export default Library; 