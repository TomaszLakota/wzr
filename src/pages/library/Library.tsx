import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPurchasedEbooks } from '../../services/ebookService';
import './Library.scss';
import { Purchase, Price } from '../../types/stripe.types';
import EbookCard from '../../components/ebook-card/EbookCard';
import { Ebook } from '../../types/ebook.types';

function Library() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const fetchedData: any[] = await getPurchasedEbooks();
        console.log('Fetched data (as any[]):', fetchedData);

        const mappedPurchases: Purchase[] = (fetchedData || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          active: item.active,
          images: item.images,
          price: item.price,
          purchaseInfo: {
            purchaseDate: item.purchaseInfo?.purchaseDate,
            downloadUrl: item.purchaseInfo?.downloadUrl,
            paymentId: item.purchaseInfo?.paymentId,
          },
        }));

        console.log('Mapped data (as Purchase[]):', mappedPurchases);
        setPurchases(mappedPurchases);
      } catch (error) {
        console.error('Błąd podczas pobierania zakupionych ebooków:', error);
        setMessage('Nie udało się załadować zakupionych ebooków. Spróbuj ponownie później.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const getFormattedPrice = (priceData: Price | undefined): string | undefined => {
    if (typeof priceData === 'object' && priceData !== null && typeof priceData.formatted === 'string') {
      return priceData.formatted;
    }
    if (typeof priceData === 'object' && priceData !== null && typeof (priceData as any).unit_amount === 'number') {
      const amount = (priceData as any).unit_amount;
      return (amount / 100).toFixed(2) + ' zł';
    }
    return undefined;
  };

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
          {purchases.map((purchase) => {
            const ebookForCard: Ebook = {
              id: purchase.id,
              name: purchase.name || 'Nieznany tytuł',
              description: purchase.description || 'Brak opisu',
              priceId: purchase.price?.id || 'N/A',
              price: purchase.price?.unit_amount ?? 0,
              formattedPrice: purchase.price?.formatted || 'N/A',
              currency: purchase.price?.currency || 'pln',
              imageUrl: purchase.images?.[0],
              downloadUrl: purchase.purchaseInfo?.downloadUrl,
              fullDescription: purchase.description,
            };

            const purchaseDateForCard = purchase.purchaseInfo.purchaseDate;

            return (
              <EbookCard
                key={purchase.id}
                ebook={ebookForCard}
                isLibraryItem={true}
                purchaseDate={purchaseDateForCard}
                downloadUrl={purchase.purchaseInfo?.downloadUrl}
                purchasePriceFormatted={purchase.price?.formatted}
              />
            );
          })}
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
