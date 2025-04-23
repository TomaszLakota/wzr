import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/home/Home';
import LanguageGuide from './pages/language-guide/LanguageGuide';
import LessonsPage from './pages/lessons/LessonsPage';
import YogaTrips from './pages/yoga-trips/YogaTrips';
import Ebooks from './pages/ebooks/Ebooks';
import Login from './pages/login/Login';
import Register from './pages/register/Register';
import PaymentSuccess from './pages/payment-success/PaymentSuccess';
import Library from './pages/library/Library';
import Profile from './pages/profile/Profile';
import ArticleDetail from './components/article-detail/ArticleDetail';
import Blog from './pages/blog/Blog';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import LessonPage from './pages/lesson/LessonPage';
import AdminPanel from './pages/admin-panel/AdminPanel';
import EmailActivated from './pages/email-activated/EmailActivated';
import RegistrationSuccess from './pages/registration-success/RegistrationSuccess';

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
        path: '/blog',
        element: <Blog />,
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
        path: '/lekcje/:id',
        element: <LessonPage />,
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
      {
        path: '/blog/:slug',
        element: <ArticleDetail />,
      },
      {
        path: '/aktywacja',
        element: <EmailActivated />,
      },
      {
        path: '/rejestracja-sukces',
        element: <RegistrationSuccess />,
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
