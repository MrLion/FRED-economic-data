import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useHistory } from './hooks/useHistory';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Sources from './pages/Sources';
import Releases from './pages/Releases';
import Search from './pages/Search';
import SeriesDetail from './pages/SeriesDetail';
import Settings from './pages/Settings';
import './App.css';

// One-time cleanup of legacy localStorage keys
try { localStorage.removeItem('fred_api_key'); } catch { /* ignore */ }

export default function App() {
  const { recentlyViewed, addToHistory, clearHistory } = useHistory();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="app">
        <Header onMenuToggle={() => setNavOpen(v => !v)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home recentlyViewed={recentlyViewed} clearHistory={clearHistory} />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:id" element={<Categories />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/releases" element={<Releases />} />
            <Route path="/release/:id" element={<Releases />} />
            <Route path="/search" element={<Search />} />
            <Route path="/series/:id" element={<SeriesDetail onView={addToHistory} />} />
            <Route path="/settings" element={<Settings clearHistory={clearHistory} />} />
          </Routes>
        </main>
        <BottomNav open={navOpen} onClose={() => setNavOpen(false)} />
      </div>
    </BrowserRouter>
  );
}
