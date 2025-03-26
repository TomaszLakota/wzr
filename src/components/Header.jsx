import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './Header.scss';

function Header() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    };
    
    checkAuthStatus();
    // Listen for storage changes (in case user logs in/out in another tab)
    window.addEventListener('storage', checkAuthStatus);
    
    // Create a custom event to handle logout in current tab
    const handleAuthChange = () => {
      checkAuthStatus();
    };
    
    // Listen for custom auth change events
    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  return (
    <header className="header">
      <nav>
        <ul className="nav-left">
          <li>
            <Link to="/">Strona główna</Link>
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
          {isLoggedIn && (
            <li>
              <Link to="/biblioteka">Biblioteka</Link>
            </li>
          )}
          {user?.isAdmin && (
            <li>
              <Link to="/admin" className="admin-only-link">Panel Administratora</Link>
            </li>
          )}
        </ul>
        <ul className="nav-right">
          {isLoggedIn ? (
            <li>
              <Link to="/profil">{user?.name || 'Profil'}</Link>
            </li>
          ) : (
            <>
              <li>
                <Link to="/logowanie">Logowanie</Link>
              </li>
              <li>
                <Link to="/rejestracja">Rejestracja</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
