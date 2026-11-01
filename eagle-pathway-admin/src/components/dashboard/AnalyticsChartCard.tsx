'use client';
import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LegendItem {
  label: string;
  count?: string | number;
  color: string;
}

interface AnalyticsChartCardProps {
  title: string;
  subtitle?: string;
  legends?: LegendItem[];
  groupByOptions?: { label: string; value: string }[];
  selectedGroupBy?: string;
  onGroupByChange?: (value: string) => void;
  loading?: boolean;
  children: React.ReactNode;
}

export default function AnalyticsChartCard({
  title,
  subtitle,
  legends,
  groupByOptions,
  selectedGroupBy,
  onGroupByChange,
  loading = false,
  children,
}: AnalyticsChartCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          {groupByOptions && onGroupByChange && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-[11px] font-medium text-slate-400">Group by</span>
              <select
                value={selectedGroupBy}
                onChange={(e) => onGroupByChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {groupByOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Legend row */}
        {legends && legends.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-2 border-t border-slate-100">
            {legends.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 font-medium">{item.label}</span>
                {item.count !== undefined && (
                  <span className="text-slate-900 font-bold ml-0.5">{item.count}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart container */}
      <div className="h-64 w-full mt-4 relative">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

