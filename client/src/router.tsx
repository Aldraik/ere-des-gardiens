import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CardCollectionPage from './pages/CardCollectionPage';
import ProtectedRoute from './components/ProtectedRoute';
import DeckBuilderPage from './pages/DeckBuilderPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/cartes', element: <CardCollectionPage /> },
          { path: '/deck-builder', element: <DeckBuilderPage /> },
          { path: '/deck', element: <div>Mes decks</div> }
        ]
      }
    ]
  }
]);

export default router;
