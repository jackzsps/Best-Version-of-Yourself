
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { RecordMode, AnalysisResult, ExpenseCategory, PaymentMethod, UsageCategory, EntryType } from '../types';
import { analyzeImage } from '../services/geminiService';
import Button from '../components/Button';
import { Icon } from '../components/Icons';
import { 
  BentoInput, 
  BentoSelect, 
  ThemeDateInput, 
  getUsagePillStyle 
} from '../components/ThemeUI';

// --- Helper Functions ---

const getLocalDateString = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

const ALL_EXPENSE_CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'other'];
const ALL_USAGE_CATEGORIES: UsageCategory[] = ['must', 'need', 'want'];
const ALL_ENTRY_TYPES: EntryType[] = ['expense', 'diet', 'combined'];

// --- Type Guards for Safe State Updates ---

function isValidExpenseCategory(category: any): category is ExpenseCategory {
  return ALL_EXPENSE_CATEGORIES.includes(category);
}

function isValidUsageCategory(usage: any): usage is UsageCategory {
  return ALL_USAGE_CATEGORIES.includes(usage);
}

function isValidRecordType(recordType: any): recordType is EntryType {
  return ALL_ENTRY_TYPES.includes(recordType);
}

// --- UI Components ---

const MacroInput = ({ label, value, onChange, max, colorClass, bgClass }: { label: string, value: string, onChange: (val: string) => void, max: number, colorClass: string, bgClass: string }) => {
  const numValue = parseFloat(value) || 0;
  const percentage = Math.min((numValue / max) * 100, 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-end text-xs font-semibold text-gray-500">
        <span>{label}</span>
        <div className="flex items-center gap-1">
           <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="w-16 text-right bg-transparent border-b border-gray-300 focus:border-brand-500 outline-none p-0 text-gray-900 font-bold" placeholder="0" />
           <span>g</span>
        </div>
      </div>
      <div className={`h-3 w-full ${bgClass} rounded-full overflow-hidden`}><div className={`h-full ${colorClass} rounded-full transition-all duration-300 ease-out`} style={{ width: `${percentage}%` }} /></div>
    </div>
  );
}

// --- Main Component: AddEntry ---

