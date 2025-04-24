import { Link } from 'react-router-dom';
import './Home.scss';
import bookIcon from '../../../public/book-icon.svg';

const roberto1 = 'https://wzrr.b-cdn.net/roberto-1.webp';
const roberto2 = 'https://wzrr.b-cdn.net/roberto-2.webp';

function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>ODKRYJ JĘZYK WŁOSKI W ZUPEŁNIE NOWY SPOSÓB!</h1>
        </div>
      </section>

      <section className="about-instructor">
        <div className="instructor-image">
          <img src={roberto1} alt="Roberto - lektor języka włoskiego" />
        </div>
        <div className="instructor-content">
          <h2>Odkryj Tajemnice Włoskiego z Rodowitym Włochem!</h2>
          <p>
            Mam przyjemność zaprosić Państwa na niezapomnianą przygodę z językiem włoskim,
            prowadzoną przeze mnie osobiście. Nazywam się Roberto i jestem rodowitym Włochem, który
            z pasją uczy Polaków piękna i zawiłości mojego ojczystego języka.
          </p>
          <p>
            Mieszkam we Włoszech, co pozwala mi na bieżąco czerpać z bogatej kultury i tradycji,
            które z radością dzielę się z moimi uczniami.
          </p>
          <h3>Dlaczego warto wybrać moje lekcje?</h3>
          <p>
            Przede wszystkim, stawiam na interaktywność i zaangażowanie. W mojej pracy skupiam się
            na tym, aby nauka języka była dla Państwa przyjemnością, a nie obowiązkiem. Moje lekcje
            są ciekawe i dynamiczne, co sprawia, że nauka staje się prawdziwą przygodą.
          </p>
        </div>
      </section>

      <section className="offerings">
        <div className="offering-item">
          <div className="offering-icon">
            <span className="video-icon"></span>
          </div>
          <div className="offering-content">
            <h3>Lekcje włoskiego online</h3>
            <p>Ucz się włoskiego we własnym tempie z moimi interaktywnymi lekcjami wideo!</p>
            <Link to="/lekcje" className="button primary">
              ROZPOCZNIJ NAUKĘ
            </Link>
          </div>
        </div>

        <div className="offering-item">
          <div className="offering-icon book-icon">
            <img src={bookIcon} alt="Ebooki o języku włoskim" />
          </div>
          <div className="offering-content">
            <h3>Ebooki o języku włoskim</h3>
            <p>Rozwijaj swoje umiejętności językowe z naszą kolekcją praktycznych ebooków.</p>
            <Link to="/ebooki" className="button secondary">
              ZOBACZ EBOOKI
            </Link>
          </div>
        </div>
      </section>

      <section className="yoga-trips">
        <div className="yoga-content">
          <h2>Wycieczki do Włoch z jogą</h2>
          <p>
            Jako Włoch, mogę zaoferować Państwu nie tylko naukę języka, ale również unikalne
            spojrzenie na włoską kulturę podczas naszych wyjazdów z jogą!
          </p>
          <Link to="/wyjazdy" className="button accent">
            DOWIEDZ SIĘ WIĘCEJ
          </Link>
        </div>
        <div className="yoga-image">
          <img src={roberto2} alt="Włochy z jogą" />
        </div>
      </section>

      <Link to="/lekcje" className="cta-link">
        <section className="cta">
          <h2>Rozpocznij swoją włoską podróż.</h2>
        </section>
      </Link>
    </div>
  );
}

export default Home;
