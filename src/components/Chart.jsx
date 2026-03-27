import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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

export default function Chart({ observations, title }) {
  if (!observations?.length) return <p className="chart-empty">No data available</p>;

  const data = observations.map(o => ({
    date: o.date,
    value: Number(o.value),
  }));

  // Reduce data points for performance on large datasets
  const maxPoints = 500;
  const step = Math.max(1, Math.floor(data.length / maxPoints));
  const displayData = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300} className="chart-responsive">
        <LineChart data={displayData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid horizontal={true} vertical={false} stroke="#E2E8F0" />
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
