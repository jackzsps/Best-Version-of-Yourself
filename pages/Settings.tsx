
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { RecordMode, Entry } from '../types';
import AuthModal from '../components/AuthModal';
import { getArchivedEntries } from '../src/services/storageService';

const Settings = () => {
  const { mode, setMode, language, setLanguage, theme, setTheme, t, user, logout } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [archivedEntries, setArchivedEntries] = useState<Entry[] | null>(null);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);

  const isVintageTheme = theme === 'vintage';
  
  const containerClass = isVintageTheme ? 'bg-vintage-bg text-vintage-ink overflow-y-auto h-full' : 'bg-gray-50 overflow-y-auto h-full';
  const headerClass = isVintageTheme ? 'bg-vintage-bg/90 p-6 border-b-2 border-vintage-line pt-8 sticky top-0 z-10' : 'bg-white p-6 shadow-sm sticky top-0 z-10';
  const titleClass = isVintageTheme ? 'text-vintage-ink font-typewriter text-2xl font-bold' : 'text-2xl font-bold text-gray-900';
  const cardClass = isVintageTheme ? 'vintage-card p-6 rounded-sm' : 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100';
  const textHeadClass = isVintageTheme ? 'text-vintage-ink font-typewriter text-lg font-bold mb-4 border-b border-vintage-line pb-1 inline-block' : 'text-lg font-semibold text-gray-900 mb-4';
  const textBodyClass = isVintageTheme ? 'text-vintage-leather/80 font-handwriting text-lg mb-6' : 'text-gray-500 text-sm mb-6';

  const handleLoadArchive = async () => {
    if (!user) return;
    setIsLoadingArchive(true);
    try {
      const entries = await getArchivedEntries(user.uid);
      setArchivedEntries(entries);
    } catch (error) {
      console.error("Failed to load archived entries:", error);
      // You might want to show an error message to the user
    } finally {
      setIsLoadingArchive(false);
    }
  };

  return (
    <div className={`flex-1 ${containerClass} pb-24 no-scrollbar`}>
      <header className={headerClass}>
        <h1 className={titleClass}>{t.settings.title}</h1>
      </header>

      <div className="p-6 space-y-6">

        {/* Account Settings */}
        <div className={cardClass}>
           <h2 className={textHeadClass}>{t.settings.account}</h2>
           
           <div className="flex flex-col items-start gap-4">
             {user ? (
               <>
                 <div className="flex items-center gap-4 w-full">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${isVintageTheme ? 'bg-vintage-ink text-vintage-bg' : 'bg-brand-100 text-brand-600'}`}>
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className={`w-14 h-14 rounded-full ${isVintageTheme ? 'border-2 border-vintage-ink sepia' : 'border border-gray-200'}`} />
                      ) : (
                        user.displayName ? user.displayName[0].toUpperCase() : 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isVintageTheme ? 'text-vintage-ink font-typewriter' : 'text-gray-900'}`}>
                        {user.displayName || 'User'}
                      </p>
                      <p className={`text-sm truncate ${isVintageTheme ? 'text-vintage-leather' : 'text-gray-500'}`}>
                        {user.email}
                      </p>
                    </div>
                 </div>
                 <button onClick={logout} className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all ${isVintageTheme ? 'border-2 border-vintage-ink text-vintage-ink hover:bg-vintage-ink hover:text-vintage-bg font-typewriter' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                    {t.settings.signOut}
                 </button>
               </>
             ) : (
               <>
                 <p className={textBodyClass}>{t.settings.authDesc}</p>
                 <button onClick={() => setShowAuthModal(true)} className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${isVintageTheme ? 'bg-vintage-ink text-vintage-bg shadow-md hover:shadow-lg font-typewriter' : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {t.settings.signIn}
                 </button>
               </>
             )}
           </div>
        </div>

        {/* Data Management */}
        {user && (
            <div className={cardClass}>
                <h2 className={textHeadClass}>Data Management</h2>
                <p className={textBodyClass}>Load your archived data.</p>
                <button onClick={handleLoadArchive} disabled={isLoadingArchive} className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all ${isVintageTheme ? 'border-2 border-vintage-ink text-vintage-ink hover:bg-vintage-ink hover:text-vintage-bg font-typewriter' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                    {isLoadingArchive ? 'Loading...' : 'Load Archived Entries'}
                </button>
                {archivedEntries && (
                    <div className="mt-4">
                        <h3 className="text-lg font-bold">Archived Entries</h3>
                        <ul>
                            {archivedEntries.map((entry, index) => (
                                <li key={index} className="py-2 border-b">
                                    {entry.itemName} - {new Date(entry.date.seconds * 1000).toLocaleDateString()}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )}
        
        {/* Theme Settings */}
        <div className={cardClass}>
           <h2 className={textHeadClass}>{t.settings.theme}</h2>
           <p className={textBodyClass}>{t.settings.themeDesc}</p>
           <div className={`flex w-full p-1 rounded-xl ${isVintageTheme ? 'border-2 border-vintage-line' : 'bg-gray-100'}`}>
              <button onClick={() => setTheme('default')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${theme === 'default' ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}>
                {t.settings.themeDefault}
              </button>
              <button onClick={() => setTheme('vintage')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${theme === 'vintage' ? 'bg-vintage-leather text-vintage-card shadow-md border-2 border-vintage-ink' : 'text-gray-500'}`}>
                {t.settings.themeVintage}
              </button>
           </div>
        </div>

        {/* Language Settings */}
        <div className={cardClass}>
          <h2 className={textHeadClass}>{t.settings.language}</h2>
          <p className={textBodyClass}>{t.settings.languageDesc}</p>
          <div className={`flex p-1 rounded-xl ${isVintageTheme ? 'border-2 border-vintage-line' : 'bg-gray-100'}`}>
            <button onClick={() => setLanguage('zh-TW')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${language === 'zh-TW' ? (isVintageTheme ? 'bg-vintage-ink text-vintage-bg shadow' : 'bg-white shadow text-brand-600') : 'text-gray-500'}`}>繁體中文</button>
            <button onClick={() => setLanguage('en')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${language === 'en' ? (isVintageTheme ? 'bg-vintage-ink text-vintage-bg shadow' : 'bg-white shadow text-brand-600') : 'text-gray-500'}`}>English</button>
          </div>
        </div>

        {/* Record Mode Settings */}
        <div className={cardClass}>
          <h2 className={textHeadClass}>{t.settings.standard}</h2>
          <p className={textBodyClass}>{t.settings.standardDesc}</p>
          <div className="space-y-4">
            <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${mode === RecordMode.STRICT ? (isVintageTheme ? 'border-vintage-ink bg-vintage-line/30 ring-1 ring-vintage-ink' : 'border-brand-500 bg-brand-50 ring-1 ring-brand-500') : (isVintageTheme ? 'border-vintage-line' : 'border-gray-200')}`}>
              <input type="radio" name="mode" className="mt-1 w-4 h-4" checked={mode === RecordMode.STRICT} onChange={() => setMode(RecordMode.STRICT)} />
              <div className="ml-3">
                <span className={`block text-sm font-bold ${isVintageTheme ? 'font-typewriter' : ''}`}>{t.settings.strict}</span>
                <span className={`block text-xs mt-1 ${isVintageTheme ? 'font-handwriting text-lg' : 'text-gray-500'}`}>{t.settings.strictDesc}</span>
              </div>
            </label>
            <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${mode === RecordMode.CONSERVATIVE ? (isVintageTheme ? 'border-vintage-ink bg-vintage-line/30 ring-1 ring-vintage-ink' : 'border-brand-500 bg-brand-50 ring-1 ring-brand-500') : (isVintageTheme ? 'border-vintage-line' : 'border-gray-200')}`}>
              <input type="radio" name="mode" className="mt-1 w-4 h-4" checked={mode === RecordMode.CONSERVATIVE} onChange={() => setMode(RecordMode.CONSERVATIVE)} />
              <div className="ml-3">
                <span className={`block text-sm font-bold ${isVintageTheme ? 'font-typewriter' : ''}`}>{t.settings.conservative}</span>
                <span className={`block text-xs mt-1 ${isVintageTheme ? 'font-handwriting text-lg' : 'text-gray-500'}`}>{t.settings.conservativeDesc}</span>
              </div>
            </label>
          </div>
        </div>
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Settings;
