import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { hasApiKey } from './api/fred';
import { useHistory } from './hooks/useHistory';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Sources from './pages/Sources';
import Releases from './pages/Releases';
import Search from './pages/Search';
import SeriesDetail from './pages/SeriesDetail';
import Settings from './pages/Settings';
import './App.css';

export default function App() {
  const [authenticated, setAuthenticated] = useState(hasApiKey());
  const { recentlyViewed, addToHistory, clearHistory } = useHistory();

  const handleApiKeySaved = useCallback(() => setAuthenticated(true), []);
  const handleLogout = useCallback(() => {
    setAuthenticated(false);
  }, []);

  if (!authenticated) {
    return <ApiKeyPrompt onSaved={handleApiKeySaved} />;
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home recentlyViewed={recentlyViewed} />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:id" element={<Categories />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/releases" element={<Releases />} />
            <Route path="/release/:id" element={<Releases />} />
            <Route path="/search" element={<Search />} />
            <Route path="/series/:id" element={<SeriesDetail onView={addToHistory} />} />
            <Route path="/settings" element={<Settings onLogout={handleLogout} clearHistory={clearHistory} />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
