import React, { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { Entry } from '../types';
import { XIcon } from '../components/Icons';

// Sub-components
import StatsOverview from '../components/dashboard/StatsOverview';
import ChartSection from '../components/dashboard/ChartSection';
import InsightCard from '../components/dashboard/InsightCard';
import EntryList from '../components/dashboard/EntryList';
import EditEntryModal from '../components/dashboard/EditEntryModal';

const Dashboard = () => {
  const { entries, updateEntry, deleteEntry, t, theme } = useApp();
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selectedDay, setSelectedDay] = useState<{name: string, cost: number, kcal: number} | null>(null);
  
  // New States for Report View
  const [reportTab, setReportTab] = useState<'trends' | 'spending' | 'nutrition'>('trends');
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const isVintage = theme === 'vintage';

  // --- Data Calculations ---

  // 1. Calculate Today's Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEntries = entries.filter(e => e.timestamp >= today.getTime());
  
  const todayCost = todayEntries.reduce((sum, e) => sum + (e.cost || 0), 0);
  const todayCalories = todayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);

  // 2. Filter Entries based on Time Range
  const filteredEntries = useMemo(() => {
     const now = new Date();
     now.setHours(23, 59, 59, 999);
     const past = new Date();
     past.setHours(0, 0, 0, 0);
     
     if (timeRange === 'week') {
       past.setDate(past.getDate() - 6); // Last 7 days
     } else {
       past.setDate(past.getDate() - 29); // Last 30 days
     }
     
     return entries.filter(e => e.timestamp >= past.getTime() && e.timestamp <= now.getTime());
  }, [entries, timeRange]);

  // 3. Chart Data: Trends (Bar Chart)
  const chartData = useMemo(() => {
    const data = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const days = timeRange === 'week' ? 7 : 30; 
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000;
      
      const dayEntries = entries.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd);
      
      data.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        cost: dayEntries.reduce((acc, e) => acc + (e.cost || 0), 0),
        kcal: dayEntries.reduce((acc, e) => acc + (e.calories || 0), 0)
      });
    }
    return data;
  }, [entries, timeRange]); // Fixed dependency to include timeRange if logic changes to support month view daily bars

  // 4. Pie Data: Spending Category
  const spendingData = useMemo(() => {
    const map = new Map<string, number>();
    filteredEntries.forEach(e => {
       if (e.cost > 0) {
          map.set(e.category, (map.get(e.category) || 0) + e.cost);
       }
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredEntries]);

  // 5. Pie Data: Nutrition Macros
  const macroData = useMemo(() => {
    let p = 0, c = 0, f = 0;
    filteredEntries.forEach(e => {
       p += e.protein || 0;
       c += e.carbs || 0;
       f += e.fat || 0;
    });
    // Filter out zero values to avoid ugly charts
    const result = [];
    if (p > 0) result.push({ name: 'Protein', value: p, colorKey: 'protein' });
    if (c > 0) result.push({ name: 'Carbs', value: c, colorKey: 'carbs' });
    if (f > 0) result.push({ name: 'Fat', value: f, colorKey: 'fat' });
    return result;
  }, [filteredEntries]);

  // 6. Insight Calculations
  const avgProtein = useMemo(() => {
    if (filteredEntries.length === 0) return 0;
    const days = timeRange === 'week' ? 7 : 30;
    const totalProtein = filteredEntries.reduce((sum, e) => sum + (e.protein || 0), 0);
    return Math.round(totalProtein / days);
  }, [filteredEntries, timeRange]);

  const insightText = useMemo(() => {
      if (avgProtein > 0) {
          if (avgProtein < 50) {
              return t.dashboard.insights.proteinLow.replace('{amount}', avgProtein.toString());
          } else {
              return t.dashboard.insights.proteinGood.replace('{amount}', avgProtein.toString());
          }
      }
      return t.dashboard.insights.generalTip;
  }, [avgProtein, t]);

  // Derived display values
  const displayCost = selectedDay ? selectedDay.cost : todayCost;
  const displayCalories = selectedDay ? selectedDay.kcal : todayCalories;
  const showDateIndicator = !!selectedDay;

  return (
    <div className={`flex-1 pb-24 overflow-y-auto no-scrollbar ${isVintage ? 'bg-vintage-bg' : 'bg-gray-50'}`}>
      <header className={`p-6 ${isVintage ? 'border-b-2 border-vintage-line pb-4' : 'bg-white shadow-sm'}`}>
        <div className="flex justify-between items-start">
           <div>
             <h1 className={`text-3xl font-extrabold ${isVintage ? 'text-vintage-ink font-typewriter' : 'text-gray-900'}`}>
               {t.dashboard.title}
             </h1>
             <p className={`${isVintage ? 'text-vintage-leather font-handwriting text-xl' : 'text-gray-400'}`}>
               {t.dashboard.subtitle}
             </p>
           </div>
           
           {/* Reset Selection Button */}
           {showDateIndicator && (
              <button 
                 onClick={() => setSelectedDay(null)}
                 className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isVintage 
                       ? 'border-2 border-vintage-stamp text-vintage-stamp font-typewriter hover:bg-vintage-stamp hover:text-vintage-bg -rotate-2'
                       : 'bg-gray-900 text-white shadow-lg hover:scale-105'
                 }`}
              >
                 <XIcon className="w-3 h-3" />
                 {isVintage ? 'CLEAR VIEW' : 'Reset'}
              </button>
           )}
        </div>
      </header>

      <div className="p-6 space-y-6">
        
        <StatsOverview 
          t={t} 
          theme={theme}
          displayCost={displayCost}
          displayCalories={displayCalories}
          showDateIndicator={showDateIndicator}
          selectedDayName={selectedDay?.name}
        />

        <ChartSection 
          t={t}
          theme={theme}
          reportTab={reportTab}
          setReportTab={setReportTab}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          chartData={chartData}
          spendingData={spendingData}
          macroData={macroData}
          setSelectedDay={setSelectedDay}
        />

        <InsightCard 
          t={t}
          theme={theme}
          insightText={insightText}
        />

        <EntryList 
           entries={entries}
           onSelectEntry={setEditingEntry}
           t={t}
           theme={theme}
        />
      </div>

      {editingEntry && (
        <EditEntryModal 
           entry={editingEntry}
           onClose={() => setEditingEntry(null)}
           onUpdate={updateEntry}
           onDelete={deleteEntry}
           t={t}
           theme={theme}
        />
      )}
    </div>
  );
};

export default Dashboard;
