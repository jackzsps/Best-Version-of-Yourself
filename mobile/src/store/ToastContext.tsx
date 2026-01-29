import React, { createContext, useContext, useMemo } from 'react';
import Toast from 'react-native-toast-message';

// 定義 Toast Context 的形狀
interface ToastContextType {
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toastHandlers = useMemo(
    () => ({
      success: (text1: string, text2?: string) => {
        Toast.show({
          type: 'success',
          text1,
          text2,
          position: 'bottom', // 與 Web 版常用的底部提示一致，或根據 UX 調整
          visibilityTime: 3000,
        });
      },
      error: (text1: string, text2?: string) => {
        Toast.show({
          type: 'error',
          text1,
          text2,
          position: 'bottom',
          visibilityTime: 4000,
        });
      },
      info: (text1: string, text2?: string) => {
        Toast.show({
          type: 'info',
          text1,
          text2,
          position: 'bottom',
          visibilityTime: 3000,
        });
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={toastHandlers}>
      {children}
      {/* Toast 組件必須放在最上層，這裡作為 Provider 的一部分方便集成 */}
      <Toast />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
