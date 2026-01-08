import React from 'react';
import { useApp } from '../store/AppContext';
import { RecordMode } from '../types';

const Settings = () => {
  const { mode, setMode, language, setLanguage, theme, setTheme, t } = useApp();

  const isVintageTheme = theme === 'vintage';
  
  // Update: Added 'overflow-y-auto' and 'h-full' to enable scrolling
  const containerClass = isVintageTheme ? 'bg-vintage-bg text-vintage-ink overflow-y-auto h-full' 
    : 'bg-gray-50 overflow-y-auto h-full';
  
  const headerClass = isVintageTheme ? 'bg-vintage-bg/90 p-6 border-b-2 border-vintage-line pt-8 sticky top-0 z-10'
    : 'bg-white p-6 shadow-sm sticky top-0 z-10';
    
  const titleClass = isVintageTheme ? 'text-vintage-ink font-typewriter text-2xl font-bold'
    : 'text-2xl font-bold text-gray-900';
    
  const cardClass = isVintageTheme ? 'vintage-card p-6 rounded-sm'
    : 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100';
    
  const textHeadClass = isVintageTheme ? 'text-vintage-ink font-typewriter text-lg font-bold mb-4 border-b border-vintage-line pb-1 inline-block'
    : 'text-lg font-semibold text-gray-900 mb-4';
    
  const textBodyClass = isVintageTheme ? 'text-vintage-leather/80 font-handwriting text-lg mb-6'
    : 'text-gray-500 text-sm mb-6';

  return (
    <div className={`flex-1 ${containerClass} pb-24 no-scrollbar`}>
      <header className={headerClass}>
        <h1 className={titleClass}>{t.settings.title}</h1>
      </header>

      <div className="p-6 space-y-6">
        
        {/* Theme Settings */}
        <div className={cardClass}>
           <h2 className={textHeadClass}>{t.settings.theme}</h2>
           <p className={textBodyClass}>{t.settings.themeDesc}</p>
           
           <div className={`flex flex-col gap-2 p-1 rounded-xl ${isVintageTheme ? '' : 'bg-gray-100'}`}>
              <div className="flex w-full">
                <button 
                  onClick={() => setTheme('default')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    theme === 'default' 
                    ? 'bg-white shadow text-brand-600' 
                    : isVintageTheme ? 'bg-transparent text-vintage-leather/50 hover:text-vintage-ink font-typewriter' : 'text-gray-500'
                  }`}
                >
                  {t.settings.themeDefault}
                </button>
                <button 
                  onClick={() => setTheme('vintage')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    theme === 'vintage' 
                    ? 'bg-vintage-leather text-vintage-card shadow-md font-typewriter border-2 border-vintage-ink' 
                    : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t.settings.themeVintage}
                </button>
              </div>
           </div>
        </div>

        {/* Language Settings */}
        <div className={cardClass}>
          <h2 className={textHeadClass}>{t.settings.language}</h2>
          <p className={textBodyClass}>
            {t.settings.languageDesc}
          </p>
          
          <div className={`flex p-1 rounded-xl ${
            isVintageTheme ? 'border-b-2 border-vintage-line'
            : 'bg-gray-100'
          }`}>
            <button 
              onClick={() => setLanguage('zh-TW')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                language === 'zh-TW' 
                ? (isVintageTheme ? 'text-vintage-ink font-bold font-typewriter underline' : 'bg-white shadow text-brand-600') 
                : (isVintageTheme ? 'text-vintage-leather/50 font-typewriter' : 'text-gray-500')
              }`}
            >
              繁體中文
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                language === 'en' 
                ? (isVintageTheme ? 'text-vintage-ink font-bold font-typewriter underline' : 'bg-white shadow text-brand-600') 
                : (isVintageTheme ? 'text-vintage-leather/50 font-typewriter' : 'text-gray-500')
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Record Mode Settings */}
        <div className={cardClass}>
          <h2 className={textHeadClass}>{t.settings.standard}</h2>
          <p className={textBodyClass}>
            {t.settings.standardDesc}
          </p>

          <div className="space-y-4">
            <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
              mode === RecordMode.STRICT 
                ? (isVintageTheme ? 'border-vintage-ink bg-vintage-line/30' : 'border-brand-500 bg-brand-50 ring-1 ring-brand-500') 
                : (isVintageTheme ? 'border-vintage-line hover:bg-vintage-card' : 'border-gray-200 hover:bg-gray-50')
            }`}>
              <input 
                type="radio" 
                name="mode" 
                className={`mt-1 w-4 h-4 focus:ring-2 ${
                  isVintageTheme ? 'text-vintage-leather focus:ring-vintage-leather bg-vintage-bg border-vintage-ink'
                  : 'text-brand-600 focus:ring-brand-500'
                }`}
                checked={mode === RecordMode.STRICT}
                onChange={() => setMode(RecordMode.STRICT)}
              />
              <div className="ml-3">
                <span className={`block text-sm font-medium ${
                  isVintageTheme ? 'text-vintage-ink font-typewriter'
                  : 'text-gray-900'
                }`}>{t.settings.strict}</span>
                <span className={`block text-sm mt-1 ${
                  isVintageTheme ? 'text-vintage-leather/70 font-handwriting text-lg'
                  : 'text-gray-500'
                }`}>
                  {t.settings.strictDesc}
                </span>
              </div>
            </label>

            <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
              mode === RecordMode.CONSERVATIVE 
                 ? (isVintageTheme ? 'border-vintage-ink bg-vintage-line/30' : 'border-brand-500 bg-brand-50 ring-1 ring-brand-500') 
                 : (isVintageTheme ? 'border-vintage-line hover:bg-vintage-card' : 'border-gray-200 hover:bg-gray-50')
            }`}>
              <input 
                type="radio" 
                name="mode" 
                className={`mt-1 w-4 h-4 focus:ring-2 ${
                  isVintageTheme ? 'text-vintage-leather focus:ring-vintage-leather bg-vintage-bg border-vintage-ink'
                  : 'text-brand-600 focus:ring-brand-500'
                }`}
                checked={mode === RecordMode.CONSERVATIVE}
                onChange={() => setMode(RecordMode.CONSERVATIVE)}
              />
              <div className="ml-3">
                <span className={`block text-sm font-medium ${
                  isVintageTheme ? 'text-vintage-ink font-typewriter'
                  : 'text-gray-900'
                }`}>{t.settings.conservative}</span>
                <span className={`block text-sm mt-1 ${
                  isVintageTheme ? 'text-vintage-leather/70 font-handwriting text-lg'
                  : 'text-gray-500'
                }`}>
                  {t.settings.conservativeDesc}
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;