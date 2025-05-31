import './TermsOfService.scss';

function TermsOfService() {
  return (
    <div className="terms-page page-container">
      <h1>Regulamin świadczenia usług</h1>

      <div className="terms-content">
        <section>
          <h2>§ 1. Postanowienia ogólne</h2>
          <p>
            Niniejszy regulamin określa zasady świadczenia usług drogą elektroniczną przez serwis internetowy włoski z Roberto, dostępny pod adresem
            www.wloskizroberto.pl.
          </p>
          <p>
            Usługodawcą jest Roberto Italiano, prowadzący działalność gospodarczą pod nazwą "Włoski z Roberto", z siedzibą w Warszawie, ul.
            Przykładowa 123, 00-001 Warszawa, NIP: 1234567890.
          </p>
        </section>

        <section>
          <h2>§ 2. Definicje</h2>
          <ol>
            <li>
              <strong>Serwis</strong> - serwis internetowy "Włoski z Roberto" dostępny pod adresem www.wloskizroberto.pl
            </li>
            <li>
              <strong>Usługodawca</strong> - Roberto Italiano, właściciel i operator serwisu
            </li>
            <li>
              <strong>Użytkownik</strong> - osoba fizyczna, prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, korzystająca z usług
              serwisu
            </li>
            <li>
              <strong>Konto</strong> - indywidualny profil użytkownika w serwisie
            </li>
            <li>
              <strong>Ebook</strong> - publikacja elektroniczna oferowana w serwisie
            </li>
            <li>
              <strong>Subskrypcja</strong> - usługa dostępu do treści premium w ramach płatnego abonamentu
            </li>
          </ol>
        </section>

        <section>
          <h2>§ 3. Rodzaje świadczonych usług</h2>
          <p>Serwis świadczy następujące usługi drogą elektroniczną:</p>
          <ul>
            <li>Udostępnianie treści edukacyjnych dotyczących nauki języka włoskiego</li>
            <li>Sprzedaż ebooków w języku polskim i włoskim</li>
            <li>Świadczenie usług subskrypcyjnych dostępu do treści premium</li>
            <li>Organizacja wyjazdów edukacyjnych do Włoch</li>
            <li>Prowadzenie bloga z artykułami o kulturze włoskiej</li>
          </ul>
        </section>

        <section>
          <h2>§ 4. Warunki rejestracji i korzystania z konta</h2>
          <p>Rejestracja w serwisie jest dobrowolna, ale niezbędna do zakupu produktów cyfrowych i korzystania z treści premium.</p>
          <p>Użytkownik zobowiązuje się do:</p>
          <ul>
            <li>Podania prawdziwych danych podczas rejestracji</li>
            <li>Nieudostępniania danych dostępowych osobom trzecim</li>
            <li>Niezwłocznego informowania o kompromitacji konta</li>
            <li>Korzystania z serwisu zgodnie z prawem polskim</li>
          </ul>
        </section>

        <section>
          <h2>§ 5. Zasady zakupów i płatności</h2>
          <p>
            Płatności w serwisie obsługiwane są przez zewnętrzny system płatności Stripe. Ceny podane są w złotych polskich (PLN) i zawierają podatek
            VAT.
          </p>
          <p>
            Zakup ebooka lub subskrypcji stanowi zawarcie umowy sprzedaży między użytkownikiem a usługodawcą. Płatność jest jednoznaczna z akceptacją
            niniejszego regulaminu.
          </p>
        </section>

        <section>
          <h2>§ 6. Prawo odstąpienia od umowy</h2>
          <p>
            Zgodnie z przepisami ustawy o prawach konsumenta, użytkownik będący konsumentem ma prawo odstąpić od umowy zawartej na odległość w
            terminie 14 dni od dnia zawarcia umowy.
          </p>
          <p>
            Prawo odstąpienia nie przysługuje w przypadku dostarczenia treści cyfrowych, jeśli użytkownik wyraził zgodę na rozpoczęcie świadczenia
            przed upływem terminu odstąpienia.
          </p>
        </section>

        <section>
          <h2>§ 7. Reklamacje</h2>
          <p>
            Reklamacje dotyczące funkcjonowania serwisu można składać na adres email: reklamacje@wloskizroberto.pl lub pisemnie na adres siedziby
            usługodawcy.
          </p>
          <p>Reklamacja powinna zawierać:</p>
          <ul>
            <li>Imię i nazwisko oraz adres użytkownika</li>
            <li>Opis problemu</li>
            <li>Żądanie użytkownika</li>
          </ul>
          <p>Usługodawca rozpatrzy reklamację w terminie 14 dni roboczych od jej otrzymania.</p>
        </section>

        <section>
          <h2>§ 8. Odpowiedzialność</h2>
          <p>
            Usługodawca nie ponosi odpowiedzialności za jakiekolwiek szkody powstałe w wyniku nieprawidłowego korzystania z serwisu przez użytkownika.
          </p>
          <p>
            Usługodawca dołoży wszelkich starań, aby zapewnić ciągłość działania serwisu, jednak nie gwarantuje, że korzystanie z serwisu będzie
            nieprzerwane i wolne od błędów.
          </p>
        </section>

        <section>
          <h2>§ 9. Postanowienia końcowe</h2>
          <p>
            Niniejszy regulamin wchodzi w życie z dniem publikacji w serwisie. Usługodawca zastrzega sobie prawo do wprowadzania zmian w regulaminie.
          </p>
          <p>
            W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego i ustawy
            o prawach konsumenta.
          </p>
          <p>Ewentualne spory będą rozstrzygane przez sąd właściwy dla siedziby usługodawcy.</p>
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

export default TermsOfService;
