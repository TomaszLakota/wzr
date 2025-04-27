import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEbookById } from '../../services/ebookService';
import { createCheckoutSession } from '../../services/stripeService';
import { Ebook } from '../../types/ebook.types';
import './EbookDetails.scss';

function EbookDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userDataString = localStorage.getItem('user');
    setIsLoggedIn(!!(token && userDataString));

    // Listen for auth changes
    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem('user');
      setIsLoggedIn(!!(token && userDataString));
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    // Fetch the specific ebook
    const fetchEbook = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const fetchedEbook = await getEbookById(id);
        setEbook(fetchedEbook);
      } catch (error) {
        console.error('Błąd podczas pobierania e-booka:', error);
        setMessage('Nie udało się załadować e-booka. Spróbuj ponownie później.');
        setTimeout(() => {
          navigate('/ebooki');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchEbook();
  }, [id, navigate]);

  const handlePurchase = async () => {
    if (!ebook) return;

    // Check if user is logged in first
    if (!isLoggedIn) {
      setMessage('Musisz być zalogowany, aby dokonać zakupu.');
      return;
    }

    try {
      setMessage('Przygotowywanie płatności...');

      if (!ebook.priceId) {
        setMessage('Brak informacji o cenie produktu.');
        return;
      }

      // Create checkout session with the price ID
      const response = await createCheckoutSession(ebook.priceId);

      if (response.success && response.sessionUrl) {
        setMessage(response.message);
        // Redirect to Stripe checkout
        window.location.href = response.sessionUrl;
      } else {
        setMessage('Nie udało się utworzyć sesji płatności.');
      }
    } catch (error) {
      console.error('Błąd podczas tworzenia sesji płatności:', error);
      setMessage('Wystąpił błąd podczas tworzenia sesji płatności.');
    }
  };

  if (loading) {
    return (
      <>
        <Link to="/ebooki" className="ebook-details__back-link page-container-full">
          Powrót do listy e-booków
        </Link>
        <div className="ebook-details-loading page-container-full">Ładowanie e-booka...</div>
      </>
    );
  }

  if (!ebook) {
    return (
      <>
        <Link to="/ebooki" className="ebook-details__back-link page-container-full">
          Powrót do listy e-booków
        </Link>
        <div className="ebook-details-error page-container-full">
          <p>{message || 'Nie znaleziono e-booka.'}</p>
        </div>
      </>
    );
  }

  return (
    <div className="ebook-details page-container-full">
      <Link to="/ebooki" className="ebook-details__back-link">
        Powrót do listy e-booków
      </Link>

      <div className="ebook-details__container">
        <div className="ebook-details__left-column">
          <h1 className="ebook-details__title">{ebook.name}</h1>

          {ebook.fullDescription ? (
            <div className="ebook-details__description">
              <h2>Opis</h2>
              {ebook.fullDescription.split('\\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : ebook.description ? (
            <div className="ebook-details__description">
              <h2>Opis</h2>
              {ebook.description.split('\\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="ebook-details__right-column">
          <div className="ebook-details__sticky-content">
            <div className="ebook-details__image-container">
              {ebook.imageUrl ? (
                <img src={ebook.imageUrl} alt={ebook.name} className="ebook-details__image" />
              ) : (
                <div className="ebook-details__placeholder">E-book</div>
              )}
            </div>

            <div className="ebook-details__price-section">
              <p className="ebook-details__price">{ebook.formattedPrice}</p>
              <button className="ebook-details__buy-button" onClick={handlePurchase}>
                Kup teraz
              </button>
            </div>

            {message && (
              <div className="ebook-details__message">
                <p>{message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EbookDetails;
