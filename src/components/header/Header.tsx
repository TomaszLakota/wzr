import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './Header.scss';
import { User } from '../../types/user.types';

const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem('user');

      if (token && userDataString) {
        try {
          const parsedUser: User = JSON.parse(userDataString);
          setIsLoggedIn(true);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsLoggedIn(false);
          setUser(null);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    checkAuthStatus();
    window.addEventListener('storage', checkAuthStatus);

    const handleAuthChange = () => {
      checkAuthStatus();
    };

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
          {/* <li>
            <Link to="/poradnik">Poradnik językowy</Link>
          </li> */}
          <li>
            <Link to="/blog">Blog</Link>
          </li>
          {/* <li>
            <Link to="/wyjazdy">Wyjazdy z jogą</Link>
          </li> */}
          <li>
            <Link to="/ebooki">E-booki</Link>
          </li>
          {isLoggedIn && (
            <li>
              <Link to="/biblioteka">Biblioteka</Link>
            </li>
          )}
          {user?.isAdmin && (
            <li>
              <Link to="/admin" className="admin-only-link">
                Panel Administratora
              </Link>
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
};

export default Header;
