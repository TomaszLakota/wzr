import './PrivacyPolicy.scss';

function PrivacyPolicy() {
  return (
    <div className="privacy-page page-container">
      <h1>Polityka prywatności i ochrony danych osobowych</h1>

      <div className="privacy-content">
        <section>
          <h2>1. Postanowienia ogólne</h2>
          <p>
            Administratorem danych osobowych zbieranych za pośrednictwem serwisu www.wloskizroberto.pl jest Roberto Italiano, prowadzący działalność
            gospodarczą pod nazwą "Włoski z Roberto", z siedzibą w Warszawie, ul. Przykładowa 123, 00-001 Warszawa, NIP: 1234567890.
          </p>
          <p>
            Kontakt z administratorem w sprawach ochrony danych osobowych:
            <strong>rodo@wloskizroberto.pl</strong>
          </p>
        </section>

        <section>
          <h2>2. Podstawa prawna przetwarzania danych</h2>
          <p>Dane osobowe przetwarzane są na podstawie:</p>
          <ul>
            <li>Art. 6 ust. 1 lit. a RODO - zgoda osoby, której dane dotyczą</li>
            <li>Art. 6 ust. 1 lit. b RODO - wykonanie umowy lub działania podejmowane na żądanie osoby przed zawarciem umowy</li>
            <li>Art. 6 ust. 1 lit. c RODO - wypełnienie obowiązku prawnego administratora</li>
            <li>Art. 6 ust. 1 lit. f RODO - prawnie uzasadniony interes administratora</li>
          </ul>
        </section>

        <section>
          <h2>3. Rodzaje zbieranych danych</h2>
          <p>W ramach świadczonych usług zbieramy następujące kategorie danych osobowych:</p>

          <h3>Dane rejestracyjne:</h3>
          <ul>
            <li>Imię i nazwisko</li>
            <li>Adres e-mail</li>
            <li>Hasło (w formie zaszyfrowanej)</li>
            <li>Data rejestracji</li>
          </ul>

          <h3>Dane płatności:</h3>
          <ul>
            <li>Dane rozliczeniowe niezbędne do wystawienia faktury</li>
            <li>Historia transakcji (obsługiwana przez Stripe)</li>
          </ul>

          <h3>Dane techniczne:</h3>
          <ul>
            <li>Adres IP</li>
            <li>Informacje o przeglądarce i urządzeniu</li>
            <li>Logi aktywności w serwisie</li>
            <li>Pliki cookies</li>
          </ul>
        </section>

        <section>
          <h2>4. Cele przetwarzania danych</h2>
          <p>Dane osobowe przetwarzane są w następujących celach:</p>
          <ul>
            <li>Świadczenie usług edukacyjnych i sprzedaż ebooków</li>
            <li>Obsługa konta użytkownika</li>
            <li>Przetwarzanie płatności</li>
            <li>Wysyłka newslettera (po wyrażeniu zgody)</li>
            <li>Komunikacja z użytkownikami</li>
            <li>Analiza statystyk korzystania z serwisu</li>
            <li>Wypełnienie obowiązków prawnych (np. podatkowych)</li>
            <li>Marketing własnych produktów i usług</li>
          </ul>
        </section>

        <section>
          <h2>5. Okres przechowywania danych</h2>
          <p>Dane osobowe przechowywane są przez następujące okresy:</p>
          <ul>
            <li>
              <strong>Dane konta:</strong> do usunięcia konta przez użytkownika lub nieaktywności przez 3 lata
            </li>
            <li>
              <strong>Dane do faktur:</strong> 5 lat od końca roku, w którym wystawiono fakturę
            </li>
            <li>
              <strong>Logi aktywności:</strong> 12 miesięcy
            </li>
            <li>
              <strong>Newsletter:</strong> do wycofania zgody
            </li>
            <li>
              <strong>Dane marketingowe:</strong> 3 lata od ostatniej aktywności
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Udostępnianie danych osobowych</h2>
          <p>Dane osobowe mogą być udostępniane następującym odbiorcom:</p>
          <ul>
            <li>
              <strong>Stripe Inc.</strong> - obsługa płatności online
            </li>
            <li>
              <strong>Dostawcy usług IT</strong> - hosting, wsparcie techniczne
            </li>
            <li>
              <strong>Biuro rachunkowe</strong> - prowadzenie ksiąg rachunkowych
            </li>
            <li>
              <strong>Organy państwowe</strong> - na podstawie przepisów prawa
            </li>
          </ul>
          <p>
            Wszyscy odbiorcy zobowiązani są do ochrony danych osobowych zgodnie z przepisami RODO i zawartymi umowami powierzenia przetwarzania
            danych.
          </p>
        </section>

        <section>
          <h2>7. Prawa osób, których dane dotyczą</h2>
          <p>Zgodnie z RODO przysługują Państwu następujące prawa:</p>
          <ul>
            <li>
              <strong>Prawo dostępu</strong> - do swoich danych osobowych
            </li>
            <li>
              <strong>Prawo sprostowania</strong> - nieprawidłowych lub niekompletnych danych
            </li>
            <li>
              <strong>Prawo do usunięcia</strong> - danych osobowych ("prawo do bycia zapomnianym")
            </li>
            <li>
              <strong>Prawo do ograniczenia przetwarzania</strong> - w określonych przypadkach
            </li>
            <li>
              <strong>Prawo do przenoszenia danych</strong> - w formatach umożliwiających odczyt maszynowy
            </li>
            <li>
              <strong>Prawo sprzeciwu</strong> - wobec przetwarzania w celach marketingowych
            </li>
            <li>
              <strong>Prawo do wycofania zgody</strong> - w każdej chwili bez wpływu na zgodność z prawem
            </li>
          </ul>
          <p>
            W celu skorzystania z powyższych praw prosimy o kontakt na adres:
            <strong>rodo@wloskizroberto.pl</strong>
          </p>
        </section>

        <section>
          <h2>8. Pliki cookies</h2>
          <p>Serwis wykorzystuje pliki cookies w celu zapewnienia prawidłowego funkcjonowania, analizy ruchu oraz personalizacji treści.</p>
          <p>Rodzaje używanych cookies:</p>
          <ul>
            <li>
              <strong>Niezbędne</strong> - umożliwiają podstawowe funkcjonowanie serwisu
            </li>
            <li>
              <strong>Funkcjonalne</strong> - zapamiętują preferencje użytkownika
            </li>
            <li>
              <strong>Analityczne</strong> - pozwalają na analizę sposobu korzystania z serwisu
            </li>
            <li>
              <strong>Marketingowe</strong> - służą personalizacji reklam (po wyrażeniu zgody)
            </li>
          </ul>
          <p>Użytkownik może zarządzać ustawieniami cookies w przeglądarce internetowej.</p>
        </section>

        <section>
          <h2>9. Bezpieczeństwo danych</h2>
          <p>Stosujemy odpowiednie środki techniczne i organizacyjne w celu zapewnienia bezpieczeństwa przetwarzanych danych osobowych, w tym:</p>
          <ul>
            <li>Szyfrowanie danych w transporcie (SSL/TLS)</li>
            <li>Szyfrowanie haseł w bazie danych</li>
            <li>Regularne aktualizacje zabezpieczeń</li>
            <li>Kontrola dostępu do danych</li>
            <li>Regularne kopie zapasowe</li>
            <li>Monitoring bezpieczeństwa</li>
          </ul>
        </section>

        <section>
          <h2>10. Prawo do wniesienia skargi</h2>
          <p>
            W przypadku uznania, że przetwarzanie danych osobowych narusza przepisy RODO, przysługuje Państwu prawo wniesienia skargi do organu
            nadzorczego:
          </p>
          <p>
            <strong>Urząd Ochrony Danych Osobowych</strong>
            <br />
            ul. Stawki 2, 00-193 Warszawa
            <br />
            Tel.: 22 531 03 00
            <br />
            E-mail: kancelaria@uodo.gov.pl
          </p>
        </section>

        <section>
          <h2>11. Zmiany w polityce prywatności</h2>
          <p>
            Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej polityce prywatności. O wszelkich zmianach poinformujemy użytkowników za
            pośrednictwem serwisu oraz e-mailem (jeśli wyrażili zgodę na otrzymywanie korespondencji).
          </p>
        </section>

        <div className="last-updated">
          <p>
            <strong>Ostatnia aktualizacja:</strong> 15 stycznia 2024
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
