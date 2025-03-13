import { Link } from 'react-router-dom';
import './Header.css';

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
            <Link to="/poradnik">Poradnik</Link>
          </li>
          <li>
            <Link to="/kultura">Kultura</Link>
          </li>
          <li>
            <Link to="/ebooki">Ebooki</Link>
          </li>
          <li>
            <Link to="/wyjazdy">Wyjazdy</Link>
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
