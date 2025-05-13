import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import ScrollToTop from '../../utils/ScrollToTop';
import './Layout.scss';

const Layout: React.FC = () => {
  return (
    <div className="layout-container">
      <ScrollToTop />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
