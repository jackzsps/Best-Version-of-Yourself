import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { RecordMode, AnalysisResult, ExpenseCategory, PaymentMethod, UsageCategory, EntryType, Theme } from '../types';
import { analyzeImage } from '../services/geminiService';
import Button from '../components/Button';
import { CameraIcon } from '../components/Icons';
import { compressImage } from '../utils/imageCompressor';
import { 
  VintageInput, VintageSelect, VintageTextArea, 
  BentoInput, BentoSelect, BentoTextArea, 
  ThemeDateInput, getUsagePillStyle 
} from '../components/ThemeUI';

// Retry Icon
const RetryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
);

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

const AddEntry = () => {
  const { mode, addEntry, t, language, theme } = useApp();
  
  // Expanded State Machine: 'error' state added
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review' | 'error'>('upload');
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVintageTheme = theme === 'vintage';

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
  const [note, setNote] = useState('');

  const categories: ExpenseCategory[] = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'other'];
  const paymentMethods: PaymentMethod[] = ['cash', 'card', 'mobile'];
  const usageCategories: UsageCategory[] = ['must', 'need', 'want'];
  const entryTypes: EntryType[] = ['expense', 'diet', 'combined'];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setImagePreview(compressed);
        setStep('analyzing');
        performAnalysis(compressed);
      } catch (e) {
        console.error("Compression error, falling back to original", e);
        const reader = new FileReader();
        reader.onloadend = () => {
           const raw = reader.result as string;
           setImagePreview(raw);
           setStep('analyzing');
           performAnalysis(raw);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const performAnalysis = async (base64: string) => {
    try {
      setErrorMsg(null);
      const result = await analyzeImage(base64, language);
      
      setAnalysis(result);
      setFinalName(result.itemName);
      setFinalCost(result.cost?.toString() || '');
      setCategory(result.category || 'food');
      setUsage(result.usage || 'need');
      setRecordType(result.recordType || 'combined');
      setNote(result.reasoning || '');
      
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
      console.error(err);
      setErrorMsg(t.addEntry.analysisFailed);
      setStep('error');
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

  const handleRetry = () => {
    if (imagePreview) {
      setStep('analyzing');
      performAnalysis(imagePreview);
    }
  };

  const handleManualEntry = () => {
    setAnalysis(null);
    setFinalName('');
    setFinalCost('');
    setFinalCalories('');
    // Ensure we keep the imagePreview if available
    setStep('review');
  };

  const handleSave = async () => {
    const now = new Date();
    const [year, month, day] = entryDate.split('-').map(Number);
    const timestamp = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).getTime();

    const costToSave = recordType === 'diet' ? 0 : (parseFloat(finalCost) || 0);
    const caloriesToSave = recordType === 'expense' ? 0 : (parseFloat(finalCalories) || 0);
    const proteinToSave = recordType === 'expense' ? 0 : (parseFloat(finalProtein) || 0);
    const carbsToSave = recordType === 'expense' ? 0 : (parseFloat(finalCarbs) || 0);
    const fatToSave = recordType === 'expense' ? 0 : (parseFloat(finalFat) || 0);

    await addEntry({
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
      note: note
    });
    setStep('upload');
    setImagePreview(null);
    setAnalysis(null);
    setEntryDate(getLocalDateString());
    setFinalProtein('');
    setFinalCarbs('');
    setFinalFat('');
    setNote('');
  };

  // --- RENDER: Analyzing ---
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

  // --- RENDER: Error View (NEW) ---
  if (step === 'error') {
    return (
      <div className={`flex-1 flex flex-col p-6 ${isVintageTheme ? 'bg-vintage-bg' : 'bg-pastel-bg'}`}>
         {/* Preview Image in Error State */}
         <div className="flex-1 flex flex-col items-center justify-center">
            <div className={`relative max-w-[300px] w-full mb-8 ${isVintageTheme ? 'polaroid-frame bg-white' : 'rounded-2xl shadow-lg overflow-hidden'}`}>
               {imagePreview && (
                  <img src={imagePreview} alt="Error" className={`w-full h-64 object-cover ${isVintageTheme ? 'filter sepia-[.3] contrast-125' : 'grayscale'}`} />
               )}
               
               {/* Error Overlay */}
               <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                  {isVintageTheme ? (
                    <div className="border-4 border-vintage-stamp text-vintage-stamp font-typewriter text-2xl font-bold px-4 py-2 -rotate-12 bg-vintage-bg/90 tracking-widest uppercase shadow-lg">
                       AI FAILURE
                    </div>
                  ) : (
                    <div className="bg-white/90 px-6 py-3 rounded-xl shadow-lg flex flex-col items-center">
                       <span className="text-3xl mb-1">⚠️</span>
                       <span className="font-bold text-gray-800">Analysis Failed</span>
                    </div>
                  )}
               </div>
            </div>

            <p className={`text-center mb-8 max-w-xs ${isVintageTheme ? 'font-handwriting text-xl text-vintage-ink' : 'text-gray-500 font-medium'}`}>
               {errorMsg || "Something went wrong with the AI analysis."}
            </p>

            <div className="flex gap-4 w-full max-w-sm">
               <Button 
                  onClick={handleManualEntry} 
                  variant="ghost" 
                  fullWidth
                  className={isVintageTheme ? 'font-typewriter text-vintage-leather border-2 border-vintage-line hover:bg-vintage-line/20' : ''}
               >
                  {t.addEntry.manual}
               </Button>
               <Button 
                  onClick={handleRetry} 
                  variant="primary" 
                  fullWidth
                  className={`flex items-center justify-center gap-2 ${
                     isVintageTheme 
                     ? 'bg-vintage-ink text-vintage-bg font-typewriter shadow-[4px_4px_0px_#8b4513] border-none hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#8b4513]' 
                     : 'shadow-lg shadow-brand-200'
                  }`}
               >
                  <RetryIcon />
                  {t.common.retry || "Retry"}
               </Button>
            </div>
         </div>
      </div>
    );
  }

  // --- RENDER: Review ---
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
                     {[RecordMode.STRICT, RecordMode.CONSERVATIVE].map(m => (
                       <div key={m} onClick={() => setActiveMode(m)} className="cursor-pointer flex items-center gap-2">
                          <div className={`w-4 h-4 border border-vintage-ink flex items-center justify-center ${activeMode === m ? 'bg-vintage-ink' : ''}`}>
                             {activeMode === m && <span className="text-vintage-bg text-xs">✓</span>}
                          </div>
                          <span className={`font-typewriter text-xs ${activeMode === m ? 'font-bold text-vintage-ink' : 'text-vintage-leather'}`}>
                             {m === RecordMode.STRICT ? t.addEntry.modeStrict : t.addEntry.modeConservative}
                          </span>
                       </div>
                     ))}
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
                        } ${getUsagePillStyle(u, usage === u, theme)}`}
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

            <div>
               <label className={`block text-xs font-bold uppercase mb-2 mt-4 ${isVintageTheme ? 'text-vintage-leather' : 'text-gray-400'}`}>{t.addEntry.note}</label>
               {isVintageTheme
                 ? <VintageTextArea value={note} onChange={e => setNote(e.target.value)} rows={3} />
                 : <BentoTextArea value={note} onChange={e => setNote(e.target.value)} rows={3} />
               }
            </div>

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
  }

  // --- RENDER: Upload ---
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
