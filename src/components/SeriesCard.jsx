import { useNavigate } from 'react-router-dom';

export default function SeriesCard({ series }) {
  const navigate = useNavigate();

  return (
    <div className="series-card" onClick={() => navigate(`/series/${series.id}`)}>
      <div className="series-card-header">
        <span className="series-card-id">{series.id}</span>
        {series.frequency && (
          <span className="series-card-freq">{series.frequency}</span>
        )}
      </div>
      <h3 className="series-card-title">{series.title}</h3>
      {series.observation_end && (
        <p className="series-card-date">Last updated: {series.observation_end}</p>
      )}
      {series.units && (
        <p className="series-card-units">{series.units}</p>
      )}
    </div>
  );
}
