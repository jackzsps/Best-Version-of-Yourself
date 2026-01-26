import React from 'react';
import { Theme } from '@shared/types';

interface StatsOverviewProps {
  t: any;
  theme: Theme;
  displayCost: number;
  displayCalories: number;
  showDateIndicator: boolean;
  selectedDayName?: string;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ 
  t, 
  theme, 
  displayCost, 
  displayCalories, 
  showDateIndicator,
  selectedDayName 
}) => {
  const isVintage = theme === 'vintage';

  return (
    <>
      {/* Selected Date Indicator for Vintage Theme */}
      {isVintage && showDateIndicator && (
         <div className="flex justify-center -mb-2 animate-fade-in">
            <span className="font-handwriting text-xl text-vintage-stamp bg-vintage-card px-4 py-1 border border-vintage-line rotate-1 shadow-sm">
               Viewing: {selectedDayName}
            </span>
         </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 relative">
        {/* Bento Theme Date Indicator overlay */}
        {!isVintage && showDateIndicator && (
           <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
              <span className="bg-brand-100 text-brand-700 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-brand-200">
                 Viewing: {selectedDayName}
              </span>
           </div>
        )}

        <div className={`p-4 rounded-2xl transition-all duration-300 ${
           isVintage 
             ? `vintage-card border-2 ${showDateIndicator ? 'border-vintage-stamp' : 'border-vintage-ink'}` 
             : `bg-white shadow-soft ${showDateIndicator ? 'ring-2 ring-brand-100' : ''}`
        }`}>
           <div className={`text-xs uppercase font-bold mb-1 ${isVintage ? 'text-vintage-leather font-typewriter' : 'text-gray-400'}`}>
              {t.dashboard.spent}
           </div>
           <div className={`text-2xl font-black ${isVintage ? 'text-vintage-ink font-typewriter' : 'text-gray-900'}`}>
              {t.dashboard.unitCurrency}{displayCost.toLocaleString()}
           </div>
        </div>
        <div className={`p-4 rounded-2xl transition-all duration-300 ${
           isVintage 
             ? `vintage-card border-2 ${showDateIndicator ? 'border-vintage-stamp' : 'border-vintage-ink'}` 
             : `bg-white shadow-soft ${showDateIndicator ? 'ring-2 ring-brand-100' : ''}`
        }`}>
           <div className={`text-xs uppercase font-bold mb-1 ${isVintage ? 'text-vintage-leather font-typewriter' : 'text-gray-400'}`}>
              {t.dashboard.calories}
           </div>
           <div className={`text-2xl font-black ${isVintage ? 'text-vintage-ink font-typewriter' : 'text-gray-900'}`}>
              {displayCalories.toLocaleString()} <span className="text-sm font-medium">{t.dashboard.unitCal}</span>
           </div>
        </div>
      </div>
    </>
  );
};

export default StatsOverview;
