import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { RecordMode, AnalysisResult, ExpenseCategory, PaymentMethod, UsageCategory, EntryType } from '../types';
import { analyzeImage } from '../services/geminiService';
import Button from '../components/Button';
import { Icon } from '../components/Icons'; // 確保 Icons.tsx 有 export 這個元件，若無請改回 CameraIcon
import { Timestamp } from 'firebase/firestore'; // Import Timestamp from firebase/firestore
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

  }, []);

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
      setError(t.addEntry.analysisFailed);
    } finally {
      setStep('review');
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
    
    const firestoreTimestamp = Timestamp.fromDate(saveDate); // Use Timestamp.fromDate

    addEntry({
      id: Date.now().toString(),
      date: firestoreTimestamp, // 使用 SDK 產生的 Timestamp
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
                   <div><label className="block text-xs font-bold uppercase mb-2 text-gray-400">{t.addEntry.category}</label><BentoSelect value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>{ALL_EXPENSE_CATEGORIES.map(c => (<option key={c} value={c}>{t.categories[c]}</option>))}</BentoSelect></div>
                </div>
                {(recordType === 'expense' || recordType === 'combined') && (
                  <>
                     <div><label className="block text-xs font-bold uppercase mb-2 text-gray-400">{t.addEntry.usage}</label><div className="flex gap-2">{ALL_USAGE_CATEGORIES.map(u => (<button key={u} onClick={() => setUsage(u)} className={`flex-1 py-3 text-sm rounded-xl border transition-all ${getUsagePillStyle(u, usage === u, theme)}`}>{t.usage[u]}</button>))}</div></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold uppercase mb-2 text-gray-400">{t.addEntry.paymentMethod}</label><BentoSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}><option value="cash">{t.paymentMethods.cash}</option><option value="card">{t.paymentMethods.card}</option><option value="mobile">{t.paymentMethods.mobile}</option></BentoSelect></div>
                        <div><label className="block text-xs font-bold uppercase mb-2 text-gray-400">{t.addEntry.cost}</label><div className="relative"><span className="absolute left-4 top-3.5 text-gray-400 font-bold">$</span><BentoInput type="number" value={finalCost} onChange={e => setFinalCost(e.target.value)} className="!pl-8" placeholder="0.00" /></div></div>
                     </div>
                  </>
                )}
             </div>
          </div>
          <div className="flex gap-3">
             <Button fullWidth onClick={() => { setStep('upload'); setImagePreview(null); }} className="bg-gray-100 text-gray-600 hover:bg-gray-200">{t.common.cancel}</Button>
             <Button fullWidth onClick={handleSave} className="bg-gray-900 text-white shadow-xl hover:bg-black">{t.common.save}</Button>
          </div>
        </div>
      </div>
    );
  }

  // Step === 'upload'
  return (
    <div className={`flex-1 flex flex-col p-6 relative overflow-hidden ${isVintageTheme ? 'bg-vintage-bg' : 'bg-pastel-bg'}`}>
       <div className="flex-1 flex flex-col items-center justify-center z-10">
          <div className={`relative w-64 h-64 mb-10 group cursor-pointer ${isVintageTheme ? '' : ''}`} onClick={() => fileInputRef.current?.click()}>
             <div className={`absolute inset-0 rounded-full animate-spin-slow opacity-20 ${isVintageTheme ? 'border-4 border-dashed border-vintage-ink' : 'bg-gradient-to-r from-brand-200 to-accent-200 blur-2xl'}`} />
             <div className={`absolute inset-4 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 duration-500 ${isVintageTheme ? 'bg-vintage-card border-4 border-vintage-ink shadow-[4px_4px_0px_rgba(44,36,27,1)]' : 'bg-white shadow-soft'}`}>
                <div className={`text-center ${isVintageTheme ? 'text-vintage-ink' : 'text-gray-900'}`}>
                   <Icon name="camera" className="w-16 h-16 mx-auto mb-2 opacity-80" />
                   <span className={`font-bold text-lg tracking-wide ${isVintageTheme ? 'font-typewriter' : ''}`}>{t.addEntry.tapToScan}</span>
                </div>
             </div>
          </div>
          <div className={`text-center max-w-xs ${isVintageTheme ? 'font-handwriting text-xl text-vintage-ink/70' : 'text-gray-500'}`}>
             <p>{t.addEntry.uploadDesc}</p>
          </div>
       </div>
       <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
       
       {/* Decorative Background Elements */}
       {!isVintageTheme && (
         <>
           <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-50/50 to-transparent -z-0" />
           <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
           <div className="absolute top-20 -left-20 w-60 h-60 bg-brand-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
         </>
       )}
    </div>
  );
};

export default AddEntry;
