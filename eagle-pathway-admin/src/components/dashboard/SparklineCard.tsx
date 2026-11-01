'use client';
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';

interface SparklineCardProps {
  title: string;
  value: string | number;
  data: { val: number; label?: string }[];
  gradientId: string;
  strokeColor?: string;
  fillColor?: string;
  subtitle?: string;
  badge?: { text: string; positive?: boolean };
  loading?: boolean;
}

export default function SparklineCard({
  title,
  value,
  data,
  gradientId,
  strokeColor = '#2563EB',
  fillColor = '#3B82F6',
  subtitle,
  badge,
  loading = false,
}: SparklineCardProps) {
  // Ensure we have at least 2 points to draw a clean curve
  const chartData = data.length > 0 ? data : [{ val: 0 }, { val: 0 }];

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </p>
          {badge && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                badge.positive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {badge.text}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          {loading ? (
            <div className="h-8 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : (
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {value}
            </span>
          )}
          {subtitle && !loading && (
            <span className="text-xs text-slate-400 font-medium truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="h-10 w-full mt-2 -mb-1">
        {loading ? (
          <div className="w-full h-full bg-slate-50 animate-pulse rounded" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={fillColor} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={fillColor} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none">
                        {item.label ? `${item.label}: ` : ''}
                        <span className="font-bold">{payload[0].value}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="val"
                stroke={strokeColor}
                strokeWidth={1.75}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

