import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { RecordMode, AnalysisResult, ExpenseCategory, PaymentMethod, UsageCategory, EntryType, Theme } from '../types';
import { analyzeImage } from '../services/geminiService';
import Button from '../components/Button';
import { CameraIcon, ArrowRightIcon, CalendarIcon } from '../components/Icons';
import { useNavigate } from 'react-router-dom';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Component for Progress Tube with Input
const MacroInput = ({ 
  label, 
  value, 
  onChange, 
  max, 
  colorClass, 
  bgClass 
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void, 
  max: number, 
  colorClass: string, 
  bgClass: string 
}) => {
  const numValue = parseFloat(value) || 0;
  const percentage = Math.min((numValue / max) * 100, 100);
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-end text-xs font-semibold text-gray-500">
        <span>{label}</span>
        <div className="flex items-center gap-1">
           <input 
             type="number" 
             value={value} 
             onChange={(e) => onChange(e.target.value)}
             className="w-16 text-right bg-transparent border-b border-gray-300 focus:border-brand-500 outline-none p-0 text-gray-900 font-bold"
             placeholder="0"
           />
           <span>g</span>
        </div>
      </div>
      <div className={`h-3 w-full ${bgClass} rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${colorClass} rounded-full transition-all duration-300 ease-out`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// --- Theme Date Input Component (Duplicated for simplicity in this file scope) ---
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
          className="w-full p-2 pr-10 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-handwriting text-xl focus:outline-none focus:border-vintage-ink transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full cursor-pointer"
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
        className="w-full px-4 py-3 pr-10 rounded-2xl bg-pastel-bg text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all appearance-none min-h-[3rem] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full cursor-pointer"
      />
      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  );
};

