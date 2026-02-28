import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { useNavigate } from 'react-router-dom';
import { RecordMode, AnalysisResult, ExpenseCategory, PaymentMethod, UsageCategory, EntryType } from '@shared/types';
import { analyzeImage } from '../services/geminiService';
import Button from '../components/Button';
import { Icon } from '../components/Icons';
import { Timestamp } from 'firebase/firestore';
import {
  BentoInput,
  BentoBottomSheetSelect,
  BentoTextArea,
  VintageInput,
  VintageBottomSheetSelect,
  VintageTextArea,
  ThemeDateInput,
  getUsagePillStyle
} from '../components/ThemeUI';
import { compressImage } from '../utils/imageUtils';

// --- Helper Functions ---

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;

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
  const { mode, addEntry, t, language, theme, user, isPro } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'upload' | 'analyzing' | 'review'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // --- [新增] Loading 動畫相關狀態 ---
  const [loadingTip, setLoadingTip] = useState(0);

  const fallbackMessages = [
    'Analyzing image content...',
    'Detecting items & receipts...',
    'Reading prices & text...',
    'Calculating cost & macros...',
  ];
  const loadingMessages = t.addEntry?.loadingMessages || fallbackMessages;


  // [修改 1] 新增 galleryInputRef 用於控制相簿上傳
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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

  // Check permission helper for Web
  const checkPermission = (): boolean => {
    if (isPro) return true;

    showToast(t.addEntry.subscriptionExpiredDesc || "Please upgrade to Pro.", "error");
    // Optionally navigate to settings or show a modal
    navigate('/settings');
    return false;
  };

  const performAnalysis = async (base64: string) => {
    setError(null);
    setStep('analyzing');
    try {
      if (!user) throw new Error('User is not signed in.');
      const result = await analyzeImage(base64, language);

      updateStateWithAnalysis(result, activeMode);
      showToast(t.addEntry?.analysisSuccess || 'AI 分析完成！', 'success');

    } catch (err: any) {
      console.error('AddEntry Analysis Fail:', err);
      showToast(t.addEntry.analysisFailed || 'AI 分析失敗，請手動輸入', 'error');
      setError(t.addEntry.analysisFailed);
    } finally {
      setStep('review');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check permission first
    if (!checkPermission()) {
      e.target.value = ''; // Reset input
      return;
    }

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
        console.error('Image processing failed:', err);
        showToast('圖片處理失敗，請重試', 'error');
        setError('圖片處理失敗，請重試');
        setStep('upload');
      }
    }
    // [修改] 重置 input 值，確保重複選擇相同圖片也能觸發
    e.target.value = '';
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'analyzing') {
      setLoadingTip(0);
      interval = setInterval(() => {
        setLoadingTip((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [step]);


  useEffect(() => {
    updateStateWithAnalysis(analysis, activeMode);
  }, [activeMode, analysis, updateStateWithAnalysis]);

  const handleSave = async () => {
    // 防呆：確保至少有 ID 或名稱
    if (!finalName.trim()) {
      showToast('請輸入項目名稱', 'error');
      return;
    }

    try {
      // [FIX START] 日期修正邏輯：統一設定為中午 12:00:00
      const [year, month, day] = entryDate.split('-').map(Number);
      const saveDate = new Date(year, month - 1, day, 12, 0, 0);
      const firestoreTimestamp = Timestamp.fromDate(saveDate);
      // [FIX END]

      await addEntry({
        id: Date.now().toString(), // ID 由此處的 Date.now() 產生，作為第二排序依據
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

      showToast(t.common?.saved || 'Saved successfully!', 'success');

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

      // Optional: Navigate home or stay
      // navigate('/'); 

    } catch (error) {
      console.error('Save failed:', error);
      showToast('雲端同步失敗，已暫存於本機', 'info');

      // Even if cloud sync fails, we have optimistic update, so we can reset UI
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
    }
  };

  // --- RENDER LOGIC ---

  if (step === 'analyzing') {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden ${isVintageTheme ? 'bg-vintage-bg text-vintage-ink' : ''}`}>

        {/* 1. 背景特效：模糊預覽圖 */}
        {imagePreview && (
          <div className='absolute inset-0 opacity-20 blur-sm z-0'>
            <img src={imagePreview} className='w-full h-full object-cover' alt='background' />
          </div>
        )}

        {/* 2. 主要內容卡片 */}
        <div className='z-10 flex flex-col items-center bg-white/90 p-8 rounded-[2rem] shadow-xl backdrop-blur-md max-w-xs w-full transition-all'>

          {/* 圖片掃描動畫區塊 */}
          <div className='relative w-32 h-32 rounded-2xl overflow-hidden mb-6 shadow-inner bg-gray-100 border-4 border-white'>
            {imagePreview ? (
              <img src={imagePreview} className='w-full h-full object-cover' alt='analyzing' />
            ) : (
              <div className='w-full h-full bg-gray-200' />
            )}

            {/* 掃描線動畫 */}
            <div className='absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/50 to-transparent w-full h-1/2 animate-scan' style={{ top: '-50%' }} />
          </div>

          {/* 動態提示文字 */}
          <div className='h-8 flex items-center justify-center mb-2'>
            <h2 className='text-xl font-bold animate-pulse text-gray-800 whitespace-nowrap'>
              {loadingMessages[loadingTip]}
            </h2>
          </div>

          <p className='text-gray-500 text-sm font-medium'>{t.addEntry.analyzingDesc}</p>
        </div>

        {/* 3. 內嵌樣式 (掃描動畫) */}
        <style>{`
          @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(250%); }
          }
          .animate-scan {
            animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>
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
        <div className='p-6'>
          {error && (
            <div className='mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 flex items-center gap-2'>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Review 頂部：有圖顯示圖，沒圖顯示手動輸入標題 */}
          {imagePreview ? (
            <div className='rounded-bento overflow-hidden shadow-bento h-64 relative bg-white mb-6'>
              <img src={imagePreview} alt='Review' className='w-full h-full object-cover' />
              <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6'><h2 className='text-white text-2xl font-bold'>{finalName || t.common.untitled}</h2></div>
            </div>
          ) : (
            <div className={`mb-6 p-4 rounded-xl flex items-center justify-center gap-3 ${isVintageTheme ? 'border-2 border-dashed border-vintage-line bg-vintage-paper/50' : 'bg-white shadow-sm border border-gray-100'}`}>
              <div className={`p-2 rounded-full ${isVintageTheme ? 'bg-vintage-ink text-vintage-bg' : 'bg-brand-100 text-brand-600'}`}>
                <Icon name='pencil' className='w-5 h-5' />
              </div>
              <span className={`font-bold ${isVintageTheme ? 'text-vintage-ink font-typewriter' : 'text-gray-600'}`}>
                {t.addEntry?.manual || '手動輸入'}
              </span>
            </div>
          )}

          <div className={`flex p-1 ${isVintageTheme ? 'border-b border-vintage-line pb-4 mb-2' : 'bg-white rounded-2xl shadow-sm'}`}>
            {ALL_ENTRY_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setRecordType(type)}
                className={`flex-1 py-3 text-xs font-bold transition-all ${recordType === type
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
              <div className='absolute top-0 left-1/2 -translate-x-1/2 -mt-3 w-4 h-4 rounded-full bg-vintage-line shadow-inner'></div>
            )}

            <div>
              <label className={labelClass}>{t.addEntry.date}</label>
              <ThemeDateInput value={entryDate} onChange={e => setEntryDate(e.target.value)} theme={theme} />
            </div>

            <div>
              <label className={labelClass}>{t.addEntry.itemName}</label>
              {isVintageTheme
                ? <VintageInput type='text' value={finalName} onChange={e => setFinalName(e.target.value)} />
                : <BentoInput type='text' value={finalName} onChange={e => setFinalName(e.target.value)} />
              }
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='col-span-2'>
                <label className={labelClass}>{t.addEntry.category}</label>
                {isVintageTheme
                  ? <VintageBottomSheetSelect title={t.addEntry.category} value={category} onChange={val => setCategory(val as ExpenseCategory)} options={ALL_EXPENSE_CATEGORIES.map(c => ({ value: c, label: t.categories[c] }))} />
                  : <BentoBottomSheetSelect title={t.addEntry.category} value={category} onChange={val => setCategory(val as ExpenseCategory)} options={ALL_EXPENSE_CATEGORIES.map(c => ({ value: c, label: t.categories[c] }))} />
                }
              </div>

              {(recordType === 'expense' || recordType === 'combined') && (
                <div className='col-span-2'>
                  <label className={labelClass}>{t.addEntry.usage}</label>
                  <div className='flex gap-2'>
                    {ALL_USAGE_CATEGORIES.map(u => (
                      <button
                        key={u}
                        onClick={() => setUsage(u)}
                        className={`flex-1 py-3 text-sm rounded-xl border transition-all ${isVintageTheme ? 'rounded-none border-2 font-typewriter' : ''
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
                      ? <VintageBottomSheetSelect title={t.addEntry.paymentMethod} value={paymentMethod} onChange={val => setPaymentMethod(val as PaymentMethod)} options={ALL_PAYMENT_METHODS.map(p => ({ value: p, label: t.paymentMethods[p] }))} />
                      : <BentoBottomSheetSelect title={t.addEntry.paymentMethod} value={paymentMethod} onChange={val => setPaymentMethod(val as PaymentMethod)} options={ALL_PAYMENT_METHODS.map(p => ({ value: p, label: t.paymentMethods[p] }))} />
                    }
                  </div>
                  <div>
                    <label className={labelClass}>{t.addEntry.cost}</label>
                    {isVintageTheme
                      ? <VintageInput type='number' value={finalCost} onChange={e => setFinalCost(e.target.value)} placeholder='0.00' />
                      : <div className='relative'><span className='absolute left-4 top-3.5 text-gray-400 font-bold'>$</span><BentoInput type='number' value={finalCost} onChange={e => setFinalCost(e.target.value)} className='!pl-8' placeholder='0.00' /></div>
                    }
                  </div>
                </>
              )}
            </div>

            {(recordType === 'diet' || recordType === 'combined') && (
              <div className={`${isVintageTheme ? 'mt-4 border-t border-vintage-line pt-4 border-dashed' : 'bg-pastel-bg p-4 rounded-2xl shadow-sm border border-gray-100 mt-2'}`}>
                <div className={`flex p-1 mb-4 ${isVintageTheme ? 'border border-vintage-line border-dashed rounded-sm' : 'bg-white/50 rounded-xl border border-white/50'}`}>
                  <button
                    onClick={() => setActiveMode(RecordMode.STRICT)}
                    className={`flex-1 py-1.5 text-xs font-bold transition-all ${activeMode === RecordMode.STRICT
                      ? (isVintageTheme ? 'bg-vintage-ink text-vintage-bg font-typewriter' : 'bg-brand-500 text-white shadow rounded-lg')
                      : (isVintageTheme ? 'text-vintage-ink font-typewriter hover:bg-vintage-line/20' : 'text-gray-400 rounded-lg')
                      }`}
                  >
                    {t.addEntry.modeStrict}
                  </button>
                  <div className={isVintageTheme ? 'w-px bg-vintage-line border-dashed' : 'hidden'}></div>
                  <button
                    onClick={() => setActiveMode(RecordMode.CONSERVATIVE)}
                    className={`flex-1 py-1.5 text-xs font-bold transition-all ${activeMode === RecordMode.CONSERVATIVE
                      ? (isVintageTheme ? 'bg-vintage-leather text-vintage-bg font-typewriter' : 'bg-emerald-500 text-white shadow rounded-lg')
                      : (isVintageTheme ? 'text-vintage-ink font-typewriter hover:bg-vintage-line/20' : 'text-gray-400 rounded-lg')
                      }`}
                  >
                    {t.addEntry.modeConservative}
                  </button>
                </div>

                <div>
                  <label className={labelClass}>{t.addEntry.calories}</label>
                  {isVintageTheme
                    ? <VintageInput type='number' value={finalCalories} onChange={e => setFinalCalories(e.target.value)} placeholder='0' />
                    : <BentoInput type='number' value={finalCalories} onChange={e => setFinalCalories(e.target.value)} placeholder='0' />
                  }
                </div>

                <div className='grid grid-cols-3 gap-3 mt-4'>
                  <div>
                    <label className={labelClass}>{t.addEntry.protein}</label>
                    {isVintageTheme
                      ? <VintageInput type='number' value={finalProtein} onChange={e => setFinalProtein(e.target.value)} className='!text-lg' placeholder='g' />
                      : <BentoInput type='number' value={finalProtein} onChange={e => setFinalProtein(e.target.value)} className='!p-3 !text-sm' placeholder='g' />
                    }
                  </div>
                  <div>
                    <label className={labelClass}>{t.addEntry.carbs}</label>
                    {isVintageTheme
                      ? <VintageInput type='number' value={finalCarbs} onChange={e => setFinalCarbs(e.target.value)} className='!text-lg' placeholder='g' />
                      : <BentoInput type='number' value={finalCarbs} onChange={e => setFinalCarbs(e.target.value)} className='!p-3 !text-sm' placeholder='g' />
                    }
                  </div>
                  <div>
                    <label className={labelClass}>{t.addEntry.fat}</label>
                    {isVintageTheme
                      ? <VintageInput type='number' value={finalFat} onChange={e => setFinalFat(e.target.value)} className='!text-lg' placeholder='g' />
                      : <BentoInput type='number' value={finalFat} onChange={e => setFinalFat(e.target.value)} className='!p-3 !text-sm' placeholder='g' />
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

            {/* Disclaimer for AI Analysis */}
            {imagePreview && (
              <div className='mt-2 text-gray-400 text-xs text-center opacity-75'>
                {t.addEntry.disclaimer}
              </div>
            )}
          </div>

          <div className='mt-8 flex gap-3'>
            <Button fullWidth onClick={() => { setStep('upload'); setImagePreview(null); setEntryMode('camera'); }} className={isVintageTheme ? 'bg-transparent border-2 border-vintage-ink text-vintage-ink font-typewriter hover:bg-vintage-ink hover:text-vintage-bg rounded-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}>{t.common.cancel}</Button>
            <Button fullWidth onClick={handleSave} className={isVintageTheme ? 'bg-vintage-leather text-vintage-card font-typewriter shadow-md hover:bg-vintage-ink border-2 border-vintage-ink rounded-sm' : 'bg-gray-900 text-white shadow-xl hover:bg-black'}>{t.common.save}</Button>
          </div>
        </div>
      </div>
    );
  }

  // Step === 'upload' (極簡模式：大按鈕 + 雙按鈕)
  return (
    <div className={`flex-1 flex flex-col p-6 relative overflow-hidden ${isVintageTheme ? 'bg-vintage-bg' : 'bg-pastel-bg'}`}>
      <div className='flex-1 flex flex-col items-center justify-center z-10'>

        {/* 1. 原本的大型拍照按鈕 (只開相機) */}
        <div className={`relative w-64 h-64 mb-6 group cursor-pointer ${isVintageTheme ? '' : ''}`} onClick={() => fileInputRef.current?.click()}>
          <div className={`absolute inset-0 rounded-full animate-spin-slow opacity-20 ${isVintageTheme ? 'border-4 border-dashed border-vintage-ink' : 'bg-gradient-to-r from-brand-200 to-accent-200 blur-2xl'}`} />
          <div className={`absolute inset-4 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 duration-500 ${isVintageTheme ? 'bg-vintage-card border-4 border-vintage-ink shadow-[4px_4px_0px_rgba(44,36,27,1)]' : 'bg-white shadow-soft'}`}>
            <div className={`text-center ${isVintageTheme ? 'text-vintage-ink' : 'text-gray-900'}`}>
              <Icon name='camera' className='w-16 h-16 mx-auto mb-2 opacity-80' />
              <span className={`font-bold text-lg tracking-wide ${isVintageTheme ? 'font-typewriter' : ''}`}>{t.addEntry.tapToCapture}</span>
            </div>
          </div>
        </div>

        <div className={`text-center max-w-xs mb-8 ${isVintageTheme ? 'font-handwriting text-xl text-vintage-ink/70' : 'text-gray-500'}`}>
          <p>{t.addEntry.subtitle}</p>
        </div>

        {/* 2. [修改] 底部按鈕區：相簿上傳 & 手動輸入 */}
        <div className='flex items-center gap-4'>

          {/* 相簿按鈕 */}
          <button
            onClick={() => galleryInputRef.current?.click()}
            className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${isVintageTheme
              ? 'text-vintage-ink font-typewriter border-b border-vintage-ink border-dashed hover:border-solid'
              : 'text-gray-400 hover:text-brand-600 bg-white/50 hover:bg-white rounded-full px-6 shadow-sm'
              }`}
          >
            {/* Gallery Icon */}
            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-4 h-4'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' />
            </svg>
            {isVintageTheme ? '相簿' : '相簿'}
          </button>

          {/* 手動輸入按鈕 */}
          <button
            onClick={startManualEntry}
            className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${isVintageTheme
              ? 'text-vintage-ink font-typewriter border-b border-vintage-ink border-dashed hover:border-solid'
              : 'text-gray-400 hover:text-brand-600 bg-white/50 hover:bg-white rounded-full px-6 shadow-sm'
              }`}
          >
            {isVintageTheme ? '✎' : <Icon name='pencil' className='w-4 h-4' />}
            {t.addEntry?.manual || '手動輸入'}
          </button>
        </div>

      </div>

      {/* 3. [修改] 兩個 Input，分別負責 相機 與 相簿 */}
      <input type='file' accept='image/*' capture='environment' className='hidden' ref={fileInputRef} onChange={handleFileChange} />
      <input type='file' accept='image/*' className='hidden' ref={galleryInputRef} onChange={handleFileChange} />

      {!isVintageTheme && (
        <>
          <div className='absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-50/50 to-transparent -z-0' />
          <div className='absolute -bottom-20 -right-20 w-80 h-80 bg-accent-100 rounded-full blur-3xl opacity-30 pointer-events-none' />
          <div className='absolute top-20 -left-20 w-60 h-60 bg-brand-100 rounded-full blur-3xl opacity-30 pointer-events-none' />
        </>
      )}
    </div>
  );
};

export default AddEntry;
