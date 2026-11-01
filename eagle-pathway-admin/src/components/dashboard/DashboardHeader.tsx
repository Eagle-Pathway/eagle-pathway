'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, MoreHorizontal, RefreshCw, Download, Check } from 'lucide-react';

export type DashboardTab = 'overview' | 'applications' | 'acquisition' | 'operations';
export type DateRange = '7d' | '30d' | '90d' | 'all';

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onRefresh: () => void;
  onExport?: () => void;
  isRefreshing?: boolean;
}

export default function DashboardHeader({
  activeTab,
  onTabChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  onExport,
  isRefreshing = false,
}: DashboardHeaderProps) {
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs: { id: DashboardTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'applications', label: 'Applications' },
    { id: 'acquisition', label: 'Acquisition' },
    { id: 'operations', label: 'Operations' },
  ];

  const dateLabels: Record<DateRange, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    'all': 'All time',
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
      {/* Tab Pills */}
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5" aria-label="Dashboard Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Action Controls */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        {/* Date Range Selector */}
        <div className="relative" ref={dateDropdownRef}>
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{dateLabels[dateRange]}</span>
          </button>

          {showDateDropdown && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30">
              {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    onDateRangeChange(range);
                    setShowDateDropdown(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <span>{dateLabels[range]}</span>
                  {dateRange === range && <Check className="w-3.5 h-3.5 text-brand-blue" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Dashboard"
          className="flex items-center justify-center p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-blue' : ''}`} />
        </button>

        {/* More Actions Menu */}
        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex items-center justify-center p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
            title="More Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30">
              {onExport && (
                <button
                  onClick={() => {
                    onExport();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export Dashboard Data</span>
                </button>
              )}
              <div className="px-3 py-1 text-[10px] text-slate-400 border-t border-slate-100 mt-1">
                Eagle Pathway Ops v2.4
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

