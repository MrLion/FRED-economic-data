import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea } from 'recharts';

function formatValue(val) {
  const num = Number(val);
  if (isNaN(num)) return val;
  if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(2);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date" style={{ fontFamily: "'Geist Mono', monospace" }}>{label}</p>
      <p className="chart-tooltip-value" style={{ fontFamily: "'Satoshi', sans-serif" }}>{Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
}

export default function Chart({ observations, title, recessionPeriods = [] }) {
  if (!observations?.length) return <p className="chart-empty">No data available</p>;

  const data = observations.map(o => ({
    date: o.date,
    value: Number(o.value),
  }));

  // Reduce data points for performance on large datasets
  const maxPoints = 500;
  const step = Math.max(1, Math.floor(data.length / maxPoints));
  const displayData = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  // Auto-scale Y-axis to data range with 10% padding so low-variability
  // series fill the chart area instead of being compressed to a flat line
  const values = displayData.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;
  const padding = range > 0 ? range * 0.1 : Math.abs(maxVal) * 0.1 || 1;
  const yDomain = [
    minVal - padding,
    maxVal + padding,
  ];

  const dataStart = displayData[0]?.date ?? '';
  const dataEnd = displayData[displayData.length - 1]?.date ?? '';

  // Only show recession shading when observations are dense enough to be meaningful.
  // Decennial Census data (avg gap ~3650d) produces misleadingly wide bands because
  // recharts' categorical axis gives equal width to every data point regardless of
  // the time it represents.
  const avgGapDays = displayData.length > 1
    ? (new Date(dataEnd) - new Date(dataStart)) / (displayData.length - 1) / 86400000
    : Infinity;
  const showRecessions = avgGapDays < 550; // monthly=~30, quarterly=~90, annual=~365, decennial=~3650

  const dates = displayData.map(d => d.date);
  // Snap recession boundaries to actual observation dates — recharts ReferenceArea
  // requires x1/x2 to exist in the data array. For monthly USREC boundary dates
  // that don't match quarterly/annual observations, snapping prevents broken rendering.
  const visibleRecessions = showRecessions
    ? recessionPeriods
        .filter(r => r.end >= dataStart && r.start <= dataEnd)
        .map(r => {
          const x1 = dates.find(d => d >= r.start) ?? dataStart;
          const x2 = [...dates].reverse().find(d => d <= r.end) ?? dataEnd;
          return x1 <= x2 ? { x1, x2 } : null;
        })
        .filter(Boolean)
    : [];

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300} className="chart-responsive">
        <LineChart data={displayData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid horizontal={true} vertical={false} stroke="#E2E8F0" />
          {visibleRecessions.map((r, i) => (
            <ReferenceArea key={i} x1={r.x1} x2={r.x2} fill="rgba(180,180,180,0.25)" stroke="none" />
          ))}
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: "'Geist Mono', monospace" }}
            tickFormatter={(d) => d.substring(0, 4)}
            interval="preserveStartEnd"
            minTickGap={40}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: "'Geist Mono', monospace" }}
            tickFormatter={formatValue}
            width={55}
            orientation="right"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1B3A5C"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#1B3A5C', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="chart-source">Source: Federal Reserve Economic Data (FRED)</p>
    </div>
  );
}
