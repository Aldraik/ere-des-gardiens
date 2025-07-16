import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RequireAuth from './components/RequireAuth';
import LoginPage from './pages/LoginPage';
import DeckBuilderPage from './pages/DeckBuilderPage';
import CardCollectionPage from './pages/CardCollectionPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('token'));
  }, [location]); // Mise à jour à chaque changement de page

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false); // Mise à jour immédiate de l'état
    navigate('/login?sessionExpired=1');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <nav>
        <Link to="/">Accueil</Link> | <Link to="/deck-builder">Deck Builder</Link>
        {isAuthenticated && (
          <>
            {' '}| <button onClick={handleLogout}>Déconnexion</button>
          </>
        )}
      </nav>
      <hr />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Routes>
                <Route path="/" element={<CardCollectionPage />} />
                <Route path="deck-builder" element={<DeckBuilderPage />} />
              </Routes>
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}
