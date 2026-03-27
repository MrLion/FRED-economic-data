import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategoryChildren, getCategorySeries, getCategory } from '../api/fred';
import SeriesCard from '../components/SeriesCard';
import Loading, { ErrorMessage } from '../components/Loading';
import { ChevronRight } from 'lucide-react';

export default function Categories() {
  const { id } = useParams();
  const categoryId = id ? Number(id) : 0;
  const navigate = useNavigate();

  const [categoryName, setCategoryName] = useState('');
  const [children, setChildren] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seriesOffset, setSeriesOffset] = useState(0);
  const [totalSeries, setTotalSeries] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setSeriesOffset(0);
      try {
        const [catChildren, catInfo] = await Promise.all([
          getCategoryChildren(categoryId),
          categoryId > 0 ? getCategory(categoryId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setChildren(catChildren);
        setCategoryName(catInfo?.categories?.[0]?.name || 'Categories');

        if (catChildren.length === 0) {
          const result = await getCategorySeries(categoryId, { limit: 50, offset: 0 });
          if (cancelled) return;
          setSeries(result.series);
          setTotalSeries(result.count);
        } else {
          setSeries([]);
          setTotalSeries(0);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [categoryId]);

  const loadMoreSeries = async () => {
    const newOffset = seriesOffset + 50;
    try {
      const result = await getCategorySeries(categoryId, { limit: 50, offset: newOffset });
      setSeries(prev => [...prev, ...result.series]);
      setSeriesOffset(newOffset);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading text="Loading..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="page categories-page">
      <h1 className="page-title">{categoryId === 0 ? 'All Categories' : categoryName}</h1>

      {children.length > 0 && (
        <div className="category-list">
          {children.map(cat => (
            <div
              key={cat.id}
              className="category-list-item"
              onClick={() => navigate(`/categories/${cat.id}`)}
            >
              <span className="category-list-name">{cat.name}</span>
              <ChevronRight size={16} />
            </div>
          ))}
        </div>
      )}

      {series.length > 0 && (
        <div className="series-list">
          {series.map(s => <SeriesCard key={s.id} series={s} />)}
          {series.length < totalSeries && (
            <button className="btn-secondary load-more" onClick={loadMoreSeries}>
              Load more ({series.length} of {totalSeries})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
