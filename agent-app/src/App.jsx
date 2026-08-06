import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Guichet from './pages/Guichet';
import Quai from './pages/Quai';
import Parametres from './pages/Parametres';
import Statistiques from './pages/Statistiques';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="guichet" element={<Guichet />} />
            <Route path="quai" element={<Quai />} />
            <Route path="parametres" element={<Parametres />} />
            <Route path="statistiques" element={<Statistiques />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
