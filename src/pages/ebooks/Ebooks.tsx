import React, { useState, useEffect } from 'react';
import EbookCard from '../../components/ebook-card/EbookCard';
import './Ebooks.scss';
import { getEbooks } from '../../services/ebookService';
import { createCheckoutSession } from '../../services/stripeService';

interface Price {
  id: string;
  // Add other price properties if needed
}

interface Product {
  id: string;
  price?: Price;
  // Add other product properties if needed
}

function Ebooks() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch products on component mount
    const fetchProducts = async () => {
      try {
        const productsList = await getEbooks();
        setProducts(productsList);
      } catch (error) {
        console.error('Error fetching products:', error);
        setMessage('Nie udało się załadować ebooków. Spróbuj ponownie później.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handlePurchase = async (productId: string) => {
    try {
      setMessage('Przygotowywanie płatności...');

      // Find the product to get its price ID
      const product = products.find((p) => p.id === productId);

      if (!product || !product.price) {
        setMessage('Brak informacji o cenie produktu.');
        return;
      }

      // Create checkout session with the price ID
      const response = await createCheckoutSession(product.price.id);

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

  return (
    <div className="ebooks-page">
      <div className="ebooks-header">
        <h1>E-Booki</h1>
        <p>Odkryj nasze cyfrowe publikacje, które pomogą Ci w nauce języka włoskiego</p>
      </div>

      {message && (
        <div className="ebooks-message">
          <p>{message}</p>
        </div>
      )}

      {loading ? (
        <div className="ebooks-loading">Ładowanie ebooków...</div>
      ) : products.length > 0 ? (
        <div className="ebooks-grid">
          {products.map((product) => (
            <div className="ebooks-grid__item" key={product.id}>
              <EbookCard product={product} onPurchase={handlePurchase} />
            </div>
          ))}
        </div>
      ) : (
        <div className="ebooks-empty">
          <p>Aktualnie brak dostępnych ebooków.</p>
        </div>
      )}
    </div>
  );
}

export default Ebooks;
