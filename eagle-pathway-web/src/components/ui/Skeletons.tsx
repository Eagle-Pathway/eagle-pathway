'use client';

import React from 'react';

export function ScholarshipCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs flex flex-col justify-between animate-pulse">
      <div className="space-y-3.5">
        {/* Badges Pill Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-5 w-20 rounded-full bg-slate-200" />
          <div className="h-5 w-24 rounded-full bg-slate-100" />
          <div className="h-5 w-16 rounded-full bg-slate-100" />
        </div>

        {/* Title & Host Institution */}
        <div className="space-y-2 pt-1">
          <div className="h-5 w-4/5 rounded-md bg-slate-200" />
          <div className="h-4 w-3/5 rounded-md bg-slate-100" />
        </div>

        {/* Description Excerpt */}
        <div className="space-y-1.5 pt-1">
          <div className="h-3.5 w-full rounded-md bg-slate-100" />
          <div className="h-3.5 w-5/6 rounded-md bg-slate-100" />
        </div>
      </div>

      {/* Footer bar with deadline & button */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="h-4 w-28 rounded-md bg-slate-200" />
        <div className="h-7 w-20 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

export function TutorCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs flex flex-col justify-between animate-pulse">
      <div className="space-y-3.5">
        {/* Tutor Avatar & Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded-md bg-slate-200" />
            <div className="h-3 w-24 rounded-md bg-slate-100" />
          </div>
        </div>

        {/* Bio preview */}
        <div className="space-y-1.5 pt-1">
          <div className="h-3.5 w-full rounded-md bg-slate-100" />
          <div className="h-3.5 w-4/5 rounded-md bg-slate-100" />
        </div>

        {/* Subject badges */}
        <div className="space-y-1.5 pt-1">
          <div className="h-2.5 w-16 rounded bg-slate-200" />
          <div className="flex gap-1.5">
            <div className="h-5 w-16 rounded bg-slate-100" />
            <div className="h-5 w-14 rounded bg-slate-100" />
            <div className="h-5 w-20 rounded bg-slate-100" />
          </div>
        </div>
      </div>

      {/* Footer Rate & View Profile */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="h-5 w-24 rounded-md bg-slate-200" />
        <div className="h-8 w-24 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export function DetailHeroSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      {/* Back button placeholder */}
      <div className="h-4 w-32 rounded bg-slate-200" />

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex gap-2">
              <div className="h-5 w-24 rounded-full bg-slate-200" />
              <div className="h-5 w-20 rounded-full bg-slate-100" />
            </div>
            <div className="h-7 w-3/4 rounded-md bg-slate-200" />
            <div className="h-4 w-1/3 rounded-md bg-slate-100" />
          </div>
          <div className="h-9 w-24 rounded-xl bg-slate-200" />
        </div>

        {/* Banner Placeholder */}
        <div className="h-16 rounded-xl bg-slate-100 border border-slate-200/60" />

        {/* Body content placeholders */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="space-y-2 pt-1">
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-4/5 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrackerBoardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Header Placeholder */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-7 w-64 rounded bg-slate-200" />
        </div>
        <div className="h-9 w-36 rounded-xl bg-slate-200" />
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="bg-slate-100/70 rounded-xl p-3 space-y-3 border border-slate-200/60">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-4 w-6 rounded-full bg-slate-200" />
            </div>
            <div className="space-y-2.5">
              {[1, 2].map((card) => (
                <div key={card} className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                  <div className="h-5 w-20 rounded-full bg-slate-100 mt-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-5 w-36 rounded bg-slate-200" />
                <div className="h-5 w-16 rounded-full bg-slate-100" />
              </div>
              <div className="h-3.5 w-48 rounded bg-slate-100" />
              <div className="h-3.5 w-32 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-9 w-28 rounded-xl bg-slate-200 self-end md:self-center" />
        </div>
      ))}
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-start gap-3.5"
        >
          <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="h-4 w-44 rounded bg-slate-200" />
              <div className="h-3 w-16 rounded bg-slate-100" />
            </div>
            <div className="h-3.5 w-4/5 rounded bg-slate-100" />
            <div className="h-3 w-1/3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TutorJobSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-48 rounded bg-slate-200" />
                <div className="h-5 w-16 rounded-full bg-slate-100" />
              </div>
              <div className="h-3.5 w-32 rounded bg-slate-100" />
            </div>
            <div className="h-6 w-24 rounded-full bg-slate-100" />
          </div>

          <div className="space-y-2">
            <div className="h-3.5 w-full rounded bg-slate-100" />
            <div className="h-3.5 w-5/6 rounded bg-slate-100" />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-8 w-28 rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}