const AddEntry = () => {
  const { mode, addEntry, t, language, theme, user } = useApp();
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [recordType, setRecordType] = useState<EntryType>('combined');
  const [finalName, setFinalName] = useState('');
  const [finalCost, setFinalCost] = useState('');
  const [finalCalories, setFinalCalories] = useState('');
  const [finalProtein, setFinalProtein] = useState('');
  const [finalCarbs, setFinalCarbs] = useState('');
  const [finalFat, setFinalFat] = useState('');
  const [entryDate, setEntryDate] = useState(getLocalDateString());
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [usage, setUsage] = useState<UsageCategory>('need');
  const [activeMode, setActiveMode] = useState<RecordMode>(mode);

  const isVintageTheme = theme === 'vintage';

  /**
   * Safely updates form state from AI analysis result.
   * Uses type guards to prevent invalid data.
   */
  const updateStateWithAnalysis = useCallback((result: AnalysisResult | null, recordingMode: RecordMode) => {
    if (!result) return;

    setAnalysis(result);
    setFinalName(result.itemName || '');
    setFinalCost(result.cost?.toString() || '');
    
    if (isValidExpenseCategory(result.category)) setCategory(result.category);
    if (isValidUsageCategory(result.usage)) setUsage(result.usage);
    if (isValidRecordType(result.recordType)) setRecordType(result.recordType);

    const useMax = recordingMode === RecordMode.STRICT;
    const getVal = (field: { min: number, max: number } | null | undefined) => {
        if (!field) return '0';
        return (useMax ? field.max : field.min)?.toString() || '0';
    };

    setFinalCalories(getVal(result.calories));
    if (result.macros) {
      setFinalProtein(getVal(result.macros.protein));
      setFinalCarbs(getVal(result.macros.carbs));
      setFinalFat(getVal(result.macros.fat));
    }

  }, []); // Dependencies will be added if they use props or state from outside

  const performAnalysis = async (base64: string) => {
    setError(null); // Clear previous errors
    setStep('analyzing');
    try {
      if (!user) {
        throw new Error("User is not signed in.");
      }
      const result = await analyzeImage(base64, language);
      updateStateWithAnalysis(result, activeMode);
    } catch (err: any) {
      console.error("AddEntry Analysis Fail:", err);
      setError(t.addEntry.analysisFailed); // Set user-friendly error message
    } finally {
      setStep('review'); // Always move to review step
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultString = reader.result as string;
        setImagePreview(resultString);
        performAnalysis(resultString);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Effect to re-evaluate values when recording mode changes
  useEffect(() => {
    updateStateWithAnalysis(analysis, activeMode);
  }, [activeMode, analysis, updateStateWithAnalysis]);


  const handleSave = () => {
    const now = new Date();
    const [year, month, day] = entryDate.split('-').map(Number);
    const saveDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
    
    addEntry({
      id: Date.now().toString(),
      date: saveDate,
      imageUrl: imagePreview || null, 
      itemName: finalName || t.common.untitled,
      type: recordType,
      category,
      paymentMethod,
      usage,
      cost: recordType === 'diet' ? 0 : (parseFloat(finalCost) || 0),
      calories: recordType === 'expense' ? 0 : (parseFloat(finalCalories) || 0),
      protein: recordType === 'expense' ? 0 : (parseFloat(finalProtein) || 0),
      carbs: recordType === 'expense' ? 0 : (parseFloat(finalCarbs) || 0),
      fat: recordType === 'expense' ? 0 : (parseFloat(finalFat) || 0),
      modeUsed: activeMode,
      note: analysis?.reasoning || null 
    });
    
    // Reset state after saving
    setStep('upload');
    setImagePreview(null);
    setAnalysis(null);
    setError(null);
    setEntryDate(getLocalDateString());
    setFinalName('');
    setFinalCost('');
    setFinalCalories('');
    setFinalProtein('');
    setFinalCarbs('');
    setFinalFat('');
  };

  // --- RENDER LOGIC ---

  if (step === 'analyzing') {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center ${isVintageTheme ? 'bg-vintage-bg text-vintage-ink' : ''}`}>
        <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center animate-pulse mb-6"><div className="w-16 h-16 bg-brand-500 rounded-full animate-bounce" /></div>
        <h2 className="text-xl font-bold mb-2">{t.addEntry.analyzingTitle}</h2>
        <p className="text-gray-400 text-sm">{t.addEntry.analyzingDesc}</p>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className={`flex-1 overflow-y-auto pb-24 no-scrollbar ${isVintageTheme ? 'bg-vintage-bg' : 'bg-pastel-bg'}`}>
        <div className="p-6">
           {error && (
             <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 flex items-center gap-2">
               <span>⚠️</span> {error}
             </div>
            )}
           <div className="rounded-bento overflow-hidden shadow-bento h-64 relative bg-white">
              {imagePreview && <img src={imagePreview} alt="Review" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6"><h2 className="text-white text-2xl font-bold">{finalName || t.common.untitled}</h2></div>
           </div>
        </div>
        <div className="p-6 space-y-6 -mt-4">
          <div className="flex p-1 rounded-2xl bg-white shadow-sm">{ALL_ENTRY_TYPES.map(type => (<button key={type} onClick={() => setRecordType(type)} className={`flex-1 py-3 text-xs font-bold transition-all ${recordType === type ? 'bg-gray-900 text-white rounded-xl shadow-lg' : 'text-gray-400'}`}>{t.entryTypes[type]}</button>))}</div>
          <div className="bg-white p-6 rounded-bento shadow-bento space-y-4">
             {(recordType === 'diet' || recordType === 'combined') && (
               <div className="bg-pastel-bg p-4 rounded-2xl">
                  <div className="flex bg-white/50 p-1 rounded-xl mb-4 border border-white/50">
                      <button onClick={() => setActiveMode(RecordMode.STRICT)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${activeMode === RecordMode.STRICT ? 'bg-brand-500 text-white shadow' : 'text-gray-400'}`}>{t.addEntry.modeStrict}</button>
                      <button onClick={() => setActiveMode(RecordMode.CONSERVATIVE)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${activeMode === RecordMode.CONSERVATIVE ? 'bg-emerald-500 text-white shadow' : 'text-gray-400'}`}>{t.addEntry.modeConservative}</button>
                  </div>
                  <div className="flex justify-between items-center mb-4"><span className="text-sm font-bold text-gray-400 uppercase">{t.addEntry.nutrition}</span><div className="flex items-center"><input type="number" value={finalCalories} onChange={(e) => setFinalCalories(e.target.value)} className="w-20 text-right bg-transparent border-b-2 border-brand-100 focus:border-brand-500 outline-none text-lg font-bold text-gray-900" placeholder="0" /><span className="text-lg font-bold text-gray-900 ml-1">kcal</span></div></div>
                  <div className="space-y-3">
                    <MacroInput label={t.addEntry.protein} value={finalProtein} onChange={setFinalProtein} max={50} colorClass="bg-red-400" bgClass="bg-red-100" />
                    <MacroInput label={t.addEntry.carbs} value={finalCarbs} onChange={setFinalCarbs} max={100} colorClass="bg-yellow-400" bgClass="bg-yellow-100" />
                    <MacroInput label={t.addEntry.fat} value={finalFat} onChange={setFinalFat} max={40} colorClass="bg-blue-400" bgClass="bg-blue-100" />
                  </div>
               </div>
             )}
             <div className="space-y-4 pt-2">
                <div><label className="block text-xs font-bold uppercase mb-2 text-gray-400">{t.addEntry.itemName}</label><BentoInput value={finalName} onChange={e => setFinalName(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                   <div><label className="block text-xs font-bold uppercase mb-2 text-gray-400">{t.addEntry.date}</label><ThemeDateInput value={entryDate} onChange={e => setEntryDate(e.target.value)} theme={theme} /></div>
                   <div><label className="block text-xs font-bold uppercase mb-2 text-gray-400">{t.addEntry.category}</label><BentoSelect value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>{ALL_EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</BentoSelect></div>
                </div>
                {(recordType === 'expense' || recordType === 'combined') && (
                   <div className="space-y-4">
                      <div><label className="block text-xs font-bold uppercase mb-2 text-gray-400">{t.addEntry.usage}</label><div className="flex gap-2">{ALL_USAGE_CATEGORIES.map(u => (<button key={u} onClick={() => setUsage(u)} className={`flex-1 py-3 text-xs rounded-xl border transition-all ${getUsagePillStyle(u, usage === u, theme)}`}>{t.usage[u]}</button>))}</div></div>
                      <div><label className="block text-xs font-bold uppercase mb-2 text-gray-400">{t.addEntry.cost}</label><BentoInput type="number" value={finalCost} onChange={e => setFinalCost(e.target.value)} placeholder="0.00" /></div>
                   </div>
                )}
             </div>
             {analysis?.reasoning && <div className="p-4 rounded-xl text-sm bg-gray-50 text-gray-500 font-medium italic"><p className="font-bold mb-1 text-gray-900 not-italic">{t.addEntry.aiInsight}</p>{analysis.reasoning}</div>}
          </div>
          <div className="pt-4 flex gap-3"><Button variant="ghost" onClick={() => { setStep('upload'); setError(null); }} className="flex-1 text-gray-400">{t.common.cancel}</Button><Button fullWidth onClick={handleSave} className="flex-[2] h-14 bg-gray-900 text-white rounded-2xl shadow-lg">{t.addEntry.saveEntry}</Button></div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex-1 flex flex-col p-6 pb-24 ${isVintageTheme ? 'bg-vintage-bg' : 'bg-pastel-bg'}`}>
      <header className="mb-8 mt-4"><h1 className={`text-3xl font-extrabold mb-2 ${isVintageTheme ? 'text-vintage-ink font-typewriter' : 'text-gray-900 tracking-tight'}`}>{t.addEntry.title}</h1><p className="text-gray-400 font-medium">{t.addEntry.subtitle}</p></header>
      <div className="flex-1 flex flex-col justify-center items-center gap-8">
        <div onClick={() => fileInputRef.current?.click()} className={`w-full aspect-square max-w-[280px] flex flex-col items-center justify-center cursor-pointer group transition-all bg-white rounded-[3rem] shadow-soft hover:scale-105 active:scale-95`}><div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-pastel-bg text-gray-900 group-hover:bg-brand-50 group-hover:text-brand-600"><Icon name="camera" className="w-10 h-10" /></div><span className="font-bold text-lg text-gray-900">{t.addEntry.tapToCapture}</span></div>
        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <div className="w-full max-w-[280px]"><Button variant="ghost" fullWidth onClick={() => setStep('review')} className="text-gray-400 hover:text-gray-900">{t.addEntry.manual}</Button></div>
      </div>
    </div>
  );
};

export default AddEntry;
