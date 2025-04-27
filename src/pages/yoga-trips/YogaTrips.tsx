import React, { useState, useEffect } from 'react';
import './YogaTrips.scss';

const bari1 = 'https://wzrr.b-cdn.net/bari-1.webp';
const bari2 = 'https://wzrr.b-cdn.net/bari-2.webp';
const bari3 = 'https://wzrr.b-cdn.net/bari-3.webp';

function YogaTrips() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user is logged in and prefill form
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setFormData((prev) => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
        }));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Wystąpił błąd podczas wysyłania wiadomości');
      }

      setSuccess('Wiadomość została wysłana pomyślnie. Skontaktujemy się z Tobą wkrótce.');
      setFormData((prev) => ({ ...prev, message: '' }));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Wystąpił nieznany błąd');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="yoga-trips page-container-full">
      <div className="yoga-trips__header">
        <h1>Wyjazdy z Jogą</h1>
        <p>
          Odkryj piękne zakątki Włoch podczas naszych specjalnych wyjazdów z jogą. Połącz naukę
          języka z praktyką jogi i zanurzeniem w lokalnej kulturze.
        </p>
      </div>

      <div className="yoga-trips__content">
        <div className="yoga-trips__info">
          <h2>O naszych wyjazdach</h2>
          <div className="yoga-trips__text-with-image">
            <img
              src={bari1}
              alt="Bari widok"
              className="yoga-trips__image yoga-trips__image--right"
            />
            <p>
              Wyjazdy do Bari z warsztatami jogi to wyjątkowa okazja, aby połączyć naukę języka
              włoskiego z praktyką jogi w malowniczej scenerii południowych Włoch. Bari, stolica
              regionu Apulia, oferuje nie tylko piękne krajobrazy, ale także bogatą kulturę i
              historię, co czyni je idealnym miejscem na takie warsztaty.
            </p>
            <p>
              Zajęcia jogi odbywają się w otoczeniu natury, co sprzyja relaksacji i koncentracji.
              Ćwiczenia są dostosowane do poziomu zaawansowania uczestników, dzięki czemu zarówno
              początkujący, jak i bardziej zaawansowani praktycy mogą czerpać z nich pełnię
              korzyści. Przykładem może być poranna sesja jogi na plaży, gdzie uczestnicy mogą
              rozpocząć dzień od oddechowych ćwiczeń przy szumie fal, co jest niezwykle odprężające
              i inspirujące.
            </p>
          </div>

          <div className="yoga-trips__text-with-image">
            <img
              src={bari2}
              alt="Plaża w Bari"
              className="yoga-trips__image yoga-trips__image--left"
            />
            <p>
              Oprócz zajęć jogi, uczestnicy mają również możliwość zwiedzania Bari i okolic. W
              programie wyjazdu znajdują się między innymi wizyty w zabytkowej części miasta, gdzie
              można podziwiać takie atrakcje jak Bazylika św. Mikołaja czy katedra San Sabino.
              Podczas warsztatów uczestnicy mają okazję poznać lokalną kuchnię i kulturę.
              Organizowane są wspólne wyjścia do tradycyjnych włoskich restauracji, gdzie można
              spróbować regionalnych specjałów, takich jak orecchiette czy focaccia barese. Te
              kulinarne doświadczenia nie tylko wzbogacają wiedzę o włoskiej kuchni, ale również
              stwarzają okazję do praktykowania języka w autentycznych sytuacjach.
            </p>
            <p>
              Wyjazdy do Bari z warsztatami jogi to nie tylko nauka i relaks, ale także okazja do
              nawiązania nowych znajomości i doświadczenia kultury włoskiej na własnej skórze.
              Uczestnicy często podkreślają, że takie wyjazdy są dla nich nie tylko możliwością
              rozwoju osobistego, ale także niezapomnianą przygodą, która pozwala na chwilę oderwać
              się od codzienności i zanurzyć się w zupełnie nowym świecie.
            </p>
          </div>

          <div className="yoga-trips__text-with-image">
            <img
              src={bari3}
              alt="Joga w Bari"
              className="yoga-trips__image yoga-trips__image--right"
            />
            <p>
              Aktualne badania wskazują, że nauka języka w kontekście kulturowym znacząco zwiększa
              efektywność przyswajania nowego materiału. Połączenie różnych form aktywności, takich
              jak ruch, nauka i zwiedzanie, stymuluje różne obszary mózgu, co przyczynia się do
              lepszego zapamiętywania i zrozumienia.
            </p>
            <p>
              Zachęcamy wszystkich zainteresowanych językiem włoskim i jogą do dołączenia do naszych
              wyjazdów. To wyjątkowa okazja, aby połączyć naukę, relaks i odkrywanie nowych miejsc w
              jednym, inspirującym doświadczeniu. Niezależnie od poziomu zaawansowania, każdy
              uczestnik znajdzie coś dla siebie i wróci do domu z nowymi umiejętnościami,
              wspomnieniami i przyjaciółmi. Bari czeka na Ciebie z otwartymi ramionami!
            </p>
          </div>
        </div>

        <div className="yoga-trips__contact">
          <div className="contact-container">
            <form onSubmit={handleSubmit} className="contact-form">
              <h2>Formularz kontaktowy</h2>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-group">
                <label htmlFor="name">Imię:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Adres e-mail:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Wiadomość:</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="submit-button" disabled={isSubmitting}>
                {isSubmitting ? 'Wysyłanie...' : 'Wyślij wiadomość'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default YogaTrips;
