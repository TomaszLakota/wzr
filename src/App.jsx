import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Culture from './pages/Culture';
import LanguageGuide from './pages/LanguageGuide';
import Lessons from './pages/Lessons';
import YogaTrips from './pages/YogaTrips';
import Ebooks from './pages/Ebooks';
import Login from './pages/Login';
import Register from './pages/Register';

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
        element: <Lessons />,
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
        path: '/logowanie',
        element: <Login />,
      },
      {
        path: '/rejestracja',
        element: <Register />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
