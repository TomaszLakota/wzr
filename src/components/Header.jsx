import { Link } from 'react-router-dom';
import './Header.scss';

function Header() {
  return (
    <header className="header">
      <nav>
        <ul className="nav-left">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/lekcje">Lekcje</Link>
          </li>
          <li>
            <Link to="/poradnik">Poradnik językowy</Link>
          </li>
          <li>
            <Link to="/kultura">Kultura i ciekawostki</Link>
          </li>
          <li>
            <Link to="/ebooki">E-booki</Link>
          </li>
          <li>
            <Link to="/wyjazdy">Wyjazdy z jogą</Link>
          </li>
        </ul>
        <ul className="nav-right">
          <li>
            <Link to="/logowanie">Logowanie</Link>
          </li>
          <li>
            <Link to="/rejestracja">Rejestracja</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
