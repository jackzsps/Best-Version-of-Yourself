import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { Icon } from './components/Icons';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddEntry = lazy(() => import('./pages/AddEntry'));
const Settings = lazy(() => import('./pages/Settings'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

const LoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[50vh] animate-fade-in">
    <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
    <span className="text-gray-400 text-sm font-medium tracking-wide">Loading...</span>
  </div>
);

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
        <Router>
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
               <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/add" element={<AddEntry />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
               </Routes>
            </Suspense>
          </Layout>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