const AddEntry = () => {
  const { mode, addEntry, t, language, theme } = useApp();
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVintageTheme = theme === 'vintage';

  // Form State for Review
  const [recordType, setRecordType] = useState<EntryType>('combined');
  const [finalName, setFinalName] = useState('');
  const [finalCost, setFinalCost] = useState('');
  const [finalCalories, setFinalCalories] = useState('');
  
  // Macros State
  const [finalProtein, setFinalProtein] = useState('');
  const [finalCarbs, setFinalCarbs] = useState('');
  const [finalFat, setFinalFat] = useState('');

  const [entryDate, setEntryDate] = useState(getLocalDateString());
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [usage, setUsage] = useState<UsageCategory>('need');
  const [activeMode, setActiveMode] = useState<RecordMode>(mode);

  const categories: ExpenseCategory[] = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'other'];
  const paymentMethods: PaymentMethod[] = ['cash', 'card', 'mobile'];
  const usageCategories: UsageCategory[] = ['must', 'need', 'want'];
  const entryTypes: EntryType[] = ['expense', 'diet', 'combined'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setStep('analyzing');
        performAnalysis(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const performAnalysis = async (base64: string) => {
    try {
      const result = await analyzeImage(base64, language);
      setAnalysis(result);
      setFinalName(result.itemName);
      setFinalCost(result.cost?.toString() || '');
      setCategory(result.category || 'food');
      setUsage(result.usage || 'need');
      setRecordType(result.recordType || 'combined');
      
      const calRange = result.calories;
      if (calRange) {
        setFinalCalories(mode === RecordMode.STRICT ? calRange.max.toString() : calRange.min.toString());
      } else {
        setFinalCalories('');
      }

      if (result.macros) {
        const useMax = mode === RecordMode.STRICT;
        setFinalProtein(useMax ? result.macros.protein.max.toString() : result.macros.protein.min.toString());
        setFinalCarbs(useMax ? result.macros.carbs.max.toString() : result.macros.carbs.min.toString());
        setFinalFat(useMax ? result.macros.fat.max.toString() : result.macros.fat.min.toString());
      } else {
        setFinalProtein('');
        setFinalCarbs('');
        setFinalFat('');
      }

      setStep('review');
    } catch (err) {
      setError(t.addEntry.analysisFailed);
      setStep('review');
    }
  };

  useEffect(() => {
    if (!analysis) return;
    const useMax = activeMode === RecordMode.STRICT;
    if (analysis.calories) setFinalCalories(useMax ? analysis.calories.max.toString() : analysis.calories.min.toString());
    if (analysis.macros) {
      setFinalProtein(useMax ? analysis.macros.protein.max.toString() : analysis.macros.protein.min.toString());
      setFinalCarbs(useMax ? analysis.macros.carbs.max.toString() : analysis.macros.carbs.min.toString());
      setFinalFat(useMax ? analysis.macros.fat.max.toString() : analysis.macros.fat.min.toString());
    }
  }, [activeMode, analysis]);

  const handleSave = () => {
    const now = new Date();
    const [year, month, day] = entryDate.split('-').map(Number);
    const timestamp = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).getTime();

    const costToSave = recordType === 'diet' ? 0 : (parseFloat(finalCost) || 0);
    const caloriesToSave = recordType === 'expense' ? 0 : (parseFloat(finalCalories) || 0);
    const proteinToSave = recordType === 'expense' ? 0 : (parseFloat(finalProtein) || 0);
    const carbsToSave = recordType === 'expense' ? 0 : (parseFloat(finalCarbs) || 0);
    const fatToSave = recordType === 'expense' ? 0 : (parseFloat(finalFat) || 0);

    addEntry({
      id: Date.now().toString(),
      timestamp: timestamp,
      imageUrl: imagePreview || undefined,
      itemName: finalName || 'Unknown Item',
      type: recordType,
      category: category,
      paymentMethod: paymentMethod,
      usage: usage,
      cost: costToSave,
      calories: caloriesToSave,
      protein: proteinToSave,
      carbs: carbsToSave,
      fat: fatToSave,
      modeUsed: activeMode,
      note: analysis?.reasoning
    });
    setStep('upload');
    setImagePreview(null);
    setAnalysis(null);
    setEntryDate(getLocalDateString());
    setFinalProtein('');
    setFinalCarbs('');
    setFinalFat('');
  };

  // Helper for Usage Colors
  const getUsageColorClass = (u: UsageCategory, isSelected: boolean) => {
    if (isVintageTheme) {
      if (!isSelected) return 'text-vintage-leather/50 border-vintage-line';
      switch(u) {
        case 'must': return 'text-vintage-stamp border-vintage-stamp bg-vintage-stamp/10 font-bold';
        case 'need': return 'text-vintage-ink border-vintage-ink bg-vintage-ink/10 font-bold';
        case 'want': return 'text-amber-800 border-amber-800 bg-amber-800/10 font-bold';
        default: return '';
      }
    }
    // Bento Theme
    if (!isSelected) return 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-transparent';
    switch(u) {
      case 'must': return 'bg-rose-100 text-rose-600 border-rose-200 ring-1 ring-rose-200';
      case 'need': return 'bg-emerald-100 text-emerald-600 border-emerald-200 ring-1 ring-emerald-200';
      case 'want': return 'bg-violet-100 text-violet-600 border-violet-200 ring-1 ring-violet-200';
      default: return '';
    }
  };

  const VintageInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
      {...props} 
      className={`w-full p-2 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-handwriting text-xl placeholder-vintage-leather/40 focus:outline-none focus:border-vintage-ink ${props.className || ''}`}
    />
  );

  const VintageSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select 
      {...props} 
      className="w-full p-2 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-typewriter focus:outline-none appearance-none"
    >
      {props.children}
    </select>
  );

  const BentoInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
      {...props} 
      className={`w-full px-4 py-3 rounded-2xl bg-pastel-bg text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all ${props.className || ''}`}
    />
  );
  
  const BentoSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
     <select 
      {...props} 
      className="w-full px-4 py-3 rounded-2xl bg-pastel-bg text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 appearance-none transition-all"
    >
      {props.children}
    </select>
  );

  if (step === 'analyzing') {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center ${isVintageTheme ? 'bg-vintage-bg text-vintage-ink' : 'animate-fade-in'}`}>
        {isVintageTheme ? (
           <>
             <div className="w-24 h-32 border-4 border-white bg-vintage-card shadow-polaroid animate-bounce mb-6 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-vintage-line border-t-vintage-leather animate-spin"></div>
             </div>
             <h2 className="text-2xl font-handwriting mb-2">Developing Photo...</h2>
           </>
        ) : (
           <>
            <div className="w-24 h-24 bg-pastel-blue rounded-full flex items-center justify-center animate-pulse mb-6">
               <div className="w-16 h-16 bg-brand-500 rounded-full animate-bounce"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t.addEntry.analyzingTitle}</h2>
            <p className="text-gray-400 text-sm">{t.addEntry.analyzingDesc}</p>
           </>
        )}
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className={`flex-1 overflow-y-auto pb-24 no-scrollbar ${isVintageTheme ? 'bg-vintage-bg' : 'bg-pastel-bg'}`}>
        
        {isVintageTheme ? (
          <div className="p-8 flex justify-center pb-0">
             <div className="polaroid-frame max-w-[300px] w-full bg-white">
                {imagePreview ? (
                   <img src={imagePreview} className="w-full h-64 object-cover filter contrast-110 sepia-[.15]" />
                ) : (
                   <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-300">No Image</div>
                )}
                <div className="mt-4 font-handwriting text-2xl text-center text-vintage-ink min-h-[32px]">
                   {finalName || 'Untitled'}
                </div>
             </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="rounded-bento overflow-hidden shadow-bento h-72 relative">
               {imagePreview && (
                 <img src={imagePreview} alt="Review" className="w-full h-full object-cover" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                 <h2 className="text-white text-3xl font-bold">{finalName}</h2>
               </div>
            </div>
          </div>
        )}

        <div className={`p-6 space-y-6 ${
          isVintageTheme
            ? 'mt-4'
            : '-mt-2'
        }`}>
          
          {/* Record Type */}
          <div className={`flex p-1 rounded-2xl mb-2 ${
            isVintageTheme ? 'bg-transparent border-b-2 border-vintage-line rounded-none' 
            : 'bg-white shadow-bento'
          }`}>
            {entryTypes.map(type => (
              <button
                key={type}
                onClick={() => setRecordType(type)}
                className={`flex-1 py-3 text-sm font-bold transition-all ${
                  recordType === type 
                    ? (isVintageTheme ? 'text-vintage-ink font-typewriter underline decoration-wavy decoration-vintage-stamp' 
                       : 'bg-gray-900 text-white rounded-xl shadow-lg')
                    : (isVintageTheme ? 'text-vintage-leather/50 font-typewriter' : 'text-gray-400 rounded-xl hover:bg-gray-50')
                }`}
              >
                {t.entryTypes[type]}
              </button>
            ))}
          </div>

          <div className={`space-y-4 ${!isVintageTheme ? 'bg-white p-6 rounded-bento shadow-bento' : ''}`}>
             
            {!isVintageTheme && (recordType === 'diet' || recordType === 'combined') && (
               <div className="bg-pastel-bg p-4 rounded-2xl space-y-3 mb-6">
                  {/* Mode Toggle Switch for Bento Theme */}
                  <div className="flex bg-white p-1 rounded-xl mb-4 shadow-sm">
                      <button 
                        onClick={() => setActiveMode(RecordMode.STRICT)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          activeMode === RecordMode.STRICT
                           ? 'bg-brand-500 text-white shadow'
                           : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {t.addEntry.modeStrict}
                      </button>
                      <button 
                        onClick={() => setActiveMode(RecordMode.CONSERVATIVE)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          activeMode === RecordMode.CONSERVATIVE
                           ? 'bg-emerald-500 text-white shadow'
                           : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                         {t.addEntry.modeConservative}
                      </button>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-bold text-gray-400 uppercase">{t.addEntry.nutrition}</span>
                     <div className="flex items-center">
                        <input 
                          type="number"
                          value={finalCalories}
                          onChange={(e) => setFinalCalories(e.target.value)}
                          className="w-20 text-right bg-transparent border-b-2 border-brand-100 focus:border-brand-500 outline-none text-lg font-bold text-gray-900"
                          placeholder="0"
                        />
                        <span className="text-lg font-bold text-gray-900 ml-1">kcal</span>
                     </div>
                  </div>
                  {/* Macro Progress Bars with Inputs */}
                  <MacroInput label={t.addEntry.protein} value={finalProtein} onChange={setFinalProtein} max={50} colorClass="bg-red-400" bgClass="bg-red-100" />
                  <MacroInput label={t.addEntry.carbs} value={finalCarbs} onChange={setFinalCarbs} max={100} colorClass="bg-yellow-400" bgClass="bg-yellow-100" />
                  <MacroInput label={t.addEntry.fat} value={finalFat} onChange={setFinalFat} max={40} colorClass="bg-blue-400" bgClass="bg-blue-100" />
               </div>
            )}
            
            {isVintageTheme && (recordType === 'diet' || recordType === 'combined') && (
               <div className="mb-4 pb-2 border-b border-vintage-line border-dashed">
                  {/* Mode Toggle for Vintage Theme */}
                  <div className="flex gap-4 mb-3">
                     <div onClick={() => setActiveMode(RecordMode.STRICT)} className="cursor-pointer flex items-center gap-2">
                        <div className={`w-4 h-4 border border-vintage-ink flex items-center justify-center ${activeMode === RecordMode.STRICT ? 'bg-vintage-ink' : ''}`}>
                           {activeMode === RecordMode.STRICT && <span className="text-vintage-bg text-xs">✓</span>}
                        </div>
                        <span className={`font-typewriter text-xs ${activeMode === RecordMode.STRICT ? 'font-bold text-vintage-ink' : 'text-vintage-leather'}`}>
                           {t.addEntry.modeStrict}
                        </span>
                     </div>
                     <div onClick={() => setActiveMode(RecordMode.CONSERVATIVE)} className="cursor-pointer flex items-center gap-2">
                        <div className={`w-4 h-4 border border-vintage-ink flex items-center justify-center ${activeMode === RecordMode.CONSERVATIVE ? 'bg-vintage-ink' : ''}`}>
                           {activeMode === RecordMode.CONSERVATIVE && <span className="text-vintage-bg text-xs">✓</span>}
                        </div>
                        <span className={`font-typewriter text-xs ${activeMode === RecordMode.CONSERVATIVE ? 'font-bold text-vintage-ink' : 'text-vintage-leather'}`}>
                           {t.addEntry.modeConservative}
                        </span>
                     </div>
                  </div>
               </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               {/* Item Name Input if needed, though usually captured */}
               <div className="col-span-2">
                 <label className={`block text-xs font-bold uppercase mb-2 ${isVintageTheme ? 'text-vintage-leather' : 'text-gray-400'}`}>{t.addEntry.itemName}</label>
                 {isVintageTheme 
                   ? <VintageInput value={finalName} onChange={e => setFinalName(e.target.value)} />
                   : <BentoInput value={finalName} onChange={e => setFinalName(e.target.value)} />
                 }
               </div>

                <div className="min-w-0">
                  <label className={`block text-xs font-bold uppercase mb-2 ${
                    isVintageTheme ? 'text-vintage-leather'
                    : 'text-gray-400'
                  }`}>{t.addEntry.date}</label>
                  <ThemeDateInput 
                    value={entryDate} 
                    onChange={e => setEntryDate(e.target.value)} 
                    theme={theme}
                  />
                </div>
                 <div className="min-w-0">
                  <label className={`block text-xs font-bold uppercase mb-2 ${
                    isVintageTheme ? 'text-vintage-leather'
                    : 'text-gray-400'
                  }`}>{t.addEntry.category}</label>
                  {isVintageTheme
                    ? <VintageSelect value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>{categories.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</VintageSelect>
                    : <BentoSelect value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>{categories.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</BentoSelect>
                  }
                </div>
            </div>

            {(recordType === 'expense' || recordType === 'combined') && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="col-span-2">
                  <label className={`block text-xs font-bold uppercase mb-2 ${
                    isVintageTheme ? 'text-vintage-leather'
                    : 'text-gray-400'
                  }`}>{t.addEntry.usage}</label>
                  <div className="flex gap-2">
                    {usageCategories.map(u => (
                      <button
                        key={u}
                        onClick={() => setUsage(u)}
                        className={`flex-1 py-3 text-sm rounded-xl border transition-all ${
                           isVintageTheme ? 'rounded-none border-2 font-typewriter' : ''
                        } ${getUsageColorClass(u, usage === u)}`}
                      >
                        {t.usage[u]}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="col-span-2">
                  <label className={`block text-xs font-bold uppercase mb-2 ${
                    isVintageTheme ? 'text-vintage-leather'
                    : 'text-gray-400'
                  }`}>{t.addEntry.cost}</label>
                  {isVintageTheme
                    ? <VintageInput type="number" value={finalCost} onChange={e => setFinalCost(e.target.value)} />
                    : <BentoInput type="number" value={finalCost} onChange={e => setFinalCost(e.target.value)} placeholder="0.00" />
                  }
                </div>
              </div>
            )}
              
            {isVintageTheme && (recordType === 'diet' || recordType === 'combined') && (
                <div className="mt-6 border-t-2 border-vintage-line border-dashed pt-4">
                  <div className="mb-4">
                     <label className="block text-xs font-bold uppercase mb-2 text-vintage-stamp font-typewriter">{t.addEntry.calories}</label>
                     <div className="relative">
                       <input 
                         type="number" 
                         value={finalCalories} 
                         onChange={e => setFinalCalories(e.target.value)} 
                         className="w-full p-2 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-stamp font-handwriting text-3xl placeholder-vintage-stamp/40 focus:outline-none focus:border-vintage-stamp" 
                         placeholder="0"
                       />
                       <span className="absolute right-0 bottom-3 text-sm text-vintage-stamp/70 font-typewriter">kcal</span>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                     <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-vintage-leather font-typewriter">{t.addEntry.protein}</label>
                        <div className="relative">
                           <input type="number" value={finalProtein} onChange={e => setFinalProtein(e.target.value)} className="w-full p-1 pr-4 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-handwriting text-xl focus:outline-none focus:border-vintage-ink" placeholder="0" />
                           <span className="absolute right-0 bottom-2 text-xs text-vintage-leather font-typewriter">g</span>
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-vintage-leather font-typewriter">{t.addEntry.carbs}</label>
                        <div className="relative">
                           <input type="number" value={finalCarbs} onChange={e => setFinalCarbs(e.target.value)} className="w-full p-1 pr-4 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-handwriting text-xl focus:outline-none focus:border-vintage-ink" placeholder="0" />
                           <span className="absolute right-0 bottom-2 text-xs text-vintage-leather font-typewriter">g</span>
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-vintage-leather font-typewriter">{t.addEntry.fat}</label>
                        <div className="relative">
                           <input type="number" value={finalFat} onChange={e => setFinalFat(e.target.value)} className="w-full p-1 pr-4 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-handwriting text-xl focus:outline-none focus:border-vintage-ink" placeholder="0" />
                           <span className="absolute right-0 bottom-2 text-xs text-vintage-leather font-typewriter">g</span>
                        </div>
                     </div>
                  </div>
                </div>
            )}

            {analysis?.reasoning && (
              <div className={`p-4 rounded-xl text-sm ${
                isVintageTheme ? 'bg-vintage-card text-vintage-ink border border-vintage-line font-typewriter italic'
                : 'bg-pastel-bg text-gray-500 font-medium'
              }`}>
                <p className="font-bold mb-1 text-gray-900">{t.addEntry.aiInsight}</p>
                {analysis.reasoning}
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setStep('upload')} 
              className={`flex-1 ${
                isVintageTheme 
                  ? 'border-2 border-vintage-line text-vintage-leather hover:bg-vintage-line/20 font-typewriter rounded-sm'
                  : 'text-gray-400'
              }`}
            >
              {t.common.cancel}
            </Button>
            <Button 
              fullWidth 
              onClick={handleSave} 
              variant={isVintageTheme ? 'ghost' : 'primary'}
              className={`flex-[2] h-14 ${
                isVintageTheme 
                  ? 'bg-vintage-leather text-vintage-card font-typewriter shadow-lg hover:bg-vintage-ink rounded-sm'
                  : 'bg-gray-900 text-white rounded-2xl shadow-soft hover:bg-black'
              }`}
            >
                {t.addEntry.saveEntry}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Upload Step
  return (
    <div className={`flex-1 flex flex-col p-6 pb-24 ${isVintageTheme ? 'bg-vintage-bg' : 'bg-pastel-bg'}`}>
      <header className="mb-8 mt-4">
        <h1 className={`text-3xl font-extrabold mb-2 ${
          isVintageTheme ? 'text-vintage-ink font-typewriter'
          : 'text-gray-900 tracking-tight'
        }`}>{t.addEntry.title}</h1>
        <p className={`${
          isVintageTheme ? 'text-vintage-leather/70 font-handwriting text-xl'
          : 'text-gray-400 font-medium'
        }`}>{t.addEntry.subtitle}</p>
      </header>

      <div className="flex-1 flex flex-col justify-center items-center gap-8">
        {/* Camera Trigger */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`w-full aspect-square max-w-[280px] flex flex-col items-center justify-center cursor-pointer group transition-all ${
             isVintageTheme
               ? 'border-4 border-white bg-vintage-card shadow-polaroid rotate-2 hover:rotate-0'
               : 'bg-white rounded-[3rem] shadow-soft hover:shadow-xl hover:scale-105 active:scale-95'
          }`}
        >
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-colors ${
            isVintageTheme ? 'bg-vintage-line text-vintage-ink'
            : 'bg-pastel-bg text-gray-900 group-hover:bg-brand-50 group-hover:text-brand-600'
          }`}>
            <CameraIcon className={`w-10 h-10`} />
          </div>
          <span className={`font-bold text-lg ${
            isVintageTheme ? 'text-vintage-ink font-handwriting text-2xl'
            : 'text-gray-900'
          }`}>
             {isVintageTheme ? 'Capture Moment' : t.addEntry.tapToCapture}
          </span>
        </div>
        
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          ref={fileInputRef} 
          onChange={handleFileChange}
          className="hidden" 
        />
        
        <div className="w-full max-w-[280px]">
          <Button variant="ghost" fullWidth onClick={() => setStep('review')} 
             className={`${
               isVintageTheme ? 'border-vintage-leather text-vintage-leather font-typewriter hover:bg-vintage-line/20'
               : 'text-gray-400 hover:text-gray-900'
             }`}>
            {t.addEntry.manual}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddEntry;