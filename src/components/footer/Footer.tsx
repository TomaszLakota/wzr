import { Link } from 'react-router-dom';
import './Footer.scss';

const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <p>© 2025 Marzena Łakota. Wszystkie prawa zastrzeżone.</p>
        <p className="developer-credit">Strona stworzona przez Tomasz Łakota</p>
        <div className="footer-links">
          <Link to="/regulamin">Regulamin</Link>
          <Link to="/polityka-prywatnosci">Polityka prywatności</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
