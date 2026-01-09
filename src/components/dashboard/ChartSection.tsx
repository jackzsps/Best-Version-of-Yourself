import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Theme } from '../../types';

const COLORS = {
  bento: ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'],
  vintage: ['#8B4513', '#A0522D', '#CD5C5C', '#DAA520', '#2F4F4F', '#556B2F']
};

const MACRO_COLORS = {
  bento: { protein: '#f87171', carbs: '#facc15', fat: '#60a5fa' },
  vintage: { protein: '#CD5C5C', carbs: '#DAA520', fat: '#5F9EA0' }
};

type ReportTab = 'trends' | 'spending' | 'nutrition';
type TimeRange = 'week' | 'month';

interface ChartSectionProps {
  t: any;
  theme: Theme;
  reportTab: ReportTab;
  setReportTab: (tab: ReportTab) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  chartData: any[];
  spendingData: any[];
  macroData: any[];
  setSelectedDay: (data: any) => void;
}

const ChartSection: React.FC<ChartSectionProps> = ({
  t,
  theme,
  reportTab,
  setReportTab,
  timeRange,
  setTimeRange,
  chartData,
  spendingData,
  macroData,
  setSelectedDay
}) => {
  const isVintage = theme === 'vintage';

  return (
    <div className={`rounded-2xl transition-all duration-300 overflow-hidden ${isVintage ? 'vintage-card border-2 border-vintage-line' : 'bg-white shadow-soft'}`}>
       
       <div className={`flex items-center p-2 gap-2 overflow-x-auto no-scrollbar ${isVintage ? 'border-b-2 border-vintage-line bg-vintage-line/20' : 'border-b border-gray-100'}`}>
          {(['trends', 'spending', 'nutrition'] as const).map(tab => (
             <button
                key={tab}
                onClick={() => setReportTab(tab)}
                className={`flex-1 py-2 px-3 text-xs font-bold whitespace-nowrap transition-all ${
                   reportTab === tab
                     ? (isVintage 
                         ? 'bg-vintage-card text-vintage-ink border-t-2 border-l-2 border-r-2 border-vintage-ink rounded-t-lg -mb-2.5 z-10 pt-3' 
                         : 'bg-gray-900 text-white rounded-lg shadow-md')
                     : (isVintage 
                         ? 'text-vintage-leather/60 font-typewriter hover:text-vintage-ink' 
                         : 'text-gray-400 hover:bg-gray-50 rounded-lg')
                } ${isVintage ? 'font-typewriter uppercase tracking-widest' : ''}`}
             >
                {t.dashboard.reports[tab === 'trends' ? 'overview' : tab === 'spending' ? 'expense' : 'diet']}
             </button>
          ))}
       </div>

       <div className="p-4 min-h-[300px] flex flex-col">
          <div className="flex justify-end mb-4">
             <div className={`flex p-0.5 rounded-lg ${isVintage ? 'border border-vintage-line' : 'bg-gray-100'}`}>
                <button onClick={() => setTimeRange('week')} className={`px-3 py-1 text-[10px] font-bold rounded-md ${timeRange === 'week' ? (isVintage ? 'bg-vintage-ink text-vintage-bg' : 'bg-white shadow-sm') : 'text-gray-400'}`}>
                   {t.dashboard.timeRange.week}
                </button>
                <button onClick={() => setTimeRange('month')} className={`px-3 py-1 text-[10px] font-bold rounded-md ${timeRange === 'month' ? (isVintage ? 'bg-vintage-ink text-vintage-bg' : 'bg-white shadow-sm') : 'text-gray-400'}`}>
                   {t.dashboard.timeRange.month}
                </button>
             </div>
          </div>

          <div className="flex-1">
             {reportTab === 'trends' && (
                <ResponsiveContainer width="100%" height={250}>
                   <BarChart data={chartData} onClick={(data) => data?.activePayload?.[0] && setSelectedDay(data.activePayload[0].payload)}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isVintage ? '#5C4033' : '#9CA3AF', fontSize: 10 }} />
                      <Tooltip cursor={{ fill: isVintage ? 'rgba(139, 69, 19, 0.1)' : 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isVintage ? '#F4ECD8' : '#fff' }} />
                      <Bar dataKey="cost" fill={isVintage ? '#8B4513' : '#111827'} radius={[4, 4, 0, 0]} barSize={8} />
                      <Bar dataKey="kcal" fill={isVintage ? '#CD853F' : '#E5E7EB'} radius={[4, 4, 0, 0]} barSize={8} />
                   </BarChart>
                </ResponsiveContainer>
             )}

             {reportTab === 'spending' && (
                <div className="h-[250px]">
                   {spendingData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={spendingData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                               {spendingData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={isVintage ? COLORS.vintage[index % COLORS.vintage.length] : COLORS.bento[index % COLORS.bento.length]} />
                               ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isVintage ? '#F4ECD8' : '#fff' }} />
                            <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
                         </PieChart>
                      </ResponsiveContainer>
                   ) : <div className="flex h-full items-center justify-center text-gray-400 text-xs">{t.dashboard.reports.noData}</div>}
                </div>
             )}

             {reportTab === 'nutrition' && (
                <div className="h-[250px]">
                   {macroData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={macroData} innerRadius={0} outerRadius={80} dataKey="value">
                               {macroData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={isVintage ? (MACRO_COLORS.vintage as any)[entry.colorKey] : (MACRO_COLORS.bento as any)[entry.colorKey]} />
                               ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isVintage ? '#F4ECD8' : '#fff' }} />
                            <Legend iconType="square" layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                         </PieChart>
                      </ResponsiveContainer>
                   ) : <div className="flex h-full items-center justify-center text-gray-400 text-xs">{t.dashboard.reports.noData}</div>}
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default ChartSection;