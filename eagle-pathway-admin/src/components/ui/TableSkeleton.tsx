import React from 'react';

interface TableSkeletonProps {
  cols: number;
  rows?: number;
  avatarCol?: boolean;
}

export function TableSkeleton({ cols, rows = 5, avatarCol = true }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIndex) => (
        <tr key={rIndex} className="animate-pulse">
          {Array.from({ length: cols }).map((_, cIndex) => {
            if (cIndex === 0 && avatarCol) {
              return (
                <td key={cIndex} className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div className="ml-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </td>
              );
            }
            return (
              <td key={cIndex} className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
