import React, { useMemo, useState } from 'react';
import { MatchResult } from '../types';
import { Info, ArrowUp } from 'lucide-react';

interface HistogramProps {
  data: MatchResult[];
  title: string;
  colorTheme: 'green' | 'orange' | 'teal' | 'sky' | 'cyan' | 'rose' | 'amber';
  getValue: (c: MatchResult) => string | number;
  bucketType: 'range' | 'category';
  rangeBuckets?: { label: string; min: number; max: number }[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  categoryParser?: (val: string) => string;
}

export const Histogram: React.FC<HistogramProps> = ({
  data,
  title,
  colorTheme,
  getValue,
  bucketType,
  rangeBuckets,
  selectedIds,
  onToggleSelect,
  categoryParser,
}) => {
  const [hoveredCandidate, setHoveredCandidate] = useState<{ id: number; name: string; value: string; x: number; y: number } | null>(null);

  // Group data into buckets
  const buckets = useMemo(() => {
    const map = new Map<string, MatchResult[]>();

    if (bucketType === 'range' && rangeBuckets) {
      // Initialize buckets
      rangeBuckets.forEach(b => map.set(b.label, []));
      
      data.forEach(item => {
        const val = getValue(item) as number;
        const bucket = rangeBuckets.find(b => val >= b.min && (b.max === Infinity ? true : val < b.max));
        if (bucket) {
          map.get(bucket.label)?.push(item);
        }
      });

      // Sort dots within each bucket to ensure visual order: Lowest at bottom, Highest at top.
      // Since flex-col-reverse renders index 0 at the bottom, we sort Ascending.
      map.forEach(items => {
        items.sort((a, b) => {
            const valA = Number(getValue(a));
            const valB = Number(getValue(b));
            return valA - valB;
        });
      });

    } else {
      // Dynamic categories
      data.forEach(item => {
        const val = getValue(item) as string;
        let key = 'Unknown';

        if (categoryParser) {
            key = categoryParser(val);
        } else {
            // Default: Clean up value, handle first item of comma list
            key = val.split(',')[0].trim() || 'Unknown';
        }

        if (!map.has(key)) map.set(key, []);
        map.get(key)?.push(item);
      });
    }

    let entries = Array.from(map.entries());

    // For range buckets, keep all labels even if empty. For categories, filter out empty
    if (bucketType !== 'range') {
      entries = entries.filter(([_, items]) => items.length > 0);
      // Sort categories by count desc
      return entries
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10); // Limit to top 10 columns for readability
    }

    return entries;
  }, [data, bucketType, rangeBuckets, getValue, categoryParser]);

  // Find max count for Y-axis scaling
  const maxCount = Math.max(...buckets.map(([_, items]) => items.length), 1);

  // Colors based on the provided design screenshots
  const themeStyles = {
    green:  { bar: 'bg-green-200', dot: 'bg-green-600', dotSelected: 'bg-yellow-400 ring-2 ring-yellow-200' },
    orange: { bar: 'bg-orange-200', dot: 'bg-orange-600', dotSelected: 'bg-yellow-400 ring-2 ring-yellow-200' },
    teal:   { bar: 'bg-teal-200', dot: 'bg-teal-600', dotSelected: 'bg-yellow-400 ring-2 ring-yellow-200' },
    sky:    { bar: 'bg-sky-200', dot: 'bg-sky-600', dotSelected: 'bg-yellow-400 ring-2 ring-yellow-200' },
    cyan:   { bar: 'bg-cyan-200', dot: 'bg-cyan-600', dotSelected: 'bg-yellow-400 ring-2 ring-yellow-200' },
    rose:   { bar: 'bg-rose-200', dot: 'bg-rose-600', dotSelected: 'bg-yellow-400 ring-2 ring-yellow-200' },
    amber:  { bar: 'bg-amber-200', dot: 'bg-amber-600', dotSelected: 'bg-yellow-400 ring-2 ring-yellow-200' },
  }[colorTheme];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px] relative">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {bucketType === 'range' && (
            <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex flex-col gap-1 items-center justify-center bg-slate-50 p-1.5 rounded border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Visual Guide</span>
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-700">Top Dot = Highest Value</span>
                        <ArrowUp size={12} className="text-slate-400" />
                    </div>
                </div>
            </div>
        )}
      </div>
      
      <div className="flex flex-1 min-h-0 w-full">
        
        {/* Y Axis Sidebar */}
        <div className="flex items-center gap-2 pr-2">
            <div className="h-full flex items-center justify-center w-6">
                <span className="-rotate-90 text-xs font-bold text-slate-500 whitespace-nowrap transform origin-center">
                    Candidate Count
                </span>
            </div>
            {/* pb-12 accounts for the h-10 (40px) label height + mt-2 (8px) margin = 48px = 3rem = 12 units */}
            <div className="flex flex-col justify-between h-full text-xs text-slate-400 text-right w-6 pb-12"> 
                <span>{maxCount}</span>
                <span>{Math.round(maxCount / 2)}</span>
                <span>0</span>
            </div>
        </div>

        {/* Chart Main Area */}
        <div className="flex-1 flex flex-col h-full min-w-0">
            {/* Plot Area */}
            <div className="flex-1 flex items-end gap-2 sm:gap-4 border-l border-b border-slate-200 pl-2 pb-0.5 relative">
                {buckets.map(([label, items], idx) => {
                    const heightPct = (items.length / maxCount) * 100;
                    const hasItems = items.length > 0;
                    return (
                        <div key={idx} className="flex-1 h-full flex flex-col justify-end group">
                            {/* Histogram Bar - only show if has items */}
                            {hasItems && (
                                <div
                                    className={`w-full rounded-t-sm transition-all duration-500 flex flex-col-reverse flex-wrap content-center gap-1 p-1 ${themeStyles.bar} relative z-10`}
                                    style={{ height: `${Math.max(heightPct, 5)}%` }}
                                >
                                    {/* Dots */}
                                    {items.map((res) => {
                                        const isSelected = selectedIds.has(res.candidate.candidate_id);
                                        return (
                                            <button
                                                key={res.candidate.candidate_id}
                                                onClick={() => onToggleSelect(res.candidate.candidate_id)}
                                                onMouseEnter={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoveredCandidate({
                                                        id: res.candidate.candidate_id,
                                                        name: `${res.candidate.first_name} ${res.candidate.last_name}`,
                                                        value: getValue(res).toString(),
                                                        x: rect.left + rect.width / 2,
                                                        y: rect.top
                                                    });
                                                }}
                                                onMouseLeave={() => setHoveredCandidate(null)}
                                                className={`
                                                    w-3 h-3 rounded-full transition-all duration-200 hover:scale-150
                                                    ${isSelected ? `z-20 ${themeStyles.dotSelected}` : `${themeStyles.dot} opacity-90 hover:opacity-100`}
                                                `}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* X Axis Labels Area */}
            <div className="h-10 flex gap-2 sm:gap-4 pl-2 mt-2 w-full">
                {buckets.map(([label], idx) => (
                    <div key={idx} className="flex-1 flex justify-center">
                        <span className="text-[10px] sm:text-xs text-slate-600 font-bold text-center leading-tight line-clamp-2 w-full" title={label}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCandidate && (
        <div 
          className="fixed z-50 bg-slate-900 text-white text-xs rounded px-2 py-1 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mb-1 whitespace-nowrap"
          style={{ left: hoveredCandidate.x, top: hoveredCandidate.y - 4 }}
        >
          <div className="font-bold">{hoveredCandidate.name}</div>
          <div className="text-slate-300">{hoveredCandidate.value}</div>
        </div>
      )}
    </div>
  );
};