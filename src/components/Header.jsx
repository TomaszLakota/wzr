import './Header.css';

function Header() {
  return (
    <header className="header">
      <nav>
        <ul className="nav-left">
          <li>
            <a href="/">STRONA GŁÓWNA</a>
          </li>
          <li>
            <a href="/lekcje">LEKCJE</a>
          </li>
          <li>
            <a href="/poradnik">PORADNIK JĘZYKOWY</a>
          </li>
          <li>
            <a href="/kultura">KULTURA I CIEKAWOSTKI</a>
          </li>
          <li>
            <a href="/ebooki">E-BOOKI</a>
          </li>
          <li>
            <a href="/wyjazdy">WYJAZDY Z JOGĄ</a>
          </li>
        </ul>
        <ul className="nav-right">
          <li>
            <a href="/logowanie">LOGOWANIE</a>
          </li>
          <li>
            <a href="/rejestracja">REJESTRACJA</a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
