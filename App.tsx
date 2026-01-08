import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import Settings from './pages/Settings';
import { HomeIcon, PlusCircleIcon, SettingsIcon } from './components/Icons';

const Layout = ({ children }: React.PropsWithChildren<{}>) => {
  const { t, theme } = useApp();
  
  const isVintageTheme = theme === 'vintage';

  return (
    <div className={`h-full flex flex-col relative transition-colors duration-300 ${
      isVintageTheme ? 'theme-vintage' : 'bg-pastel-bg'
    }`}>
      {children}
      
      {/* Sticky Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t px-6 py-2 pb-safe flex justify-between items-center z-50 max-w-md mx-auto transition-colors duration-300 ${
        isVintageTheme
          ? 'bg-vintage-leather border-t-2 border-vintage-ink/20 shadow-lg'
          : 'bg-white/80 backdrop-blur-md border-transparent shadow-soft'
      }`}>
        <NavLink 
          to="/" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-colors ${
            isActive 
              ? (isVintageTheme ? 'text-vintage-bg' : 'text-gray-900') 
              : (isVintageTheme ? 'text-vintage-bg/60' : 'text-gray-400 hover:text-gray-600')
          }`}
        >
          <HomeIcon className="w-6 h-6 mb-1" />
          {/* <span className={`text-[10px] font-medium ${isVintageTheme ? 'font-serif' : ''}`}>{t.nav.home}</span> */}
        </NavLink>

        <NavLink 
          to="/add" 
          className={({ isActive }) => `flex flex-col items-center p-2 -mt-8`}
        >
          {({ isActive }) => (
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-soft transition-transform active:scale-95 ${
              isVintageTheme
                ? 'bg-vintage-stamp text-vintage-bg border-2 border-white shadow-xl'
                : 'bg-gray-900 text-white'
            }`}>
              <PlusCircleIcon className="w-8 h-8" />
            </div>
          )}
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-colors ${
            isActive 
               ? (isVintageTheme ? 'text-vintage-bg' : 'text-gray-900') 
               : (isVintageTheme ? 'text-vintage-bg/60' : 'text-gray-400 hover:text-gray-600')
          }`}
        >
          <SettingsIcon className="w-6 h-6 mb-1" />
          {/* <span className={`text-[10px] font-medium ${isVintageTheme ? 'font-serif' : ''}`}>{t.nav.settings}</span> */}
        </NavLink>
      </nav>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddEntry />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
};

export default App;