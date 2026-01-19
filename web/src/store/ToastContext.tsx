import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from '../components/Icons';
import { useApp } from './AppContext'; // 為了獲取當前主題

type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- Global Toast Utility for Non-Component usage ---
type ToastEvent = { message: string, type: ToastType };
let globalToastHandler: ((event: ToastEvent) => void) | null = null;

export const toast = {
  success: (message: string) => globalToastHandler?.({ message, type: 'success' }),
  error: (message: string) => globalToastHandler?.({ message, type: 'error' }),
  info: (message: string) => globalToastHandler?.({ message, type: 'info' }),
};
// ---------------------------------------------------

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toastData, setToastData] = useState<ToastData | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setToastData({
      id: Date.now().toString(),
      message,
      type
    });

    timerRef.current = setTimeout(() => {
      setToastData(null);
    }, 3000); // 3秒後自動消失
  }, []);

  // Register global handler
  useEffect(() => {
    globalToastHandler = ({ message, type }) => showToast(message, type);
    return () => { globalToastHandler = null; };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastData && <ToastComponent toast={toastData} />}
    </ToastContext.Provider>
  );
};

// 獨立的 Toast UI 組件，負責處理樣式
const ToastComponent = ({ toast }: { toast: ToastData }) => {
  const { theme } = useApp();
  const isVintage = theme === 'vintage';

  // 樣式設定
  const baseStyle = "fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 flex items-center gap-3 transition-all duration-300 animate-fade-in-down max-w-[90vw]";
  
  const vintageStyle = `
    bg-vintage-paper border-2 border-vintage-ink text-vintage-ink font-typewriter shadow-[4px_4px_0px_0px_rgba(44,44,44,0.2)]
    ${toast.type === 'error' ? 'border-red-800 text-red-900' : ''}
  `;
  
  const bentoStyle = `
    backdrop-blur-md shadow-2xl rounded-2xl font-semibold
    ${toast.type === 'success' ? 'bg-white/90 text-gray-800 ring-1 ring-emerald-100' : ''}
    ${toast.type === 'error' ? 'bg-rose-50/90 text-rose-600 ring-1 ring-rose-100' : ''}
    ${toast.type === 'info' ? 'bg-white/90 text-gray-800 ring-1 ring-gray-100' : ''}
  `;

  return (
    <div className={`${baseStyle} ${isVintage ? vintageStyle : bentoStyle}`}>
      {toast.type === 'success' && <Icon name="sparkles" className="w-5 h-5" />}
      {toast.type === 'error' && <Icon name="flame" className="w-5 h-5" />}
      {toast.type === 'info' && <Icon name="sparkles" className="w-5 h-5" />}
      <span className="text-sm md:text-base">{toast.message}</span>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
