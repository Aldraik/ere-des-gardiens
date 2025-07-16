import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { secureFetch } from '../utils/api';
import { useSearchParams } from 'react-router-dom';



export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('sessionExpired') === '1';
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const data = await secureFetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      },
      { skipAuth: true } // ✅ ajoute ce 3e argument ici
      ); 

      localStorage.setItem('token', data.token);
      alert('Connexion réussie !');
      navigate('/'); // redirige vers l’accueil ou la collection plus tard

    } catch (err) {
      setError('Erreur réseau.');
    }
  };

  return (
    <div>
      <h2>Connexion</h2>
      {sessionExpired && (
        <p style={{ color: 'red' }}>
          Votre session a expiré. Veuillez vous reconnecter.
        </p>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Mot de passe" onChange={handleChange} required />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}
