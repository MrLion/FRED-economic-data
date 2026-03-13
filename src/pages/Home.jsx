import { useNavigate } from 'react-router-dom';
import { getCategoryChildren } from '../api/fred';
import { useFred } from '../hooks/useFred';
import Loading, { ErrorMessage } from '../components/Loading';

const categoryIcons = {
  'Money, Banking, & Finance': '🏦',
  'Population, Employment, & Labor Markets': '👥',
  'National Accounts': '📊',
  'Production & Business Activity': '🏭',
  'Prices': '💰',
  'International Data': '🌍',
  'U.S. Regional Data': '🗺️',
  'Academic Data': '🎓',
};

function getCategoryIcon(name) {
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (name.includes(key) || key.includes(name)) return icon;
  }
  return '📈';
}

export default function Home({ recentlyViewed }) {
  const navigate = useNavigate();
  const { data: categories, loading, error, refetch } = useFred(
    () => getCategoryChildren(0),
    []
  );

  return (
    <div className="page home-page">
      <section className="home-hero">
        <h1>FRED Economic Data</h1>
        <p>Explore thousands of economic data series from the Federal Reserve Bank of St. Louis</p>
      </section>

      {recentlyViewed.length > 0 && (
        <section className="home-section">
          <h2>Recently Viewed</h2>
          <div className="recent-list">
            {recentlyViewed.slice(0, 8).map(item => (
              <div
                key={item.id}
                className="recent-card"
                onClick={() => navigate(`/series/${item.id}`)}
              >
                <span className="recent-card-id">{item.id}</span>
                <p className="recent-card-title">{item.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="home-section">
        <h2>Browse Categories</h2>
        {loading && <Loading text="Loading categories..." />}
        {error && <ErrorMessage message={error} onRetry={refetch} />}
        {categories && (
          <div className="category-grid">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="category-card"
                onClick={() => navigate(`/categories/${cat.id}`)}
              >
                <span className="category-icon">{getCategoryIcon(cat.name)}</span>
                <span className="category-name">{cat.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
