import { useState, useMemo } from 'react';
import type { AdminRevenueDataPoint } from '@/types/admin.types';

interface RevenueChartProps {
  data: AdminRevenueDataPoint[];
  title?: string;
  height?: number;
}

export function RevenueChart({ data, title = 'Revenue Trend', height = 280 }: RevenueChartProps) {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'subscriptions' | 'walletTopups'>('revenue');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  const maxVal = useMemo(() => {
    if (chartData.length === 0) return 1000;
    const values = chartData.map((d) => d[activeMetric] || 0);
    const max = Math.max(...values, 0);
    // Add 15% headroom or fallback to 1000
    return max > 0 ? Math.ceil((max * 1.15) / 100) * 100 : 1000;
  }, [chartData, activeMetric]);

  const width = 800;
  const padding = { top: 25, right: 30, bottom: 40, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (chartData.length === 0) return [];
    const count = chartData.length;
    const xStep = count > 1 ? graphWidth / (count - 1) : graphWidth;

    return chartData.map((d, index) => {
      const val = d[activeMetric] || 0;
      const x = padding.left + index * xStep;
      const y = padding.top + graphHeight - (val / maxVal) * graphHeight;
      return { x, y, data: d, value: val };
    });
  }, [chartData, activeMetric, maxVal, graphWidth, graphHeight, padding.left, padding.top]);

  // Generate SVG path strings
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };

    let line = `M ${points[0]!.x} ${points[0]!.y}`;
    for (let i = 1; i < points.length; i++) {
      // Smooth cubic bezier or straight lines
      const prev = points[i - 1]!;
      const curr = points[i]!;
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      line += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    const first = points[0]!;
    const last = points[points.length - 1]!;
    const area = `${line} L ${last.x} ${padding.top + graphHeight} L ${first.x} ${padding.top + graphHeight} Z`;

    return { linePath: line, areaPath: area };
  }, [points, graphHeight, padding.top]);

  // Y-axis grid ticks (4 ticks)
  const yTicks = useMemo(() => {
    return [0, 0.33, 0.66, 1].map((pct) => {
      const val = Math.round(maxVal * pct);
      const y = padding.top + graphHeight - pct * graphHeight;
      return { val, y };
    });
  }, [maxVal, graphHeight, padding.top]);

  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]!, 10), parseInt(parts[1]!, 10) - 1, parseInt(parts[2]!, 10));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const hoveredPoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  const totalPeriodRevenue = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (curr[activeMetric] || 0), 0);
  }, [chartData, activeMetric]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl">
      {/* Chart Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100">{title}</h3>
            <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
              Live Timeseries
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            14-Day Trailing Generation: <strong className="text-white font-semibold">₹{totalPeriodRevenue.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveMetric('revenue')}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              activeMetric === 'revenue'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Total Revenue
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('subscriptions')}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              activeMetric === 'subscriptions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Subscriptions
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('walletTopups')}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              activeMetric === 'walletTopups'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wallet Top-Ups
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative pt-4">
        {chartData.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-xs text-slate-500">
            No transaction revenue recorded yet.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto min-w-[550px] overflow-visible"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#818cf8" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines and Y-axis labels */}
              {yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={tick.y}
                    x2={width - padding.right}
                    y2={tick.y}
                    stroke="#1e293b"
                    strokeDasharray={tick.val === 0 ? undefined : '4 4'}
                    strokeWidth={1}
                  />
                  <text
                    x={padding.left - 10}
                    y={tick.y + 4}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="500"
                  >
                    ₹{tick.val >= 1000 ? `${(tick.val / 1000).toFixed(1)}k` : tick.val}
                  </text>
                </g>
              ))}

              {/* Area fill */}
              {areaPath && (
                <path d={areaPath} fill="url(#revenueGradient)" />
              )}

              {/* Line path */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points and Interaction Circles */}
              {points.map((pt, i) => {
                const isHovered = hoveredIndex === i;
                return (
                  <g key={i}>
                    {/* Hover hotspot */}
                    <rect
                      x={pt.x - (graphWidth / points.length) / 2}
                      y={padding.top}
                      width={graphWidth / points.length}
                      height={graphHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(i)}
                    />

                    {/* Point Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 3.5}
                      fill={isHovered ? '#ffffff' : '#6366f1'}
                      stroke="#4f46e5"
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      className="transition-all duration-150 pointer-events-none"
                    />

                    {/* Vertical guide line on hover */}
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={padding.top}
                        x2={pt.x}
                        y2={padding.top + graphHeight}
                        stroke="#818cf8"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        className="pointer-events-none"
                      />
                    )}
                  </g>
                );
              })}

              {/* X-axis date labels (skip alternate if many points) */}
              {points.map((pt, i) => {
                const step = points.length > 10 ? 2 : 1;
                if (i % step !== 0 && i !== points.length - 1) return null;
                return (
                  <text
                    key={i}
                    x={pt.x}
                    y={height - 10}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {formatDateLabel(pt.data.date)}
                  </text>
                );
              })}
            </svg>
          </div>
        )}

        {/* Floating Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs text-white shadow-2xl backdrop-blur-md"
            style={{
              left: `${Math.min(Math.max(hoveredPoint.x, 120), width - 140)}px`,
              top: '10px',
            }}
          >
            <div className="font-bold text-slate-300 border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between gap-3">
              <span>{formatDateLabel(hoveredPoint.data.date)}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {hoveredPoint.data.transactionsCount} Txns
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4 font-extrabold text-indigo-400">
                <span>Total:</span>
                <span>₹{hoveredPoint.data.revenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[11px] text-emerald-400 font-medium">
                <span>Subscriptions:</span>
                <span>₹{hoveredPoint.data.subscriptions.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[11px] text-purple-400 font-medium">
                <span>Wallet Top-Ups:</span>
                <span>₹{hoveredPoint.data.walletTopups.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
