import { createContext, useContext, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [agent, setAgent] = useState(() => {
    const saved = localStorage.getItem('colitrack_agent');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (_) {
      // Valeur corrompue (ex: ancienne session, format changé) : on nettoie et on repart proprement
      localStorage.removeItem('colitrack_agent');
      localStorage.removeItem('colitrack_token');
      return null;
    }
  });

  async function login(email, password) {
    const { data } = await client.post('/login', { email, password });
    localStorage.setItem('colitrack_token', data.token);
    localStorage.setItem('colitrack_agent', JSON.stringify(data.agent));
    setAgent(data.agent);
    return data.agent;
  }

  function logout() {
    localStorage.removeItem('colitrack_token');
    localStorage.removeItem('colitrack_agent');
    setAgent(null);
  }

  return (
    <AuthContext.Provider value={{ agent, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
