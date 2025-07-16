export async function secureFetch(input: RequestInfo, init?: RequestInit, options?: { skipAuth?: boolean }) {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      ...(init?.headers || {}),
      ...(token && !options?.skipAuth ? { Authorization: `Bearer ${token}` } : {})
    };

    const res = await fetch(input, { ...init, headers });

    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login?sessionExpired=1';
      // On retourne une Promise "bloquante" pour éviter que d'autres appels soient traités
      return new Promise(() => {}); 
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}`);
    }

    return data;
  } catch (err: any) {
    if (err instanceof TypeError) {
      throw new Error('Serveur injoignable. Vérifiez votre connexion.');
    }
    throw err;
  }
}
