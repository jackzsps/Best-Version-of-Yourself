import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { RecordMode, AnalysisResult, ExpenseCategory, PaymentMethod, UsageCategory, EntryType } from '../types';
import { analyzeImage } from '../services/geminiService';
import Button from '../components/Button';
import { Icon } from '../components/Icons'; 
import { Timestamp } from 'firebase/firestore'; 
import { 
  BentoInput, 
  BentoSelect, 
  BentoTextArea,
  VintageInput,
  VintageSelect,
  VintageTextArea,
  ThemeDateInput, 
  getUsagePillStyle 
} from '../components/ThemeUI';
import { compressImage } from '../utils/imageUtils';

// --- Helper Functions ---

const getLocalDateString = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

const ALL_EXPENSE_CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'other'];
const ALL_USAGE_CATEGORIES: UsageCategory[] = ['must', 'need', 'want'];
const ALL_ENTRY_TYPES: EntryType[] = ['expense', 'diet', 'combined'];
const ALL_PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'mobile'];

// --- Type Guards ---
function isValidExpenseCategory(category: any): category is ExpenseCategory {
  return ALL_EXPENSE_CATEGORIES.includes(category);
}
function isValidUsageCategory(usage: any): usage is UsageCategory {
  return ALL_USAGE_CATEGORIES.includes(usage);
}
function isValidRecordType(recordType: any): recordType is EntryType {
  return ALL_ENTRY_TYPES.includes(recordType);
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
  const [note, setNote] = useState('');
  const [activeMode, setActiveMode] = useState<RecordMode>(mode);

  // 模式狀態
  const [entryMode, setEntryMode] = useState<'camera' | 'manual'>('camera');

  const isVintageTheme = theme === 'vintage';
  const labelClass = isVintageTheme
    ? 'block text-xs font-bold uppercase mb-1 text-vintage-leather font-typewriter'
    : 'block text-xs font-bold uppercase mb-2 text-gray-400';

  const updateStateWithAnalysis = useCallback((result: AnalysisResult | null, recordingMode: RecordMode) => {
    if (!result) return;
    setAnalysis(result);
    setFinalName(result.itemName || '');
    setFinalCost(result.cost?.toString() || '');
    setNote(result.reasoning || '');
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

  // --- Actions ---

  const startManualEntry = () => {
    setEntryMode('manual');
    setImagePreview(null);
    setAnalysis(null);
    setFinalName('');
    setFinalCost('');
    setNote('');
    setStep('review');
  };

  const switchToCameraMode = () => {
    setEntryMode('camera');
    setStep('upload');
    setImagePreview(null);
  };

  const performAnalysis = async (base64: string) => {
    setError(null);
    setStep('analyzing');
    try {
      if (!user) throw new Error("User is not signed in.");
      const result = await analyzeImage(base64, language);
      updateStateWithAnalysis(result, activeMode);
    } catch (err: any) {
      console.error("AddEntry Analysis Fail:", err);
      setError(t.addEntry.analysisFailed);
    } finally {
      setStep('review');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setEntryMode('camera');
        setStep('analyzing'); 
        setError(null);
        const compressedBase64 = await compressImage(file, 1280, 0.7);
        setImagePreview(compressedBase64);
        performAnalysis(compressedBase64);
      } catch (err: any) {
        console.error("Image processing failed:", err);
        setError("圖片處理失敗，請重試");
        setStep('upload');
      }
    }
  };
  
  useEffect(() => {
    updateStateWithAnalysis(analysis, activeMode);
  }, [activeMode, analysis, updateStateWithAnalysis]);

  const handleSave = () => {
    const now = new Date();
    const [year, month, day] = entryDate.split('-').map(Number);
    const saveDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
    const firestoreTimestamp = Timestamp.fromDate(saveDate);

    addEntry({
      id: Date.now().toString(),
      date: firestoreTimestamp,
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
      note: note || null 
    });
    
    // Reset state
    setStep('upload');
    setEntryMode('camera');
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
    setNote('');
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
    const containerClass = isVintageTheme 
      ? 'bg-vintage-bg min-h-full'
      : 'bg-pastel-bg min-h-full';
    
    const cardClass = isVintageTheme
      ? 'bg-vintage-card w-full p-6 relative shadow-[5px_5px_0px_rgba(44,36,27,0.2)] border-2 border-vintage-line rounded-sm space-y-6 mt-4'
      : 'bg-white p-6 rounded-bento shadow-bento space-y-4';

    return (
      <div className={`flex-1 overflow-y-auto pb-24 no-scrollbar ${containerClass}`}>
        <div className="p-6">
           {error && (
             <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 flex items-center gap-2">
               <span>⚠️</span> {error}
             </div>
            )}
           
           {/* Review 頂部：有圖顯示圖，沒圖顯示手動輸入標題 */}
           {imagePreview ? (
              <div className="rounded-bento overflow-hidden shadow-bento h-64 relative bg-white mb-6">
                 <img src={imagePreview} alt="Review" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6"><h2 className="text-white text-2xl font-bold">{finalName || t.common.untitled}</h2></div>
              </div>
           ) : (
              <div className={`mb-6 p-4 rounded-xl flex items-center justify-center gap-3 ${isVintageTheme ? 'border-2 border-dashed border-vintage-line bg-vintage-paper/50' : 'bg-white shadow-sm border border-gray-100'}`}>
                  <div className={`p-2 rounded-full ${isVintageTheme ? 'bg-vintage-ink text-vintage-bg' : 'bg-brand-100 text-brand-600'}`}>
                    <Icon name="pencil" className="w-5 h-5" />
                  </div>
                  <span className={`font-bold ${isVintageTheme ? 'text-vintage-ink font-typewriter' : 'text-gray-600'}`}>
                    {t.addEntry?.manual || "手動輸入"}
                  </span>
              </div>
           )}

           <div className={`flex p-1 ${isVintageTheme ? 'border-b border-vintage-line pb-4 mb-2' : 'bg-white rounded-2xl shadow-sm'}`}>
              {ALL_ENTRY_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setRecordType(type)}
                  className={`flex-1 py-3 text-xs font-bold transition-all ${
                    recordType === type
                      ? (isVintageTheme ? 'text-vintage-ink font-typewriter underline decoration-wavy decoration-vintage-stamp' : 'bg-gray-900 text-white rounded-xl shadow-lg')
                      : (isVintageTheme ? 'text-vintage-leather/50 font-typewriter' : 'text-gray-400')
                  }`}
                >
                  {t.entryTypes[type]}
                </button>
              ))}
           </div>

           <div className={cardClass}>
             {isVintageTheme && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3 w-4 h-4 rounded-full bg-vintage-line shadow-inner"></div>
             )}

             <div>
               <label className={labelClass}>{t.addEntry.date}</label>
               <ThemeDateInput value={entryDate} onChange={e => setEntryDate(e.target.value)} theme={theme} />
             </div>

             <div>
               <label className={labelClass}>{t.addEntry.itemName}</label>
               {isVintageTheme
                  ? <VintageInput type="text" value={finalName} onChange={e => setFinalName(e.target.value)} />
                  : <BentoInput type="text" value={finalName} onChange={e => setFinalName(e.target.value)} />
               }
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className={labelClass}>{t.addEntry.category}</label>
                   {isVintageTheme
                     ? <VintageSelect value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>{ALL_EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</VintageSelect>
                     : <BentoSelect value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>{ALL_EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</BentoSelect>
                   }
                </div>

                {(recordType === 'expense' || recordType === 'combined') && (
                  <div className="col-span-2">
                     <label className={labelClass}>{t.addEntry.usage}</label>
                     <div className="flex gap-2">
                      {ALL_USAGE_CATEGORIES.map(u => (
                        <button
                          key={u}
                          onClick={() => setUsage(u)}
                          className={`flex-1 py-3 text-sm rounded-xl border transition-all ${
                             isVintageTheme ? 'rounded-none border-2 font-typewriter' : ''
                          } ${getUsagePillStyle(u, usage === u, theme)}`}
                        >
                          {t.usage[u]}
                        </button>
                      ))}
                     </div>
                  </div>
                )}

                {(recordType === 'expense' || recordType === 'combined') && (
                  <>
                    <div>
                       <label className={labelClass}>{t.addEntry.paymentMethod}</label>
                       {isVintageTheme
                         ? <VintageSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>{ALL_PAYMENT_METHODS.map(p => <option key={p} value={p}>{t.paymentMethods[p]}</option>)}</VintageSelect>
                         : <BentoSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>{ALL_PAYMENT_METHODS.map(p => <option key={p} value={p}>{t.paymentMethods[p]}</option>)}</BentoSelect>
                       }
                    </div>
                    <div>
                      <label className={labelClass}>{t.addEntry.cost}</label>
                      {isVintageTheme
                        ? <VintageInput type="number" value={finalCost} onChange={e => setFinalCost(e.target.value)} placeholder="0.00" />
                        : <div className="relative"><span className="absolute left-4 top-3.5 text-gray-400 font-bold">$</span><BentoInput type="number" value={finalCost} onChange={e => setFinalCost(e.target.value)} className="!pl-8" placeholder="0.00" /></div>
                      }
                    </div>
                  </>
                )}
             </div>

             {(recordType === 'diet' || recordType === 'combined') && (
                <div className={`${isVintageTheme ? 'mt-4 border-t border-vintage-line pt-4 border-dashed' : 'bg-pastel-bg p-4 rounded-2xl shadow-sm border border-gray-100 mt-2'}`}>
                   {!isVintageTheme && (
                     <div className="flex bg-white/50 p-1 rounded-xl mb-4 border border-white/50">
                        <button onClick={() => setActiveMode(RecordMode.STRICT)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${activeMode === RecordMode.STRICT ? 'bg-brand-500 text-white shadow' : 'text-gray-400'}`}>{t.addEntry.modeStrict}</button>
                        <button onClick={() => setActiveMode(RecordMode.CONSERVATIVE)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${activeMode === RecordMode.CONSERVATIVE ? 'bg-emerald-500 text-white shadow' : 'text-gray-400'}`}>{t.addEntry.modeConservative}</button>
                     </div>
                   )}
                   
                   <div>
                      <label className={labelClass}>{t.addEntry.calories}</label>
                      {isVintageTheme
                        ? <VintageInput type="number" value={finalCalories} onChange={e => setFinalCalories(e.target.value)} placeholder="0" />
                        : <BentoInput type="number" value={finalCalories} onChange={e => setFinalCalories(e.target.value)} placeholder="0" />
                      }
                   </div>
                   
                   <div className="grid grid-cols-3 gap-3 mt-4">
                      <div>
                         <label className={labelClass}>{t.addEntry.protein}</label>
                         {isVintageTheme
                           ? <VintageInput type="number" value={finalProtein} onChange={e => setFinalProtein(e.target.value)} className="!text-lg" placeholder="g" />
                           : <BentoInput type="number" value={finalProtein} onChange={e => setFinalProtein(e.target.value)} className="!p-3 !text-sm" placeholder="g" />
                         }
                      </div>
                      <div>
                         <label className={labelClass}>{t.addEntry.carbs}</label>
                         {isVintageTheme
                           ? <VintageInput type="number" value={finalCarbs} onChange={e => setFinalCarbs(e.target.value)} className="!text-lg" placeholder="g" />
                           : <BentoInput type="number" value={finalCarbs} onChange={e => setFinalCarbs(e.target.value)} className="!p-3 !text-sm" placeholder="g" />
                         }
                      </div>
                      <div>
                         <label className={labelClass}>{t.addEntry.fat}</label>
                         {isVintageTheme
                           ? <VintageInput type="number" value={finalFat} onChange={e => setFinalFat(e.target.value)} className="!text-lg" placeholder="g" />
                           : <BentoInput type="number" value={finalFat} onChange={e => setFinalFat(e.target.value)} className="!p-3 !text-sm" placeholder="g" />
                         }
                      </div>
                   </div>
                </div>
             )}
             
             <div>
                <label className={labelClass}>{t.addEntry.note}</label>
                {isVintageTheme
                  ? <VintageTextArea value={note} onChange={e => setNote(e.target.value)} rows={3} />
                  : <BentoTextArea value={note} onChange={e => setNote(e.target.value)} rows={3} />
                }
             </div>
          </div>
          
          <div className="mt-8 flex gap-3">
             <Button fullWidth onClick={() => { setStep('upload'); setImagePreview(null); setEntryMode('camera'); }} className={isVintageTheme ? 'bg-transparent border-2 border-vintage-ink text-vintage-ink font-typewriter hover:bg-vintage-ink hover:text-vintage-bg rounded-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}>{t.common.cancel}</Button>
             <Button fullWidth onClick={handleSave} className={isVintageTheme ? 'bg-vintage-leather text-vintage-card font-typewriter shadow-md hover:bg-vintage-ink border-2 border-vintage-ink rounded-sm' : 'bg-gray-900 text-white shadow-xl hover:bg-black'}>{t.common.save}</Button>
          </div>
        </div>
      </div>
    );
  }

  // Step === 'upload' (極簡模式：大按鈕 + 一行文字)
  return (
    <div className={`flex-1 flex flex-col p-6 relative overflow-hidden ${isVintageTheme ? 'bg-vintage-bg' : 'bg-pastel-bg'}`}>
       <div className="flex-1 flex flex-col items-center justify-center z-10">
          
          {/* 1. 原本的大型拍照按鈕 */}
          <div className={`relative w-64 h-64 mb-6 group cursor-pointer ${isVintageTheme ? '' : ''}`} onClick={() => fileInputRef.current?.click()}>
             <div className={`absolute inset-0 rounded-full animate-spin-slow opacity-20 ${isVintageTheme ? 'border-4 border-dashed border-vintage-ink' : 'bg-gradient-to-r from-brand-200 to-accent-200 blur-2xl'}`} />
             <div className={`absolute inset-4 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 duration-500 ${isVintageTheme ? 'bg-vintage-card border-4 border-vintage-ink shadow-[4px_4px_0px_rgba(44,36,27,1)]' : 'bg-white shadow-soft'}`}>
                <div className={`text-center ${isVintageTheme ? 'text-vintage-ink' : 'text-gray-900'}`}>
                   <Icon name="camera" className="w-16 h-16 mx-auto mb-2 opacity-80" />
                   <span className={`font-bold text-lg tracking-wide ${isVintageTheme ? 'font-typewriter' : ''}`}>{t.addEntry.tapToCapture}</span>
                </div>
             </div>
          </div>
          
          <div className={`text-center max-w-xs mb-8 ${isVintageTheme ? 'font-handwriting text-xl text-vintage-ink/70' : 'text-gray-500'}`}>
             <p>{t.addEntry.subtitle}</p>
          </div>

          {/* 2. 新增的「一行文字」手動輸入連結 */}
          <button 
             onClick={startManualEntry}
             className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
                isVintageTheme 
                ? 'text-vintage-ink font-typewriter border-b border-vintage-ink border-dashed hover:border-solid' 
                : 'text-gray-400 hover:text-brand-600 bg-white/50 hover:bg-white rounded-full px-6 shadow-sm'
             }`}
          >
             {isVintageTheme ? '✎' : <Icon name="pencil" className="w-4 h-4" />}
             {t.addEntry?.manual || "手動輸入紀錄"}
          </button>

       </div>
       <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
       
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