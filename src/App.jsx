import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Culture from './pages/Culture';
import LanguageGuide from './pages/LanguageGuide';
import LessonsPage from './pages/LessonsPage';
import YogaTrips from './pages/YogaTrips';
import Ebooks from './pages/Ebooks';
import Login from './pages/Login';
import Register from './pages/Register';
import PaymentSuccess from './pages/PaymentSuccess';
import Library from './pages/Library';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe outside of component render to avoid recreating the Stripe object on re-renders
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/kultura',
        element: <Culture />,
      },
      {
        path: '/poradnik',
        element: <LanguageGuide />,
      },
      {
        path: '/lekcje',
        element: <LessonsPage />,
      },
      {
        path: '/wyjazdy',
        element: <YogaTrips />,
      },
      {
        path: '/ebooki',
        element: <Ebooks />,
      },
      {
        path: '/platnosc/sukces',
        element: <PaymentSuccess />,
      },
      {
        path: '/biblioteka',
        element: <Library />,
      },
      {
        path: '/logowanie',
        element: <Login />,
      },
      {
        path: '/rejestracja',
        element: <Register />,
      },
      {
        path: '/profil',
        element: <Profile />,
      },
      {
        path: '/admin',
        element: <AdminPanel />,
      },
    ],
  },
]);

function App() {
  return (
    <Elements stripe={stripePromise}>
      <RouterProvider router={router} />
    </Elements>
  );
}

export default App;
