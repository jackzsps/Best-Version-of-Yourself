import React, { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Theme } from '../@shared/types';
import { Icon } from '../Icons';

const COLORS = {
  bento: ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'],
  vintage: ['#8B4513', '#A0522D', '#CD5C5C', '#DAA520', '#2F4F4F', '#556B2F']
};

const MACRO_COLORS = {
  bento: { protein: '#f87171', carbs: '#facc15', fat: '#60a5fa' },
  vintage: { protein: '#CD5C5C', carbs: '#DAA520', fat: '#5F9EA0' }
};

type ReportTab = 'trends' | 'spending' | 'nutrition';
type TimeRange = 'today' |'week' | 'month' | 'quarter' | 'year';

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
  const [trendMetric, setTrendMetric] = useState<'cost' | 'kcal'>('cost');

  return (
    <div className={`rounded-2xl transition-all duration-300 overflow-hidden ${isVintage ? 'vintage-card border-2 border-vintage-line' : 'bg-white shadow-soft'}`}>
       
       {/* Tab Navigation */}
       <div className={`flex items-center p-2 gap-2 overflow-x-auto no-scrollbar ${isVintage ? 'border-b-2 border-vintage-line bg-vintage-line/20' : 'border-b border-gray-100'}`}>
          {(['trends', 'spending', 'nutrition'] as const).map(tab => (
             <button
                key={tab}
                onClick={() => setReportTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold whitespace-nowrap transition-all ${
                   reportTab === tab
                     ? (isVintage 
                         ? 'bg-vintage-card text-vintage-ink border-t-2 border-l-2 border-r-2 border-vintage-ink rounded-t-lg -mb-2.5 z-10 pt-3' 
                         : 'bg-gray-900 text-white rounded-lg shadow-md')
                     : (isVintage 
                         ? 'text-vintage-leather/60 font-typewriter hover:text-vintage-ink' 
                         : 'text-gray-400 hover:bg-gray-50 rounded-lg')
                } ${isVintage ? 'font-typewriter uppercase tracking-widest' : ''}`}
             >
                {tab === 'trends' && <Icon name="barChart" size={14} />}
                {tab === 'spending' && <Icon name="dollar" size={14} />}
                {tab === 'nutrition' && <Icon name="pieChart" size={14} />}
                <span>{t.dashboard.reports[tab === 'trends' ? 'overview' : tab === 'spending' ? 'expense' : 'diet']}</span>
             </button>
          ))}
       </div>

       <div className="p-4 min-h-[300px] flex flex-col">
          {/* Controls Row: Time Range & Metric Toggle */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
            
            {/* Metric Toggle (Only for Trends) */}
            <div className="order-2 sm:order-1 flex-1">
               {reportTab === 'trends' && (
                 <div className={`inline-flex p-1 rounded-lg ${isVintage ? 'border border-vintage-line bg-vintage-bg' : 'bg-gray-100'}`}>
                    <button
                       onClick={() => setTrendMetric('cost')}
                       className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                          trendMetric === 'cost'
                          ? (isVintage ? 'bg-vintage-ink text-vintage-bg' : 'bg-white text-emerald-600 shadow-sm')
                          : 'text-gray-400 hover:text-gray-600'
                       }`}
                    >
                       <Icon name="dollar" size={12} />
                       {t.addEntry.cost.split(' ')[0]} {/* "Cost" */}
                    </button>
                    <button
                       onClick={() => setTrendMetric('kcal')}
                       className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                          trendMetric === 'kcal'
                          ? (isVintage ? 'bg-vintage-ink text-vintage-bg' : 'bg-white text-orange-500 shadow-sm')
                          : 'text-gray-400 hover:text-gray-600'
                       }`}
                    >
                       <Icon name="flame" size={12} />
                       {t.addEntry.calories.split(' ')[0]} {/* "Calories" */}
                    </button>
                 </div>
               )}
               {/* Contextual Info for other tabs */}
               {reportTab === 'spending' && (
                 <div className={`text-xs font-medium ${isVintage ? 'text-vintage-ink' : 'text-gray-500'}`}>
                   {t.dashboard.reports.categoryDist}
                 </div>
               )}
               {reportTab === 'nutrition' && (
                 <div className={`text-xs font-medium ${isVintage ? 'text-vintage-ink' : 'text-gray-500'}`}>
                   {t.dashboard.reports.macroDist}
                 </div>
               )}
            </div>

            {/* Time Range Selector */}
            <div className={`order-1 sm:order-2 flex p-1 rounded-lg w-full sm:w-auto overflow-x-auto ${isVintage ? 'border border-vintage-line' : 'bg-gray-100'}`}>
              {(['today','week', 'month', 'quarter', 'year'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${
                        timeRange === range
                        ? (isVintage ? 'bg-vintage-ink text-vintage-bg' : 'bg-white shadow-sm text-gray-900')
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {t.dashboard.timeRange[range] || range.toUpperCase()}
                  </button>
              ))}
            </div>
          </div>

          {/* Chart Content */}
          <div className="flex-1 relative min-h-[250px]">
             {reportTab === 'trends' && (
                <ResponsiveContainer width="100%" height={250}>
                   <BarChart 
                      data={chartData} 
                      onClick={(data) => data?.activePayload?.[0] && setSelectedDay(data.activePayload[0].payload)}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                   >
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: isVintage ? '#5C4033' : '#9CA3AF', fontSize: 10 }} 
                        dy={10}
                      />
                      <Tooltip 
                        cursor={{ fill: isVintage ? 'rgba(139, 69, 19, 0.1)' : 'rgba(0,0,0,0.05)' }} 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          backgroundColor: isVintage ? '#F4ECD8' : '#fff',
                          fontFamily: isVintage ? 'Courier Prime, monospace' : 'inherit'
                        }}
                        formatter={(value: number) => [
                          trendMetric === 'cost' ? `$${value.toLocaleString()}` : `${value.toLocaleString()} kcal`,
                          trendMetric === 'cost' ? t.addEntry.cost : t.addEntry.calories
                        ]}
                      />
                      <Bar 
                        dataKey={trendMetric} 
                        fill={
                          trendMetric === 'cost' 
                            ? (isVintage ? '#8B4513' : '#10b981') 
                            : (isVintage ? '#CD853F' : '#f59e0b')
                        } 
                        radius={[4, 4, 0, 0]} 
                        barSize={20}
                        animationDuration={1000}
                      />
                   </BarChart>
                </ResponsiveContainer>
             )}

             {reportTab === 'spending' && (
                <div className="h-[250px]">
                   {spendingData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie 
                              data={spendingData} 
                              innerRadius={60} 
                              outerRadius={80} 
                              paddingAngle={5} 
                              dataKey="value"
                              stroke="none"
                            >
                               {spendingData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={isVintage ? COLORS.vintage[index % COLORS.vintage.length] : COLORS.bento[index % COLORS.bento.length]} />
                               ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => [`$${value.toLocaleString()}`, t.addEntry.cost]}
                              contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                backgroundColor: isVintage ? '#F4ECD8' : '#fff',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }} 
                            />
                            <Legend 
                              iconType="circle" 
                              layout="vertical" 
                              verticalAlign="middle" 
                              align="right" 
                              wrapperStyle={{ fontSize: '11px', fontWeight: 500, color: isVintage ? '#5C4033' : '#374151' }} 
                            />
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
                            <Pie 
                              data={macroData} 
                              innerRadius={60} // Changed to donut for consistency
                              outerRadius={80} 
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                               {macroData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={isVintage ? (MACRO_COLORS.vintage as any)[entry.colorKey] : (MACRO_COLORS.bento as any)[entry.colorKey]} />
                               ))}
                            </Pie>
                            <Tooltip 
                               formatter={(value: number) => [`${value.toLocaleString()}g`, t.dashboard.reports.macroDist.split(' ')[0]]}
                               contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                backgroundColor: isVintage ? '#F4ECD8' : '#fff',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }} 
                            />
                            <Legend 
                              iconType="circle" 
                              layout="vertical" 
                              verticalAlign="middle" 
                              align="right" 
                              wrapperStyle={{ fontSize: '11px', fontWeight: 500, color: isVintage ? '#5C4033' : '#374151' }} 
                            />
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