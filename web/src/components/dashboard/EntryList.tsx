import React from 'react';
import { Entry, Theme } from '@shared/types';
import { getUsageBadgeStyle } from '../ThemeUI';

interface EntryListProps {
  entries: Entry[];
  onSelectEntry: (entry: Entry) => void;
  t: any;
  theme: Theme;
}

// Helper function to convert Firestore Timestamp to a readable date string
const formatDate = (dateObj: { seconds: number; nanoseconds: number } | undefined, locale: string) => {
  if (!dateObj || typeof dateObj.seconds !== 'number') {
    return 'Invalid Date';
  }
  return new Date(dateObj.seconds * 1000).toLocaleDateString(locale);
};

const EntryList: React.FC<EntryListProps> = ({ entries, onSelectEntry, t, theme }) => {
  const isVintage = theme === 'vintage';

  // [FIX START] 修改排序邏輯：
  // 1. 先比日期 (date.seconds)
  // 2. 日期相同 (都是中午 12:00) 時，比對 ID (建立時間戳記)，確保最新輸入的在最上面
  const sortedEntries = [...entries].sort((a, b) => {
    const dateDiff = b.date.seconds - a.date.seconds;
    if (dateDiff !== 0) return dateDiff;
    
    // ID 是 Date.now() 字串，越大代表越晚建立
    return b.id.localeCompare(a.id);
  });
  // [FIX END]

  return (
    <div>
       <h3 className={`mb-4 font-bold text-lg ${
         isVintage ? 'text-vintage-ink font-typewriter border-b border-vintage-line inline-block' : 'text-gray-900'
       }`}>
         {t.dashboard.recent}
       </h3>
       
       {sortedEntries.length === 0 ? (
         <div className={`text-center py-10 ${isVintage ? 'text-vintage-leather/60 font-handwriting text-xl' : 'text-gray-400'}`}>
            {t.dashboard.noEntries}
            <br/>
            {t.dashboard.tapToStart}
         </div>
       ) : (
         <div className="space-y-3">
            {sortedEntries.map(entry => (
               <div 
                 key={entry.id}
                 onClick={() => onSelectEntry(entry)}
                 className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${
                    isVintage 
                      ? 'bg-vintage-card border-b border-vintage-line hover:bg-vintage-ink/5' 
                      : 'bg-white shadow-sm hover:shadow-md'
                 }`}
               >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0 overflow-hidden ${
                     isVintage ? 'bg-vintage-line text-vintage-ink border border-vintage-ink' : 'bg-gray-100 text-gray-500'
                  }`}>
                     {entry.imageUrl ? (
                        <img src={entry.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async"  />
                     ) : (
                        <span className="text-xl font-bold">{entry.itemName ? entry.itemName[0].toUpperCase() : '?'}</span>
                     )}
                  </div>

                  <div className="flex-1 min-w-0">
                     <h4 className={`font-bold truncate ${isVintage ? 'text-vintage-ink font-typewriter' : 'text-gray-900'}`}>
                       {entry.itemName}
                     </h4>
                     <div className="flex items-center text-xs mt-1 gap-2">
                        <span className={getUsageBadgeStyle(entry.usage, theme) + " px-2 py-0.5 rounded text-[10px] uppercase font-bold border"}>
                          {t.usage[entry.usage]}
                        </span>
                        <span className={isVintage ? 'text-vintage-leather' : 'text-gray-400'}>
                           {formatDate(entry.date, 'en-US')}
                        </span>
                     </div>
                  </div>

                  <div className="text-right">
                     {(entry.type === 'expense' || entry.type === 'combined') && (
                        <div className={`font-bold ${isVintage ? 'text-vintage-ink font-typewriter' : 'text-gray-900'}`}>
                           {t.dashboard.unitCurrency}{entry.cost}
                        </div>
                     )}
                     {(entry.type === 'diet' || entry.type === 'combined') && (
                        <div className={`text-xs font-medium ${isVintage ? 'text-vintage-leather' : 'text-gray-500'}`}>
                           {entry.calories} {t.dashboard.unitCal}
                        </div>
                     )}
                  </div>
               </div>
            ))}
         </div>
       )}
    </div>
  );
};

export default EntryList;