import React from 'react';
import { Link } from 'react-router-dom';
import './Home.scss';

function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Twoja Włoska Podróż Językowa - Zacznij Już Dziś</h1>
          <p>
            Nauka nowego języka to zawsze fascynująca podróż, pełna wyzwań i satysfakcji. Włoski, z
            jego melodyjną intonacją i bogatą kulturą, jest jednym z języków, który przyciąga wielu
            uczniów na całym świecie.
          </p>
          <div className="hero-buttons">
            <Link to="/lekcje" className="button primary">
              Rozpocznij naukę
            </Link>
            <Link to="/ebooki" className="button secondary">
              Przeglądaj e-booki
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Dlaczego warto z nami?</h2>

        <div className="features-grid">
          <div className="feature-card">
            <h3>Lekcje języka włoskiego</h3>
            <p>
              Profesjonalne lekcje dla każdego poziomu zaawansowania. Od podstaw do zaawansowanych
              konwersacji.
            </p>
            <Link to="/lekcje" className="link-button">
              Zobacz kursy
            </Link>
          </div>

          <div className="feature-card">
            <h3>Kultura i ciekawostki</h3>
            <p>
              Poznaj fascynujące aspekty włoskiej kultury, historii i tradycji, które pomogą Ci
              zrozumieć język w kontekście.
            </p>
            <Link to="/kultura" className="link-button">
              Odkryj Włochy
            </Link>
          </div>

          <div className="feature-card">
            <h3>Poradnik językowy</h3>
            <p>
              Praktyczne wskazówki, triki gramatyczne i słownictwo niezbędne w codziennych
              sytuacjach.
            </p>
            <Link to="/poradnik" className="link-button">
              Sprawdź porady
            </Link>
          </div>

          <div className="feature-card">
            <h3>Wyjazdy z jogą</h3>
            <p>
              Połącz naukę włoskiego z jogą podczas naszych wyjazdów do Włoch. Zrelaksuj się i ucz w
              autentycznym środowisku.
            </p>
            <Link to="/wyjazdy" className="link-button">
              Zaplanuj wyjazd
            </Link>
          </div>
        </div>
      </section>

      <section className="ebooks-section">
        <div className="ebooks-content">
          <h2>Nasze e-booki</h2>
          <p>
            Odkryj nasze cyfrowe publikacje, które pomogą Ci w nauce języka włoskiego. Dostępne do
            pobrania natychmiast po zakupie.
          </p>
          <Link to="/ebooki" className="button primary">
            Przeglądaj bibliotekę
          </Link>
        </div>
      </section>

      <section className="cta">
        <h2>Rozpocznij swoją przygodę z językiem włoskim już dziś</h2>
        <p>Dołącz do naszej społeczności i zanurz się w pięknie włoskiego języka i kultury.</p>
        <div className="cta-buttons">
          <Link to="/rejestracja" className="button primary">
            Zarejestruj się
          </Link>
          <Link to="/lekcje" className="button secondary">
            Przeglądaj kursy
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
