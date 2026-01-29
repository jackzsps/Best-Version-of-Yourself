import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { RecordMode, Entry, Theme } from '@shared/types';
import AuthModal from '../components/AuthModal';
import { getArchivedEntries } from '../services/storageService';
import { Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../utils/firebase';
import { useToast } from '../store/ToastContext';
import { Timestamp } from 'firebase/firestore';
import { Icon } from '../components/Icons';

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
  item: string;
  label: string;
  value: string;
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
    item: 'flex items-center justify-between py-4 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors',
    label: 'text-gray-900 font-medium',
    value: 'text-gray-500 text-sm',
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
    item: 'flex items-center justify-between py-4 border-b border-dashed border-vintage-line/50 last:border-0 cursor-pointer hover:bg-vintage-line/10 px-2 -mx-2 rounded-sm transition-colors',
    label: 'text-vintage-ink font-typewriter',
    value: 'text-vintage-leather font-typewriter text-sm',
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
  const { mode, setMode, language, setLanguage, theme, setTheme, t, user, logout, isWriting, isPro, subscription, setSubscription } = useApp();
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
    if (isWriting) {
      setShowLogoutConfirm(true);
    } else {
      logout();
    }
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
      
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 14);

      try {
        await setSubscription({
            status: 'pro',
            expiryDate: Timestamp.fromDate(newExpiry)
        });
        showToast("Pro mode extended by 14 days (Test)!", "success");
      } catch (e) {
        showToast("Failed to extend Pro mode.", "error");
      }
  }
  
  const getSubscriptionDisplay = () => {
      if (!subscription) return "Unknown";
      
      // Basic / Trial / Pro
      // Check expiry first
      if (!isPro) {
          if (subscription.status === 'pro' || subscription.status === 'trial') return "Expired";
          return "Basic";
      }
      
      if (subscription.status === 'trial') return "Pro (Trial)";
      if (subscription.status === 'pro') return "Pro";
      
      return "Basic";
  }
  
  const getExpiryDisplay = () => {
      if (!subscription?.expiryDate) return null;
      
      const date = new Date(subscription.expiryDate.seconds * 1000);
      return date.toLocaleDateString();
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

  const SettingItem = ({
    label,
    value,
    onPress,
    isLink = false,
    to = '',
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    isLink?: boolean;
    to?: string;
  }) => {
    const Content = () => (
      <>
        <span className={styles.label}>{label}</span>
        <div className="flex items-center gap-2">
            {value && <span className={styles.value}>{value}</span>}
            <Icon name="arrowRight" className={`w-4 h-4 ${theme === 'vintage' ? 'text-vintage-ink' : 'text-gray-400'}`} />
        </div>
      </>
    );

    if (isLink && to) {
        return (
            <Link to={to} className={styles.item}>
                <Content />
            </Link>
        )
    }

    return (
      <div onClick={onPress} className={styles.item}>
        <Content />
      </div>
    );
  };

  return (
    <div className={`flex-1 ${styles.container} pb-24 no-scrollbar`}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.settings.title}</h1>
      </header>

      <div className='p-6 space-y-6'>

        {/* Account Section */}
        <div className={styles.card}>
           <h2 className={styles.textHead}>{t.settings.account}</h2>
           
           <div className='flex flex-col items-start gap-4'>
             {user ? (
               <>
                 <div className='flex items-center gap-4 w-full mb-4'>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden ${styles.userAvatarBg}`}>
                      {user.photoURL ? (
                        <img src={user.photoURL} alt='Profile' className={`w-full h-full object-cover ${styles.userAvatarImg}`} />
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
                      <div className="flex gap-2 mt-1">
                          <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full ${
                              isPro ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'
                          }`}>
                              {getSubscriptionDisplay()}
                          </span>
                      </div>
                    </div>
                 </div>
                 
                 {/* Replicating mobile style list items */}
                 <div className="w-full">
                    <div className={styles.item + " cursor-default hover:bg-transparent"}>
                        <span className={styles.label}>Email</span>
                        <span className={styles.value}>{user.email || 'Guest'}</span>
                    </div>
                    {isPro && (
                        <div className={styles.item + " cursor-default hover:bg-transparent"}>
                             <span className={styles.label}>Expires</span>
                             <span className={styles.value}>{getExpiryDisplay() || 'Never'}</span>
                        </div>
                    )}
                 </div>

                 <button onClick={handleLogout} className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all mt-4 ${styles.buttonSecondary}`}>
                    {t.settings.signOut}
                 </button>
                 
                 {/* Delete Account Button */}
                 <button 
                   onClick={() => setShowDeleteConfirm(true)} 
                   disabled={isDeletingAccount}
                   className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all bg-red-50 text-red-600 hover:bg-red-100 shadow-sm mt-2`}
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
                    {t.settings.signIn}
                 </button>
               </>
             )}
           </div>
        </div>

        {/* Preferences Section */}
        <div className={styles.card}>
            <h2 className={styles.textHead}>Preferences</h2>
            <div className="w-full">
                <SettingItem
                  label={t.settings.language}
                  value={language === 'zh-TW' ? t.settings.langZh : t.settings.langEn}
                  onPress={() => setLanguage(language === 'zh-TW' ? 'en' : 'zh-TW')}
                />
                <SettingItem
                  label={t.settings.theme}
                  value={theme === 'vintage' ? t.settings.themeVintage : t.settings.themeDefault}
                  onPress={() => setTheme(theme === 'vintage' ? 'default' : 'vintage')}
                />
                <SettingItem
                  label={t.settings.standard}
                  value={mode === 'strict' ? t.settings.strict : t.settings.conservative}
                  onPress={() => setMode(mode === 'strict' ? 'conservative' : 'strict')}
                />
                 {/* Subscription Test Button - mimicking mobile item style */}
                {user && (
                    <SettingItem 
                        label={isPro ? "Manage Subscription" : "Upgrade to Pro (Test)"}
                        value={getSubscriptionStatusText(subscription, isPro)}
                        onPress={handleTestSubscription}
                    />
                )}
            </div>
            <p className={`mt-4 text-xs ${styles.textBody}`}>
                {mode === 'strict' ? t.settings.strictDesc : t.settings.conservativeDesc}
            </p>
        </div>

        {/* Data Management (Web Only Feature but keeping for utility) */}
        {user && (
            <div className={styles.card}>
                <h2 className={styles.textHead}>Data Management</h2>
                <div className="w-full">
                     <div onClick={handleLoadArchive} className={styles.item}>
                        <span className={styles.label}>{isLoadingArchive ? 'Loading...' : 'Load Archived Entries'}</span>
                        <Icon name="arrowRight" className={`w-4 h-4 ${theme === 'vintage' ? 'text-vintage-ink' : 'text-gray-400'}`} />
                     </div>
                </div>
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

        {/* About Section */}
         <div className={styles.card}>
           <h2 className={styles.textHead}>{t.settings.about}</h2>
           <div className="w-full">
                <SettingItem
                    label={t.settings.privacyPolicy}
                    isLink
                    to='/privacy-policy'
                />
           </div>
         </div>
         
         <div className="text-center mt-6 text-gray-400 text-xs">
            Version 1.0.0
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

// Helper for subscription text
const getSubscriptionStatusText = (subscription: any, isPro: boolean) => {
    if (!subscription) return "";
    
    if (!isPro) {
        if (subscription.status === 'pro' || subscription.status === 'trial') return "Expired";
        return "Free";
    }
    
    if (subscription.status === 'trial') return "Pro (Trial)";
    if (subscription.status === 'pro') return "Pro Active";
    
    return "";
};

export default Settings;
