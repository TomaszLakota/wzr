import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPurchasedEbooks } from '../services/stripeService';
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
              <h3 className="library-item__title">{purchase.productName}</h3>
              <p className="library-item__date">
                Zakupiono: {new Date(purchase.purchaseDate).toLocaleDateString('pl-PL')}
              </p>
              <a 
                href={purchase.downloadUrl}
                className="library-item__download"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pobierz ebooka
              </a>
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