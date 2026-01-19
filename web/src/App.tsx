import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { ToastProvider } from './store/ToastContext';
import { Icon } from './components/Icons';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddEntry = lazy(() => import('./pages/AddEntry'));
const Settings = lazy(() => import('./pages/Settings'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

// --- 新增：Skeleton 組件 (取代原本的 LoadingFallback) ---
const SkeletonPage = () => {
  const { theme } = useApp(); // 獲取主題狀態
  const isVintage = theme === 'vintage';

  // 根據主題設定骨架顏色
  const pulseClass = "animate-pulse";
  const bgClass = isVintage ? "bg-vintage-ink/10" : "bg-gray-200";
  const cardBgClass = isVintage ? "bg-vintage-paper border border-vintage-line" : "bg-white/50";

  return (
    <div className="flex-1 p-6 space-y-6 overflow-hidden">
      {/* 模擬頂部標題或統計區塊 */}
      <div className={`w-full h-32 rounded-2xl ${cardBgClass} p-4 space-y-3`}>
        <div className={`h-6 w-1/3 rounded ${bgClass} ${pulseClass}`}></div>
        <div className={`h-12 w-2/3 rounded ${bgClass} ${pulseClass}`}></div>
      </div>

      {/* 模擬列表內容 */}
      <div className="space-y-4">
        {/* 模擬分段標題 */}
        <div className={`h-5 w-1/4 rounded mb-4 ${bgClass} ${pulseClass}`}></div>
        
        {/* 模擬 3 個列表項目 */}
        {[1, 2, 3].map((i) => (
          <div key={i} className={`w-full h-24 rounded-2xl ${cardBgClass} p-4 flex items-center space-x-4`}>
            {/* 圓形圖標佔位 */}
            <div className={`w-12 h-12 rounded-full flex-shrink-0 ${bgClass} ${pulseClass}`}></div>
            {/* 文字條佔位 */}
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-3/4 rounded ${bgClass} ${pulseClass}`}></div>
              <div className={`h-3 w-1/2 rounded ${bgClass} ${pulseClass}`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
// -----------------------------------------------------

const Layout = ({ children }: React.PropsWithChildren<{}>) => {
  const { theme } = useApp();
  const isVintageTheme = theme === 'vintage';

  return (
    <div className={`h-full flex flex-col relative transition-colors duration-300 ${
      isVintageTheme ? 'theme-vintage' : 'bg-pastel-bg'
    }`}>
      {children}
      <nav className={`fixed bottom-0 left-0 right-0 border-t px-6 py-2 pb-safe flex justify-between items-center z-50 max-w-md mx-auto transition-colors duration-300 ${
        isVintageTheme
          ? 'bg-vintage-leather border-t-2 border-vintage-ink/20 shadow-lg'
          : 'bg-white/80 backdrop-blur-md border-transparent shadow-soft'
      }`}>
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-colors ${isActive ? (isVintageTheme ? 'text-vintage-bg' : 'text-gray-900') : (isVintageTheme ? 'text-vintage-bg/60' : 'text-gray-400 hover:text-gray-600')}`}>
          <Icon name="home" className="w-6 h-6 mb-1" />
        </NavLink>
        <NavLink to="/add" className={({ isActive }) => `flex flex-col items-center p-2 -mt-8`}>
          {() => (
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-soft transition-transform active:scale-95 ${isVintageTheme ? 'bg-vintage-stamp text-vintage-bg border-2 border-white shadow-xl' : 'bg-gray-900 text-white'}`}>
              <Icon name="plusCircle" className="w-8 h-8" />
            </div>
          )}
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-colors ${isActive ? (isVintageTheme ? 'text-vintage-bg' : 'text-gray-900') : (isVintageTheme ? 'text-vintage-bg/60' : 'text-gray-400 hover:text-gray-600')}`}>
          <Icon name="settings" className="w-6 h-6 mb-1" />
        </NavLink>
      </nav>
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ToastProvider>
          <Router>
            <Layout>
              {/* 更新這裡：使用 SkeletonPage 替代 LoadingFallback */}
              <Suspense fallback={<SkeletonPage />}>
                 <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/add" element={<AddEntry />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                 </Routes>
              </Suspense>
            </Layout>
          </Router>
        </ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
