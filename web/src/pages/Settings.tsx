import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { RecordMode, Entry, Theme } from '@shared/types';
import AuthModal from '../components/AuthModal';
import { getArchivedEntries } from '../services/storageService';
import { Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../utils/firebase';
import { useToast } from '../store/ToastContext';

// --- Theme Configuration ---
// This extracts the styling logic out of the component render cycle.
// Easy to add 'dark' or other themes in the future.

type ThemeClasses = {
  container: string;
  header: string;
  title: string;
  card: string;
  textHead: string;
  textBody: string;
  userAvatarBg: string;
  userAvatarImg: string;
  userName: string;
  userEmail: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonDanger: string;
  inputContainer: (isActive: boolean) => string;
  tabContainer: string;
  tabButton: (isActive: boolean) => string;
};

const THEME_STYLES: Record<Theme, ThemeClasses> = {
  default: {
    container: 'bg-gray-50 overflow-y-auto h-full',
    header: 'bg-white p-6 shadow-sm sticky top-0 z-10',
    title: 'text-2xl font-bold text-gray-900',
    card: 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100',
    textHead: 'text-lg font-semibold text-gray-900 mb-4',
    textBody: 'text-gray-500 text-sm mb-6',
    userAvatarBg: 'bg-brand-100 text-brand-600',
    userAvatarImg: 'border border-gray-200',
    userName: 'text-gray-900',
    userEmail: 'text-gray-500',
    buttonPrimary: 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg',
    buttonSecondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    buttonDanger: 'bg-red-50 text-red-600 hover:bg-red-100',
    inputContainer: (isActive) =>
      `flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
        isActive ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200'
      }`,
    tabContainer: 'bg-gray-100',
    tabButton: (isActive) =>
      `flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
        isActive ? 'bg-white shadow text-brand-600' : 'text-gray-500'
      }`,
  },
  vintage: {
    container: 'bg-vintage-bg text-vintage-ink overflow-y-auto h-full',
    header: 'bg-vintage-bg/90 p-6 border-b-2 border-vintage-line pt-8 sticky top-0 z-10',
    title: 'text-vintage-ink font-typewriter text-2xl font-bold',
    card: 'vintage-card p-6 rounded-sm',
    textHead: 'text-vintage-ink font-typewriter text-lg font-bold mb-4 border-b border-vintage-line pb-1 inline-block',
    textBody: 'text-vintage-leather/80 font-handwriting text-lg mb-6',
    userAvatarBg: 'bg-vintage-ink text-vintage-bg',
    userAvatarImg: 'border-2 border-vintage-ink sepia',
    userName: 'text-vintage-ink font-typewriter',
    userEmail: 'text-vintage-leather',
    buttonPrimary: 'bg-vintage-ink text-vintage-bg shadow-md hover:shadow-lg font-typewriter',
    buttonSecondary: 'border-2 border-vintage-ink text-vintage-ink hover:bg-vintage-ink hover:text-vintage-bg font-typewriter',
    buttonDanger: 'border-2 border-vintage-ink text-vintage-ink hover:bg-vintage-ink hover:text-vintage-bg font-typewriter',
    inputContainer: (isActive) =>
      `flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
        isActive ? 'border-vintage-ink bg-vintage-line/30 ring-1 ring-vintage-ink' : 'border-vintage-line'
      }`,
    tabContainer: 'border-2 border-vintage-line',
    tabButton: (isActive) =>
      `flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
        isActive ? 'bg-vintage-ink text-vintage-bg shadow' : 'text-gray-500'
      }`,
  },
};

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  confirmButtonClass,
  isInput = false,
  inputPlaceholder = '',
  expectedInput = ''
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (input?: string) => void; 
  title: string; 
  message: string; 
  confirmText: string;
  confirmButtonClass?: string;
  isInput?: boolean;
  inputPlaceholder?: string;
  expectedInput?: string;
}) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isInput && expectedInput && inputValue !== expectedInput) {
       // Ideally show inline error, but for minimal change we rely on the parent or just prevent close
       // But to match the previous behavior, let's just close and let parent handle validation or pass input back
       onConfirm(inputValue);
       return;
    }
    onConfirm(inputValue);
    setInputValue('');
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='bg-white rounded-lg p-6 max-w-sm w-full shadow-xl'>
        <h3 className='text-lg font-bold mb-2 text-gray-900'>{title}</h3>
        <p className='text-gray-600 mb-4 text-sm'>{message}</p>
        
        {isInput && (
          <input 
            type='text' 
            className='w-full border border-gray-300 rounded p-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={inputPlaceholder}
          />
        )}

        <div className='flex justify-end gap-3'>
          <button 
            onClick={() => {
                setInputValue('');
                onClose();
            }}
            className='px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm'
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg text-white font-medium text-sm ${confirmButtonClass || 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { mode, setMode, language, setLanguage, theme, setTheme, t, user, logout, isPro, setSubscription } = useApp();
  const { showToast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [archivedEntries, setArchivedEntries] = useState<Entry[] | null>(null);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Modals state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Use the extracted styles based on current theme
  const styles = THEME_STYLES[theme] || THEME_STYLES.default;

  const handleLogout = () => {
      setShowLogoutConfirm(true);
  };

  const handleLoadArchive = async () => {
    if (!user) return;
    setIsLoadingArchive(true);
    try {
      const entries = await getArchivedEntries(user.uid);
      setArchivedEntries(entries);
    } catch (error) {
      console.error('Failed to load archived entries:', error);
      showToast('Failed to load archived entries.', 'error');
    } finally {
      setIsLoadingArchive(false);
    }
  };

  const handleTestSubscription = async () => {
      // Mock Subscription for Web Testing
      if (!user) {
          setShowAuthModal(true);
          return;
      }
      
      const confirm = window.confirm("Enable Pro Mode (Test)?");
      if (confirm) {
          try {
            await setSubscription({
                status: 'active',
                productId: 'web_test_pro',
                purchaseDate: Date.now(),
                transactionId: `web_test_${Date.now()}`
            });
            showToast("Pro mode enabled!", "success");
          } catch (e) {
            showToast("Failed to enable Pro mode.", "error");
          }
      }
  }

  const confirmDeleteAccount = async (input?: string) => {
    if (!user) return;
    
    // Check input if provided
    if (input !== "DELETE") {
      showToast(language === 'zh-TW' ? '輸入不正確，已取消刪除。' : 'Incorrect input, deletion cancelled.', 'error');
      setShowDeleteConfirm(false);
      return;
    }

    setShowDeleteConfirm(false);
    setIsDeletingAccount(true);

    try {
      const deleteAccountFn = httpsCallable(functions, 'deleteAccount');
      await deleteAccountFn();
      
      showToast(language === 'zh-TW' ? '帳號已成功刪除。' : 'Account successfully deleted.', 'success');
      logout(); // Logout and clear local state

    } catch (error: any) {
      console.error('Delete account failed:', error);
      showToast(
        language === 'zh-TW' 
          ? `刪除帳號失敗: ${error.message || '請稍後再試'}` 
          : `Failed to delete account: ${error.message || 'Please try again later'}`,
        'error'
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className={`flex-1 ${styles.container} pb-24 no-scrollbar`}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.settings.title}</h1>
      </header>

      <div className='p-6 space-y-6'>

        {/* Account Settings */}
        <div className={styles.card}>
           <h2 className={styles.textHead}>{t.settings.account}</h2>
           
           <div className='flex flex-col items-start gap-4'>
             {user ? (
               <>
                 <div className='flex items-center gap-4 w-full'>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${styles.userAvatarBg}`}>
                      {user.photoURL ? (
                        <img src={user.photoURL} alt='Profile' className={`w-14 h-14 rounded-full ${styles.userAvatarImg}`} />
                      ) : (
                        user.displayName ? user.displayName[0].toUpperCase() : 'U'
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className={`font-bold truncate ${styles.userName}`}>
                        {user.displayName || 'User'}
                      </p>
                      <p className={`text-sm truncate ${styles.userEmail}`}>
                        {user.email}
                      </p>
                      {isPro && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                              PRO
                          </span>
                      )}
                    </div>
                 </div>
                 <button onClick={handleLogout} className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all ${styles.buttonSecondary}`}>
                    {t.settings.signOut}
                 </button>
                 
                 {/* Delete Account Button */}
                 <button 
                   onClick={() => setShowDeleteConfirm(true)} 
                   disabled={isDeletingAccount}
                   className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all bg-red-600 text-white hover:bg-red-700 shadow-sm mt-2`}
                 >
                    {isDeletingAccount 
                      ? (language === 'zh-TW' ? '刪除中...' : 'Deleting...') 
                      : (language === 'zh-TW' ? '刪除帳號' : 'Delete Account')}
                 </button>
               </>
             ) : (
               <>
                 <p className={styles.textBody}>{t.settings.authDesc}</p>
                 <button onClick={() => setShowAuthModal(true)} className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${styles.buttonPrimary}`}>
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg>
                    {t.settings.signIn}
                 </button>
               </>
             )}
           </div>
        </div>
        
        {/* Subscription (Web Test) */}
        {user && (
            <div className={styles.card}>
                <h2 className={styles.textHead}>Subscription (Web Test)</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={styles.textBody + " mb-0"}>Status: {isPro ? "Active" : "Free"}</p>
                    </div>
                    <button 
                        onClick={handleTestSubscription}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isPro ? styles.buttonSecondary : styles.buttonPrimary}`}
                    >
                        {isPro ? "Manage (Mock)" : "Upgrade to Pro (Test)"}
                    </button>
                </div>
            </div>
        )}

        {/* Data Management */}
        {user && (
            <div className={styles.card}>
                <h2 className={styles.textHead}>Data Management</h2>
                <p className={styles.textBody}>Load your archived data.</p>
                <button onClick={handleLoadArchive} disabled={isLoadingArchive} className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all ${styles.buttonSecondary}`}>
                    {isLoadingArchive ? 'Loading...' : 'Load Archived Entries'}
                </button>
                {archivedEntries && (
                    <div className='mt-4'>
                        <h3 className='text-lg font-bold'>Archived Entries</h3>
                        <ul>
                            {archivedEntries.map((entry, index) => (
                                <li key={index} className='py-2 border-b'>
                                    {entry.itemName} - {new Date(entry.date.seconds * 1000).toLocaleDateString()}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )}
        
        {/* Theme Settings */}
        <div className={styles.card}>
           <h2 className={styles.textHead}>{t.settings.theme}</h2>
           <p className={styles.textBody}>{t.settings.themeDesc}</p>
           <div className={`flex w-full p-1 rounded-xl ${styles.tabContainer}`}>
              <button onClick={() => setTheme('default')} className={styles.tabButton(theme === 'default')}>
                {t.settings.themeDefault}
              </button>
              <button onClick={() => setTheme('vintage')} className={styles.tabButton(theme === 'vintage')}>
                {t.settings.themeVintage}
              </button>
           </div>
        </div>

        {/* Language Settings */}
        <div className={styles.card}>
          <h2 className={styles.textHead}>{t.settings.language}</h2>
          <p className={styles.textBody}>{t.settings.languageDesc}</p>
          <div className={`flex p-1 rounded-xl ${styles.tabContainer}`}>
            <button onClick={() => setLanguage('zh-TW')} className={styles.tabButton(language === 'zh-TW')}>{t.settings.langZh}</button>
            <button onClick={() => setLanguage('en')} className={styles.tabButton(language === 'en')}>{t.settings.langEn}</button>
          </div>
        </div>

        {/* Record Mode Settings */}
        <div className={styles.card}>
          <h2 className={styles.textHead}>{t.settings.standard}</h2>
          <p className={styles.textBody}>{t.settings.standardDesc}</p>
          <div className='space-y-4'>
            <label className={styles.inputContainer(mode === RecordMode.STRICT)}>
              <input type='radio' name='mode' className='mt-1 w-4 h-4' checked={mode === RecordMode.STRICT} onChange={() => setMode(RecordMode.STRICT)} />
              <div className='ml-3'>
                <span className={`block text-sm font-bold ${theme === 'vintage' ? 'font-typewriter' : ''}`}>{t.settings.strict}</span>
                <span className={`block text-xs mt-1 ${theme === 'vintage' ? 'font-handwriting text-lg' : 'text-gray-500'}`}>{t.settings.strictDesc}</span>
              </div>
            </label>
            <label className={styles.inputContainer(mode === RecordMode.CONSERVATIVE)}>
              <input type='radio' name='mode' className='mt-1 w-4 h-4' checked={mode === RecordMode.CONSERVATIVE} onChange={() => setMode(RecordMode.CONSERVATIVE)} />
              <div className='ml-3'>
                <span className={`block text-sm font-bold ${theme === 'vintage' ? 'font-typewriter' : ''}`}>{t.settings.conservative}</span>
                <span className={`block text-xs mt-1 ${theme === 'vintage' ? 'font-handwriting text-lg' : 'text-gray-500'}`}>{t.settings.conservativeDesc}</span>
              </div>
            </label>
          </div>
        </div>

        {/* Privacy Policy */}
         <div className={styles.card}>
           <h2 className={styles.textHead}>{t.settings.privacyPolicy}</h2>
           <Link to='/privacy-policy' className={`block w-full text-center py-3 px-4 rounded-xl text-sm font-bold transition-all ${styles.buttonSecondary}`}>
              {t.settings.privacyPolicy}
           </Link>
         </div>

      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title={t.settings.signOut}
        message={t.settings.logoutWarning}
        confirmText={t.settings.signOut}
        confirmButtonClass='bg-red-600 hover:bg-red-700'
      />

      {/* Delete Account Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAccount}
        title={language === 'zh-TW' ? '確定要刪除帳號？' : 'Are you sure?'}
        message={language === 'zh-TW' 
          ? '此操作將永久刪除所有資料且無法復原。請輸入 "DELETE" 以確認。' 
          : 'This action cannot be undone. Please type "DELETE" to confirm.'}
        confirmText={language === 'zh-TW' ? '刪除帳號' : 'Delete Account'}
        confirmButtonClass='bg-red-600 hover:bg-red-700'
        isInput={true}
        inputPlaceholder="DELETE"
        expectedInput="DELETE"
      />
    </div>
  );
};

export default Settings;
