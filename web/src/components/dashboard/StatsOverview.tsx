import React from 'react';
import { Theme } from '@shared/types';

interface StatsOverviewProps {
   t: any;
   theme: Theme;
   displayCost: number;
   displayCalories: number;
   showDateIndicator: boolean;
   selectedDayName?: string;
   mustCost: number;
   needCost: number;
   wantCost: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
   t,
   theme,
   displayCost,
   displayCalories,
   showDateIndicator,
   selectedDayName,
   mustCost,
   needCost,
   wantCost
}) => {
   const isVintage = theme === 'vintage';

   const totalUsageCost = mustCost + needCost + wantCost;
   const hasUsageData = totalUsageCost > 0;

   const mustPct = hasUsageData ? (mustCost / totalUsageCost) * 100 : 0;
   const needPct = hasUsageData ? (needCost / totalUsageCost) * 100 : 0;
   const wantPct = hasUsageData ? (wantCost / totalUsageCost) * 100 : 0;

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

            <div className={`p-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${isVintage
                  ? `vintage-card border-2 ${showDateIndicator ? 'border-vintage-stamp border-dashed' : 'border-vintage-line'}`
                  : `${showDateIndicator ? 'ring-2 ring-rose-200 bg-rose-50/50' : 'bg-rose-50 shadow-soft'}`
               }`}>
               <div className={`text-xs uppercase font-bold mb-1 ${isVintage ? 'text-vintage-leather font-typewriter' : 'text-rose-500'}`}>
                  {t.dashboard.spent}
               </div>
               <div className={`text-3xl font-black mb-3 ${isVintage ? 'text-vintage-stamp font-typewriter' : 'text-rose-600'}`}>
                  {t.dashboard.unitCurrency}{displayCost.toLocaleString()}
               </div>

               {/* Need vs Want Progress Bar */}
               <div className="mt-auto space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                     <span className={isVintage ? 'text-vintage-leather font-typewriter' : 'text-rose-400'}>Must / Need / Want</span>
                     {hasUsageData && (
                        <span className={isVintage ? 'text-vintage-stamp' : 'text-rose-500'}>
                           {Math.round(wantPct)}% Want
                        </span>
                     )}
                  </div>
                  <div className={`h-1.5 w-full rounded-full overflow-hidden flex ${isVintage ? 'bg-vintage-line' : 'bg-rose-100'}`}>
                     <div style={{ width: `${mustPct}%` }} className={`h-full transition-all duration-500 ${isVintage ? 'bg-vintage-stamp' : 'bg-rose-500'}`} />
                     <div style={{ width: `${needPct}%` }} className={`h-full transition-all duration-500 ${isVintage ? 'bg-vintage-ink' : 'bg-emerald-400'}`} />
                     <div style={{ width: `${wantPct}%` }} className={`h-full transition-all duration-500 ${isVintage ? 'bg-amber-800' : 'bg-amber-400'}`} />
                  </div>
               </div>
            </div>

            <div className={`p-4 rounded-2xl transition-all duration-300 flex flex-col justify-center ${isVintage
                  ? `vintage-card border-2 ${showDateIndicator ? 'border-vintage-ink border-dashed' : 'border-vintage-line'}`
                  : `${showDateIndicator ? 'ring-2 ring-emerald-200 bg-emerald-50/50' : 'bg-emerald-50 shadow-soft'}`
               }`}>
               <div className={`text-xs uppercase font-bold mb-1 ${isVintage ? 'text-vintage-leather font-typewriter' : 'text-emerald-600'}`}>
                  {t.dashboard.calories}
               </div>
               <div className={`text-3xl font-black ${isVintage ? 'text-vintage-ink font-typewriter' : 'text-emerald-700'}`}>
                  {displayCalories.toLocaleString()} <span className="text-sm font-medium opacity-70">{t.dashboard.unitCal}</span>
               </div>
            </div>
         </div>
      </>
   );
};

export default StatsOverview;
