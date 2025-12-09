import React from 'react';
import { DollarSign, Calendar, Clock, BookOpen, GraduationCap, Zap, Network } from 'lucide-react';
import { ChartType } from '../types';

interface ChartCardsNavigatorProps {
  onScrollTo: (key: ChartType) => void;
}

export const ChartCardsNavigator: React.FC<ChartCardsNavigatorProps> = ({ onScrollTo }) => {
  const items = [
    { id: 'salary', label: 'Expected Salary Distribution', icon: DollarSign, color: 'bg-green-50 border-green-200 text-green-800' },
    { id: 'age', label: 'Age Distribution', icon: Calendar, color: 'bg-orange-50 border-orange-200 text-orange-800' },
    { id: 'availability', label: 'Availability Distribution', icon: Clock, color: 'bg-teal-50 border-teal-200 text-teal-800' },
    { id: 'education', label: 'Education Subject 1', icon: BookOpen, color: 'bg-sky-50 border-sky-200 text-sky-800' },
    { id: 'major', label: 'University Major', icon: GraduationCap, color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    { id: 'function', label: 'Past Functional Skills 1', icon: Zap, color: 'bg-rose-50 border-rose-200 text-rose-800' },
    { id: 'domain', label: 'Past Domain Experience Knowledge Skills 1', icon: Network, color: 'bg-amber-50 border-amber-200 text-amber-800' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onScrollTo(item.id as ChartType)}
          className={`${item.color} border p-4 rounded-lg flex flex-col items-center justify-center text-center gap-3 transition-all hover:scale-105 hover:shadow-md h-full min-h-[120px]`}
        >
          <item.icon size={24} className="opacity-80"/>
          <span className="text-xs font-bold leading-tight">{item.label}</span>
        </button>
      ))}
    </div>
  );
};