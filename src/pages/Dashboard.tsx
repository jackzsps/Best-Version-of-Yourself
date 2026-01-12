import React, { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { Entry } from '../types';
import { Icon } from '../components/Icons';

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
  
  // 1. 修改 TimeRange 型別與預設值
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('week');

  const isVintage = theme === 'vintage';

  // Helper to convert Firestore timestamp to JS Date
  const toDate = (ts: { seconds: number, nanoseconds: number }) => new Date(ts.seconds * 1000);

  // 1. 今日統計
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStartSeconds = Math.floor(today.getTime() / 1000);
  const todayEntries = entries.filter(e => e.date && e.date.seconds >= todayStartSeconds);
  const todayCost = todayEntries.reduce((sum, e) => sum + (e.cost || 0), 0);
  const todayCalories = todayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);

  // 2. 過濾資料 (圓餅圖數據來源)
  const filteredEntries = useMemo(() => {
     const past = new Date();
     past.setHours(0, 0, 0, 0);
     
     // 根據區間設定起始時間
     switch (timeRange) {
        case 'today': 
           // 保持是今天 00:00
           break;
        case 'week': 
           past.setDate(past.getDate() - 6); 
           break;
        case 'month': 
           past.setDate(past.getDate() - 29); 
           break;
        case 'quarter': 
           past.setDate(past.getDate() - 89); 
           break;
        case 'year': 
           past.setMonth(0, 1); // 今年的 1月1日
           break;
     }

     const pastStartSeconds = Math.floor(past.getTime() / 1000);
     return entries.filter(e => e.date && e.date.seconds >= pastStartSeconds);
  }, [entries, timeRange]);

  // 3. 圖表數據 (含 Year 的特殊邏輯)
  const chartData = useMemo(() => {
    const dateLocale = language === 'zh-TW' ? 'zh-TW' : 'en-US';

    // === A. 年度檢視 (Year) - 按月聚合 ===
    if (timeRange === 'year') {
        const currentYear = new Date().getFullYear();
        const monthMap = new Map<number, { cost: number; kcal: number }>();

        entries.forEach(e => {
            if (!e.date || !e.date.seconds) return;
            const d = new Date(e.date.seconds * 1000);
            // 只統計今年的數據
            if (d.getFullYear() === currentYear) {
                const m = d.getMonth();
                const current = monthMap.get(m) || { cost: 0, kcal: 0 };
                monthMap.set(m, {
                    cost: current.cost + (e.cost || 0),
                    kcal: current.kcal + (e.calories || 0)
                });
            }
        });

        const data = [];
        // 顯示 1月 到 12月
        for (let m = 0; m < 12; m++) {
            const d = new Date(currentYear, m, 1);
            // 如果不想顯示未來的月份，可以在這裡加判斷 break
            const stats = monthMap.get(m) || { cost: 0, kcal: 0 };
            data.push({
                name: d.toLocaleDateString(dateLocale, { month: 'short' }), // 顯示 "1月", "Jan"
                cost: stats.cost,
                kcal: stats.kcal
            });
        }
        return data;
    }

    // === B. 日檢視 (Today, Week, Month, Quarter) - 按日聚合 ===
    let days = 7;
    if (timeRange === 'today') days = 1;
    else if (timeRange === 'month') days = 30;
    else if (timeRange === 'quarter') days = 90;

    // 初始化 Map
    const statsMap = new Map<string, { cost: number; kcal: number }>();

    entries.forEach(e => {
        if (!e.date || !e.date.seconds) return;
        const dateObj = new Date(e.date.seconds * 1000);
        const key = dateObj.toDateString(); 
        const current = statsMap.get(key) || { cost: 0, kcal: 0 };
        statsMap.set(key, {
            cost: current.cost + (e.cost || 0),
            kcal: current.kcal + (e.calories || 0)
        });
    });

    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const stats = statsMap.get(key) || { cost: 0, kcal: 0 };

      // 決定 X 軸顯示名稱
      let displayName = d.toLocaleDateString(dateLocale, { weekday: 'short' });
      
      // 如果是「本日」，顯示 "本日" (需確認翻譯檔有此key) 或直接顯示日期
      if (timeRange === 'today') {
          displayName = t.dashboard.timeRange?.today || d.toLocaleDateString(dateLocale, { month: 'numeric', day: 'numeric' });
      }
      // 如果是「本季」，顯示日期 (如 10/27) 避免全是 "週X"
      else if (timeRange === 'quarter') {
          displayName = d.toLocaleDateString(dateLocale, { month: 'numeric', day: 'numeric' });
      }

      data.push({
        name: displayName,
        // 如果是季檢視，可以多傳一個 fullDate 供 Tooltip 使用
        fullDate: d.toLocaleDateString(dateLocale), 
        cost: stats.cost,
        kcal: stats.kcal
      });
    }
    return data;
  }, [entries, timeRange, language, t]);

  // ... (SpendingData 與 MacroData 邏輯保持不變，它們依賴 filteredEntries)
  const spendingData = useMemo(() => {
    const map = new Map<string, number>();
    filteredEntries.forEach(e => e.cost > 0 && map.set(e.category, (map.get(e.category) || 0) + e.cost));
    return Array.from(map.entries()).map(([key, value]) => ({ 
      name: t.categories[key as keyof typeof t.categories] || key, 
      value 
    }));
  }, [filteredEntries, t]);

  const macroData = useMemo(() => {
    let p = 0, c = 0, f = 0;
    filteredEntries.forEach(e => { p += e.protein || 0; c += e.carbs || 0; f += e.fat || 0; });
    const res = [];
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
                 <Icon name="x" className="w-3 h-3" /> {t.common.reset}
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