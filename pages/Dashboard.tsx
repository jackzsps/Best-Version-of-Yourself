import React, { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Entry, ExpenseCategory, PaymentMethod, UsageCategory, EntryType, Theme } from '../types';
import Button from '../components/Button';
import { TrashIcon, XIcon, SparklesIcon, CalendarIcon } from '../components/Icons';

const getLocalDateString = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Colors for Charts ---
const COLORS = {
  bento: ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'],
  vintage: ['#8B4513', '#A0522D', '#CD5C5C', '#DAA520', '#2F4F4F', '#556B2F']
};

const MACRO_COLORS = {
  bento: { protein: '#f87171', carbs: '#facc15', fat: '#60a5fa' },
  vintage: { protein: '#CD5C5C', carbs: '#DAA520', fat: '#5F9EA0' }
};

// --- Styled Components for Consistency (Matching AddEntry.tsx) ---

const VintageInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`w-full p-2 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-handwriting text-2xl placeholder-vintage-leather/40 focus:outline-none focus:border-vintage-ink transition-colors ${props.className || ''}`}
  />
);

const VintageSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select 
    {...props} 
    className="w-full p-2 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-typewriter focus:outline-none appearance-none text-lg"
  >
    {props.children}
  </select>
);

const VintageTextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
   <textarea 
      {...props}
      className="w-full p-2 bg-transparent border-2 border-dashed border-vintage-line font-typewriter text-sm text-vintage-ink focus:outline-none focus:border-vintage-ink rounded-sm resize-none"
   />
);

const BentoInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all border-none ${props.className || ''}`}
  />
);

const BentoSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
   <select 
    {...props} 
    className="w-full px-4 py-3 rounded-2xl bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 appearance-none transition-all border-none"
  >
    {props.children}
  </select>
);

const BentoTextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
     {...props}
     className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-100 font-sans text-gray-900 resize-none font-semibold"
  />
);

// --- Theme Date Input Component ---
const ThemeDateInput = ({ 
  value, 
  onChange, 
  theme 
}: { 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  theme: Theme 
}) => {
  const isVintage = theme === 'vintage';
  
  if (isVintage) {
    return (
      <div className="relative w-full">
        <input 
          type="date"
          value={value}
          onChange={onChange}
          className="w-full p-2 pr-10 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-handwriting text-2xl focus:outline-none focus:border-vintage-ink transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full cursor-pointer"
        />
        <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 text-vintage-leather pointer-events-none" />
      </div>
    );
  }

  // Bento Theme
  return (
    <div className="relative w-full">
      <input 
        type="date"
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 pr-10 rounded-2xl bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all border-none appearance-none min-h-[3rem] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full cursor-pointer"
      />
      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  );
};

// Helper for Usage Colors
const getUsagePillStyle = (u: UsageCategory, isSelected: boolean, theme: Theme) => {
  const isVintage = theme === 'vintage';
  
  if (isVintage) {
     if (!isSelected) return 'text-vintage-leather/50 border-vintage-line';
     switch(u) {
       case 'must': return 'text-vintage-stamp border-vintage-stamp bg-vintage-stamp/10 font-bold';
       case 'need': return 'text-vintage-ink border-vintage-ink bg-vintage-ink/10 font-bold';
       case 'want': return 'text-amber-800 border-amber-800 bg-amber-800/10 font-bold';
       default: return '';
     }
  }
  // Bento
  if (!isSelected) return 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-transparent';
  switch(u) {
     case 'must': return 'bg-rose-100 text-rose-600 border-rose-200 ring-1 ring-rose-200';
     case 'need': return 'bg-emerald-100 text-emerald-600 border-emerald-200 ring-1 ring-emerald-200';
     case 'want': return 'bg-violet-100 text-violet-600 border-violet-200 ring-1 ring-violet-200';
     default: return '';
  }
};

// Helper for Display Badge in List
const getUsageBadgeStyle = (u: UsageCategory, theme: Theme) => {
  const isVintage = theme === 'vintage';
  if (isVintage) {
     switch(u) {
        case 'must': return 'text-vintage-stamp border-vintage-stamp';
        case 'need': return 'text-vintage-ink border-vintage-ink';
        case 'want': return 'text-amber-800 border-amber-800';
        default: return 'text-vintage-leather border-vintage-leather';
     }
  }
  switch(u) {
    case 'must': return 'bg-rose-100 text-rose-600';
    case 'need': return 'bg-emerald-100 text-emerald-600';
    case 'want': return 'bg-violet-100 text-violet-600';
    default: return 'bg-gray-100 text-gray-500';
  }
};

// Modal Component for Editing
const EditEntryModal = ({ 
  entry, 
  onClose, 
  onUpdate, 
  onDelete,
  t,
  theme
}: { 
  entry: Entry, 
  onClose: () => void, 
  onUpdate: (e: Entry) => void, 
  onDelete: (id: string) => void,
  t: any,
  theme: Theme
}) => {
  const [name, setName] = useState(entry.itemName);
  const [cost, setCost] = useState(entry.cost.toString());
  const [calories, setCalories] = useState(entry.calories.toString());
  // Macros
  const [protein, setProtein] = useState(entry.protein ? entry.protein.toString() : '');
  const [carbs, setCarbs] = useState(entry.carbs ? entry.carbs.toString() : '');
  const [fat, setFat] = useState(entry.fat ? entry.fat.toString() : '');
  
  const [note, setNote] = useState(entry.note || '');
  const [dateStr, setDateStr] = useState(getLocalDateString(entry.timestamp));
  const [category, setCategory] = useState<ExpenseCategory>(entry.category || 'food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(entry.paymentMethod || 'cash');
  const [usage, setUsage] = useState<UsageCategory>(entry.usage || 'need');
  const [recordType, setRecordType] = useState<EntryType>(entry.type || 'combined');
  
  // Delete Confirmation State
  const [isDeleting, setIsDeleting] = useState(false);

  const categories: ExpenseCategory[] = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'other'];
  const paymentMethods: PaymentMethod[] = ['cash', 'card', 'mobile'];
  const usageCategories: UsageCategory[] = ['must', 'need', 'want'];
  const entryTypes: EntryType[] = ['expense', 'diet', 'combined'];

  const isVintage = theme === 'vintage';

  const handleSave = () => {
    const originalDate = new Date(entry.timestamp);
    const [year, month, day] = dateStr.split('-').map(Number);
    const newTimestamp = new Date(year, month - 1, day, originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds()).getTime();

    const costToSave = recordType === 'diet' ? 0 : (parseFloat(cost) || 0);
    const caloriesToSave = recordType === 'expense' ? 0 : (parseFloat(calories) || 0);
    const proteinToSave = recordType === 'expense' ? 0 : (parseFloat(protein) || 0);
    const carbsToSave = recordType === 'expense' ? 0 : (parseFloat(carbs) || 0);
    const fatToSave = recordType === 'expense' ? 0 : (parseFloat(fat) || 0);

    onUpdate({
      ...entry,
      itemName: name,
      cost: costToSave,
      calories: caloriesToSave,
      protein: proteinToSave,
      carbs: carbsToSave,
      fat: fatToSave,
      timestamp: newTimestamp,
      category,
      paymentMethod,
      usage,
      type: recordType,
      note: note
    });
    onClose();
  };

  const handleConfirmDelete = () => {
    onDelete(entry.id);
    onClose();
  };

  // Styles
  const containerClass = isVintage
    ? 'bg-vintage-card w-full max-w-sm p-6 relative shadow-[5px_5px_0px_rgba(44,36,27,0.2)] animate-fade-in-up max-h-[90vh] overflow-y-auto border-2 border-vintage-line rounded-sm'
    : 'bg-white rounded-[2rem] w-full max-w-sm p-6 relative shadow-soft animate-fade-in-up max-h-[90vh] overflow-y-auto';

  const labelClass = isVintage
    ? 'block text-xs font-bold uppercase mb-1 text-vintage-leather font-typewriter'
    : 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 font-sans';

  const closeBtnClass = isVintage
    ? 'p-2 text-vintage-leather hover:text-vintage-ink transition-colors'
    : 'p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors text-gray-600';

  // --- Render Custom Delete UI ---
  if (isDeleting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDeleting(false)}></div>
        <div className={`${containerClass} flex flex-col items-center text-center justify-center min-h-[300px]`}>
           
           {isVintage ? (
             <div className="border-4 border-double border-vintage-stamp p-6 -rotate-1 relative bg-vintage-bg">
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-vintage-stamp opacity-50"></div>
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vintage-stamp opacity-50"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-vintage-stamp opacity-50"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-vintage-stamp opacity-50"></div>
                
                <h3 className="text-vintage-stamp font-typewriter text-2xl font-bold uppercase mb-4 tracking-widest border-b-2 border-vintage-stamp pb-2">
                   {t.dashboard.vintageDelete.title}
                </h3>
                <p className="font-handwriting text-xl text-vintage-ink mb-8">
                  {t.dashboard.vintageDelete.message}
                </p>
                <div className="flex gap-4">
                   <button onClick={() => setIsDeleting(false)} className="flex-1 py-2 px-4 border-2 border-vintage-ink font-typewriter text-vintage-ink hover:bg-vintage-ink hover:text-vintage-bg transition-colors">
                     {t.dashboard.vintageDelete.keep}
                   </button>
                   <button onClick={handleConfirmDelete} className="flex-1 py-2 px-4 bg-vintage-stamp text-white font-typewriter shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-2 border-vintage-stamp">
                     {t.dashboard.vintageDelete.destroy}
                   </button>
                </div>
             </div>
           ) : (
             <div className="w-full">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <TrashIcon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboard.confirmDelete}</h3>
                <p className="text-gray-500 mb-8 text-sm">This action cannot be undone.</p>
                <div className="flex flex-col gap-3 w-full">
                   <Button fullWidth onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200">
                     {t.common.delete}
                   </Button>
                   <Button fullWidth variant="ghost" onClick={() => setIsDeleting(false)}>
                     {t.common.cancel}
                   </Button>
                </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  // --- Render Edit Form ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className={containerClass}>
        
        {isVintage && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3 w-4 h-4 rounded-full bg-vintage-line shadow-inner"></div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${isVintage ? 'text-vintage-ink font-typewriter' : 'text-gray-900'}`}>
            {t.dashboard.editEntry}
          </h3>
          <button onClick={onClose} className={closeBtnClass}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
           {/* Record Type Selector */}
           <div className={`flex p-1 ${isVintage ? 'border-b border-vintage-line pb-4 mb-2' : 'bg-gray-100 rounded-xl'}`}>
              {entryTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setRecordType(type)}
                  className={`flex-1 py-2 text-xs font-bold transition-all ${
                    recordType === type
                      ? (isVintage ? 'text-vintage-ink font-typewriter underline decoration-wavy decoration-vintage-stamp' : 'bg-white shadow-sm text-brand-600 rounded-lg')
                      : (isVintage ? 'text-vintage-leather/50 font-typewriter' : 'text-gray-400 hover:text-gray-600')
                  }`}
                >
                  {t.entryTypes[type]}
                </button>
              ))}
           </div>

           <div>
             <label className={labelClass}>{t.addEntry.date}</label>
             <ThemeDateInput 
               value={dateStr} 
               onChange={e => setDateStr(e.target.value)} 
               theme={theme}
             />
           </div>

           <div>
            <label className={labelClass}>{t.addEntry.itemName}</label>
            {isVintage
               ? <VintageInput type="text" value={name} onChange={e => setName(e.target.value)} />
               : <BentoInput type="text" value={name} onChange={e => setName(e.target.value)} />
            }
           </div>
           
           <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                 <label className={labelClass}>{t.addEntry.category}</label>
                 {isVintage
                   ? <VintageSelect value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>{categories.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</VintageSelect>
                   : <BentoSelect value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>{categories.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</BentoSelect>
                 }
              </div>

              {(recordType === 'expense' || recordType === 'combined') && (
                <div className="col-span-2">
                   <label className={labelClass}>{t.addEntry.usage}</label>
                   <div className="flex gap-2">
                    {usageCategories.map(u => (
                      <button
                        key={u}
                        onClick={() => setUsage(u)}
                        className={`flex-1 py-3 text-sm rounded-xl border transition-all ${
                           isVintage ? 'rounded-none border-2 font-typewriter' : ''
                        } ${getUsagePillStyle(u, usage === u, theme)}`}
                      >
                        {t.usage[u]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(recordType === 'expense' || recordType === 'combined') && (
                <div>
                   <label className={labelClass}>{t.addEntry.paymentMethod}</label>
                   {isVintage
                     ? <VintageSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>{paymentMethods.map(p => <option key={p} value={p}>{t.paymentMethods[p]}</option>)}</VintageSelect>
                     : <BentoSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>{paymentMethods.map(p => <option key={p} value={p}>{t.paymentMethods[p]}</option>)}</BentoSelect>
                   }
                </div>
              )}
           
             {/* Financials */}
             {(recordType === 'expense' || recordType === 'combined') && (
                <div>
                  <label className={labelClass}>{t.addEntry.cost}</label>
                  {isVintage
                    ? <VintageInput type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
                    : <BentoInput type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
                  }
                </div>
             )}
           </div>

           {/* Nutrition */}
           {(recordType === 'diet' || recordType === 'combined') && (
             <div className={`space-y-4 ${isVintage ? 'mt-4 border-t border-vintage-line pt-4 border-dashed' : 'bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mt-2'}`}>
                <div>
                  <label className={labelClass}>{t.addEntry.calories}</label>
                  {isVintage
                    ? <VintageInput type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="0" />
                    : <BentoInput type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="0" />
                  }
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                   <div>
                      <label className={labelClass}>{t.addEntry.protein}</label>
                      {isVintage
                        ? <VintageInput type="number" value={protein} onChange={e => setProtein(e.target.value)} className="!text-lg" placeholder="g" />
                        : <BentoInput type="number" value={protein} onChange={e => setProtein(e.target.value)} className="!p-3 !text-sm" placeholder="g" />
                      }
                   </div>
                   <div>
                      <label className={labelClass}>{t.addEntry.carbs}</label>
                      {isVintage
                        ? <VintageInput type="number" value={carbs} onChange={e => setCarbs(e.target.value)} className="!text-lg" placeholder="g" />
                        : <BentoInput type="number" value={carbs} onChange={e => setCarbs(e.target.value)} className="!p-3 !text-sm" placeholder="g" />
                      }
                   </div>
                   <div>
                      <label className={labelClass}>{t.addEntry.fat}</label>
                      {isVintage
                        ? <VintageInput type="number" value={fat} onChange={e => setFat(e.target.value)} className="!text-lg" placeholder="g" />
                        : <BentoInput type="number" value={fat} onChange={e => setFat(e.target.value)} className="!p-3 !text-sm" placeholder="g" />
                      }
                   </div>
                </div>
             </div>
           )}

           {/* Note */}
           <div>
              <label className={labelClass}>{t.addEntry.note}</label>
              {isVintage
                ? <VintageTextArea value={note} onChange={e => setNote(e.target.value)} rows={3} />
                : <BentoTextArea value={note} onChange={e => setNote(e.target.value)} rows={3} />
              }
           </div>
           
           <div className="mt-8 flex gap-3">
             <button 
               onClick={() => setIsDeleting(true)} 
               className={isVintage 
                  ? 'flex items-center justify-center w-12 h-12 border-2 border-vintage-stamp text-vintage-stamp hover:bg-vintage-stamp/10 rounded-sm transition-colors'
                  : 'flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors'
               }
             >
               <TrashIcon className="w-5 h-5" />
             </button>
             <Button 
                fullWidth 
                onClick={handleSave} 
                variant={isVintage ? 'ghost' : 'primary'}
                className={isVintage 
                  ? 'bg-vintage-leather text-vintage-card font-typewriter shadow-md hover:bg-vintage-ink border-2 border-vintage-ink rounded-sm h-12' 
                  : 'rounded-2xl h-14 bg-gray-900 text-white shadow-soft hover:bg-black'
                } 
             >
                {t.common.update}
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

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
  }, [entries]); 

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
    // Calculate unique days in range to avoid dividing by 7 if only 1 day has data? 
    // Usually average over the period is better (e.g. 7 days).
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
        
        {/* Selected Date Indicator for Vintage Theme */}
        {isVintage && showDateIndicator && (
           <div className="flex justify-center -mb-2 animate-fade-in">
              <span className="font-handwriting text-xl text-vintage-stamp bg-vintage-card px-4 py-1 border border-vintage-line rotate-1 shadow-sm">
                 Viewing: {selectedDay?.name}
              </span>
           </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 relative">
          {/* Bento Theme Date Indicator overlay */}
          {!isVintage && showDateIndicator && (
             <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                <span className="bg-brand-100 text-brand-700 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-brand-200">
                   Viewing: {selectedDay?.name}
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

        {/* --- REPORT SECTION --- */}
        <div className={`rounded-2xl transition-all duration-300 overflow-hidden ${isVintage ? 'vintage-card border-2 border-vintage-line' : 'bg-white shadow-soft'}`}>
           
           {/* Report Tabs */}
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
              
              {/* Time Range Toggle */}
              <div className="flex justify-end mb-4">
                 <div className={`flex p-0.5 rounded-lg ${isVintage ? 'border border-vintage-line' : 'bg-gray-100'}`}>
                    <button 
                      onClick={() => setTimeRange('week')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                         timeRange === 'week'
                           ? (isVintage ? 'bg-vintage-ink text-vintage-bg font-typewriter' : 'bg-white text-gray-900 shadow-sm')
                           : (isVintage ? 'text-vintage-leather font-typewriter' : 'text-gray-400')
                      }`}
                    >
                       {t.dashboard.timeRange.week}
                    </button>
                    <button 
                       onClick={() => setTimeRange('month')}
                       className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                          timeRange === 'month'
                            ? (isVintage ? 'bg-vintage-ink text-vintage-bg font-typewriter' : 'bg-white text-gray-900 shadow-sm')
                            : (isVintage ? 'text-vintage-leather font-typewriter' : 'text-gray-400')
                       }`}
                    >
                       {t.dashboard.timeRange.month}
                    </button>
                 </div>
              </div>

              {/* Chart Views */}
              <div className="flex-1">
                 {reportTab === 'trends' && (
                    <ResponsiveContainer width="100%" height={250}>
                       <BarChart 
                          data={chartData}
                          onClick={(data) => {
                             if (data && data.activePayload && data.activePayload.length > 0) {
                                setSelectedDay(data.activePayload[0].payload);
                             }
                          }}
                       >
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: isVintage ? '#5C4033' : '#9CA3AF', fontSize: 12 }} 
                          />
                          <Tooltip 
                            cursor={{ fill: isVintage ? 'rgba(139, 69, 19, 0.1)' : 'rgba(14, 165, 233, 0.1)' }}
                            contentStyle={{ 
                               borderRadius: '12px', 
                               border: 'none', 
                               boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                               backgroundColor: isVintage ? '#F4ECD8' : '#fff'
                            }}
                          />
                          <Bar 
                             dataKey="cost" 
                             fill={isVintage ? '#8B4513' : '#111827'} 
                             radius={[4, 4, 0, 0]} 
                             barSize={8} 
                             cursor="pointer"
                          />
                          <Bar 
                             dataKey="kcal" 
                             fill={isVintage ? '#CD853F' : '#E5E7EB'} 
                             radius={[4, 4, 0, 0]} 
                             barSize={8}
                             cursor="pointer"
                          />
                       </BarChart>
                    </ResponsiveContainer>
                 )}

                 {reportTab === 'spending' && (
                    <div className="h-[250px] relative">
                       {spendingData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie
                                   data={spendingData}
                                   innerRadius={60}
                                   outerRadius={80}
                                   paddingAngle={5}
                                   dataKey="value"
                                >
                                   {spendingData.map((entry, index) => (
                                      <Cell 
                                         key={`cell-${index}`} 
                                         fill={isVintage ? COLORS.vintage[index % COLORS.vintage.length] : COLORS.bento[index % COLORS.bento.length]} 
                                         stroke={isVintage ? '#f9f5eb' : '#fff'}
                                         strokeWidth={2}
                                      />
                                   ))}
                                </Pie>
                                <Tooltip 
                                   contentStyle={{ 
                                      borderRadius: '12px', 
                                      border: 'none', 
                                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                      backgroundColor: isVintage ? '#F4ECD8' : '#fff',
                                      color: isVintage ? '#2c241b' : '#333'
                                   }}
                                   itemStyle={{ color: isVintage ? '#2c241b' : '#333' }}
                                />
                                <Legend 
                                   iconType="circle" 
                                   layout="vertical" 
                                   verticalAlign="middle" 
                                   align="right"
                                   wrapperStyle={{ fontSize: '10px', fontFamily: isVintage ? 'Special Elite' : 'Inter' }}
                                />
                             </PieChart>
                          </ResponsiveContainer>
                       ) : (
                          <div className="flex h-full items-center justify-center text-gray-400 text-xs">
                             {t.dashboard.reports.noData}
                          </div>
                       )}
                    </div>
                 )}

                 {reportTab === 'nutrition' && (
                    <div className="h-[250px] relative">
                       {macroData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie
                                   data={macroData}
                                   innerRadius={0}
                                   outerRadius={80}
                                   dataKey="value"
                                >
                                   {macroData.map((entry, index) => (
                                      <Cell 
                                         key={`cell-${index}`} 
                                         fill={isVintage 
                                            ? MACRO_COLORS.vintage[entry.colorKey as keyof typeof MACRO_COLORS.vintage] 
                                            : MACRO_COLORS.bento[entry.colorKey as keyof typeof MACRO_COLORS.bento]
                                         } 
                                         stroke={isVintage ? '#f9f5eb' : '#fff'}
                                         strokeWidth={2}
                                      />
                                   ))}
                                </Pie>
                                <Tooltip 
                                   contentStyle={{ 
                                      borderRadius: '12px', 
                                      border: 'none', 
                                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                      backgroundColor: isVintage ? '#F4ECD8' : '#fff',
                                      color: isVintage ? '#2c241b' : '#333'
                                   }}
                                />
                                <Legend 
                                   iconType="square" 
                                   layout="vertical" 
                                   verticalAlign="bottom" 
                                   align="center"
                                   wrapperStyle={{ fontSize: '12px', fontFamily: isVintage ? 'Special Elite' : 'Inter', paddingTop: '10px' }}
                                />
                             </PieChart>
                          </ResponsiveContainer>
                       ) : (
                          <div className="flex h-full items-center justify-center text-gray-400 text-xs">
                             {t.dashboard.reports.noData}
                          </div>
                       )}
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Insight Card */}
        {isVintage ? (
            <div className="relative mt-2 mb-2 p-6 bg-white shadow-md transform -rotate-1 border border-vintage-line/50">
               {/* Tape Effect */}
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-yellow-100/80 border border-white/50 rotate-1 shadow-sm opacity-80"></div>
               
               <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 rounded-full border-2 border-vintage-stamp text-vintage-stamp flex items-center justify-center">
                       <SparklesIcon className="w-4 h-4" />
                   </div>
                   <span className="text-vintage-stamp font-typewriter text-sm font-bold uppercase tracking-widest">
                      {t.dashboard.insights.title}
                   </span>
               </div>
               <p className="font-handwriting text-xl text-vintage-ink leading-relaxed pl-2 border-l-2 border-vintage-line/30">
                  {insightText}
               </p>
            </div>
        ) : (
            <div className="mt-2 bg-gradient-to-br from-brand-50 to-white p-5 rounded-2xl border border-brand-100 shadow-sm flex items-start gap-4">
               <div className="p-2 bg-brand-100 text-brand-600 rounded-xl shrink-0">
                  <SparklesIcon className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{t.dashboard.insights.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">{insightText}</p>
               </div>
            </div>
        )}

        {/* Recent List */}
        <div>
           <h3 className={`mb-4 font-bold text-lg ${
             isVintage ? 'text-vintage-ink font-typewriter border-b border-vintage-line inline-block' : 'text-gray-900'
           }`}>
             {t.dashboard.recent}
           </h3>
           
           {entries.length === 0 ? (
             <div className={`text-center py-10 ${isVintage ? 'text-vintage-leather/60 font-handwriting text-xl' : 'text-gray-400'}`}>
                {t.dashboard.noEntries}
                <br/>
                {t.dashboard.tapToStart}
             </div>
           ) : (
             <div className="space-y-3">
                {entries.sort((a,b) => b.timestamp - a.timestamp).map(entry => (
                   <div 
                     key={entry.id}
                     onClick={() => setEditingEntry(entry)}
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
                            <img src={entry.imageUrl} alt="" className="w-full h-full object-cover" />
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
                               {new Date(entry.timestamp).toLocaleDateString()}
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