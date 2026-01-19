import React from 'react';
import { Icon } from '../Icons';
import { Theme } from '../@shared/types';

interface InsightCardProps {
  t: any;
  theme: Theme;
  insightText: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ t, theme, insightText }) => {
  const isVintage = theme === 'vintage';

  if (isVintage) {
    return (
      <div className="relative mt-2 mb-2 p-6 bg-white shadow-md transform -rotate-1 border border-vintage-line/50">
         {/* Tape Effect */}
         <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-yellow-100/80 border border-white/50 rotate-1 shadow-sm opacity-80"></div>
         
         <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-full border-2 border-vintage-stamp text-vintage-stamp flex items-center justify-center">
                 <Icon name="sparkles" className="w-4 h-4" />
             </div>
             <span className="text-vintage-stamp font-typewriter text-sm font-bold uppercase tracking-widest">
                {t.dashboard.insights.title}
             </span>
         </div>
         <p className="font-handwriting text-xl text-vintage-ink leading-relaxed pl-2 border-l-2 border-vintage-line/30">
            {insightText}
         </p>
         <p className="mt-3 text-[10px] text-vintage-ink/50 font-typewriter border-t border-vintage-line/20 pt-2">
            {t.addEntry.disclaimer}
         </p>
      </div>
    );
  }

  return (
    <div className="mt-2 bg-gradient-to-br from-brand-50 to-white p-5 rounded-2xl border border-brand-100 shadow-sm flex flex-col gap-2">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-brand-100 text-brand-600 rounded-xl shrink-0">
            <Icon name="sparkles" className="w-5 h-5" />
        </div>
        <div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">{t.dashboard.insights.title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">{insightText}</p>
        </div>
      </div>
       <div className="pl-[3.25rem]">
        <p className="text-[10px] text-gray-400">
           {t.addEntry.disclaimer}
        </p>
      </div>
    </div>
  );
};

export default InsightCard;
