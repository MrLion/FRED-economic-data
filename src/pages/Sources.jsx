import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSources, getSourceReleases } from '../api/fred';
import { useFred } from '../hooks/useFred';
import Loading, { ErrorMessage } from '../components/Loading';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function Sources() {
  const navigate = useNavigate();
  const { data: sources, loading, error, refetch } = useFred(() => getSources(), []);
  const [expanded, setExpanded] = useState(null);
  const [releases, setReleases] = useState({});
  const [loadingReleases, setLoadingReleases] = useState(null);

  const toggleSource = async (sourceId) => {
    if (expanded === sourceId) {
      setExpanded(null);
      return;
    }
    setExpanded(sourceId);
    if (!releases[sourceId]) {
      setLoadingReleases(sourceId);
      try {
        const data = await getSourceReleases(sourceId);
        setReleases(prev => ({ ...prev, [sourceId]: data }));
      } catch {
        setReleases(prev => ({ ...prev, [sourceId]: [] }));
      } finally {
        setLoadingReleases(null);
      }
    }
  };

  if (loading) return <Loading text="Loading sources..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="page sources-page">
      <h1 className="page-title">Data Sources</h1>
      <p className="page-subtitle">{sources?.length || 0} sources available</p>

      <div className="source-list">
        {sources?.map(source => (
          <div key={source.id} className="source-item">
            <div className="source-header" onClick={() => toggleSource(source.id)}>
              <div className="source-info">
                <h3 className="source-name">{source.name}</h3>
                {source.link && (
                  <p className="source-link">{source.link}</p>
                )}
              </div>
              {expanded === source.id
                ? <ChevronDown size={16} className="source-chevron expanded" />
                : <ChevronDown size={16} className="source-chevron" />
              }
            </div>

            {expanded === source.id && (
              <div className="source-releases">
                {loadingReleases === source.id ? (
                  <p className="source-releases-loading">Loading releases...</p>
                ) : releases[source.id]?.length > 0 ? (
                  releases[source.id].map(rel => (
                    <div
                      key={rel.id}
                      className="release-item"
                      onClick={() => navigate(`/release/${rel.id}`)}
                    >
                      <span className="release-name">{rel.name}</span>
                      <ChevronRight size={14} />
                    </div>
                  ))
                ) : (
                  <p className="source-releases-empty">No releases available</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
