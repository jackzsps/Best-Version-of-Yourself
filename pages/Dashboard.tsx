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
  const { entries, updateEntry, deleteEntry, t, theme, language } = useApp();
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selectedDay, setSelectedDay] = useState<{name: string, cost: number, kcal: number} | null>(null);
  
  const [reportTab, setReportTab] = useState<'trends' | 'spending' | 'nutrition'>('trends');
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const isVintage = theme === 'vintage';

  // 1. 今日統計
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEntries = entries.filter(e => e.timestamp >= today.getTime());
  const todayCost = todayEntries.reduce((sum, e) => sum + (e.cost || 0), 0);
  const todayCalories = todayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);

  // 2. 過濾資料
  const filteredEntries = useMemo(() => {
     const past = new Date();
     past.setHours(0, 0, 0, 0);
     if (timeRange === 'week') past.setDate(past.getDate() - 6);
     else past.setDate(past.getDate() - 29);
     return entries.filter(e => e.timestamp >= past.getTime());
  }, [entries, timeRange]);

  // 3. 圖表數據 - 根據語系調整日期格式
  const chartData = useMemo(() => {
    const data = [];
    const days = timeRange === 'week' ? 7 : 30;
    const dateLocale = language === 'zh-TW' ? 'zh-TW' : 'en-US';
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayEntries = entries.filter(e => e.timestamp >= d.getTime() && e.timestamp < d.getTime() + 86400000);
      data.push({
        // 動態切換日期語系
        name: d.toLocaleDateString(dateLocale, { weekday: 'short' }),
        cost: dayEntries.reduce((acc, e) => acc + (e.cost || 0), 0),
        kcal: dayEntries.reduce((acc, e) => acc + (e.calories || 0), 0)
      });
    }
    return data;
  }, [entries, timeRange, language]);

  const spendingData = useMemo(() => {
    const map = new Map<string, number>();
    filteredEntries.forEach(e => e.cost > 0 && map.set(e.category, (map.get(e.category) || 0) + e.cost));
    // 使用 t.categories 翻譯
    return Array.from(map.entries()).map(([key, value]) => ({ 
      name: t.categories[key as keyof typeof t.categories] || key, 
      value 
    }));
  }, [filteredEntries, t]);

  const macroData = useMemo(() => {
    let p = 0, c = 0, f = 0;
    filteredEntries.forEach(e => { p += e.protein || 0; c += e.carbs || 0; f += e.fat || 0; });
    const res = [];
    // 使用 t.addEntry 中的營養素名稱
    if (p > 0) res.push({ name: t.addEntry.protein, value: p, colorKey: 'protein' });
    if (c > 0) res.push({ name: t.addEntry.carbs, value: c, colorKey: 'carbs' });
    if (f > 0) res.push({ name: t.addEntry.fat, value: f, colorKey: 'fat' });
    return res;
  }, [filteredEntries, t]);

  return (
    <div className={`flex-1 pb-24 overflow-y-auto no-scrollbar ${isVintage ? 'bg-vintage-bg' : 'bg-gray-50'}`}>
      <header className={`p-6 ${isVintage ? 'border-b-2 border-vintage-line pb-4' : 'bg-white shadow-sm'}`}>
        <div className="flex justify-between items-center">
           <div>
             <h1 className={`text-3xl font-extrabold ${isVintage ? 'text-vintage-ink font-typewriter' : 'text-gray-900'}`}>{t.dashboard.title}</h1>
             <p className={`${isVintage ? 'text-vintage-leather font-handwriting text-xl' : 'text-gray-400'}`}>{t.dashboard.subtitle}</p>
           </div>
           {selectedDay && (
              <button onClick={() => setSelectedDay(null)} className="px-3 py-1 bg-gray-900 text-white text-xs rounded-full flex items-center gap-1">
                 <XIcon className="w-3 h-3" /> {t.common.reset}
              </button>
           )}
        </div>
      </header>

      <div className="p-6 space-y-6">
        <StatsOverview t={t} theme={theme} displayCost={selectedDay ? selectedDay.cost : todayCost} displayCalories={selectedDay ? selectedDay.kcal : todayCalories} showDateIndicator={!!selectedDay} selectedDayName={selectedDay?.name} />
        <ChartSection t={t} theme={theme} reportTab={reportTab} setReportTab={setReportTab} timeRange={timeRange} setTimeRange={setTimeRange} chartData={chartData} spendingData={spendingData} macroData={macroData} setSelectedDay={setSelectedDay} />
        <InsightCard t={t} theme={theme} insightText={t.dashboard.insights.generalTip} />
        <EntryList entries={entries} onSelectEntry={setEditingEntry} t={t} theme={theme} />
      </div>

      {editingEntry && (
        <EditEntryModal entry={editingEntry} onClose={() => setEditingEntry(null)} onUpdate={updateEntry} onDelete={deleteEntry} t={t} theme={theme} />
      )}
    </div>
  );
};

export default Dashboard;