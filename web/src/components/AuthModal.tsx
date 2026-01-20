import React, { useReducer, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { AuthError } from 'firebase/auth';
import { Icon } from './Icons';

// --- Types & State Management ---

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type State = {
  isLogin: boolean;
  email: string;
  password: string;
  name: string;
  error: string;
  isLoading: boolean;
};

type Action = 
  | { type: 'SET_FIELD'; field: keyof State; value: string }
  | { type: 'TOGGLE_MODE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: State = {
  isLogin: true,
  email: '',
  password: '',
  name: '',
  error: '',
  isLoading: false,
};

const authReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'TOGGLE_MODE':
      return { ...state, isLogin: !state.isLogin, error: '' };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return { ...initialState, isLogin: state.isLogin };
    default:
      return state;
  }
};

// --- Helper Functions ---

const getAuthErrorMessage = (error: AuthError, t: any): string => {
    switch (error.code) {
        case 'auth/invalid-email': return t.auth.errorEmail;
        case 'auth/invalid-credential': return t.auth.errorCredential;
        case 'auth/email-already-in-use': return t.auth.errorInUse;
        case 'auth/weak-password': return t.auth.errorWeak;
        case 'auth/network-request-failed': return t.auth.errorNetwork;
        default: return error.message || t.common.error;
    }
};

// --- Style Hook ---

const useStyles = (isVintage: boolean) => ({
    modalBg: isVintage ? 'bg-vintage-bg border-2 border-vintage-ink shadow-2xl' : 'bg-white rounded-2xl shadow-xl',
    input: isVintage 
        ? 'w-full bg-transparent border-b border-vintage-ink/50 py-2 font-typewriter text-vintage-ink placeholder-vintage-leather/50 focus:outline-none focus:border-vintage-ink'
        : 'w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all',
    button: isVintage
        ? 'w-full py-3 border-2 border-vintage-ink font-typewriter font-bold hover:bg-vintage-ink hover:text-vintage-bg transition-colors'
        : 'w-full py-3 rounded-lg bg-gray-900 text-white font-semibold shadow-lg active:scale-95 transition-all',
    googleButton: isVintage
        ? 'w-full py-3 border-2 border-vintage-ink font-typewriter font-bold flex items-center justify-center gap-2 hover:bg-vintage-ink/10 transition-colors'
        : 'w-full py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition-all',
    appleButton: isVintage
        ? 'w-full py-3 border-2 border-vintage-ink font-typewriter font-bold flex items-center justify-center gap-2 hover:bg-vintage-ink/10 transition-colors mt-3'
        : 'w-full py-3 rounded-lg bg-black text-white font-semibold shadow-sm hover:bg-gray-800 flex items-center justify-center gap-2 transition-all mt-3',
    title: `text-2xl font-bold mb-8 text-center ${isVintage ? 'font-typewriter text-vintage-ink' : 'text-gray-900'}`,
    switchButton: `text-sm hover:underline transition-all ${isVintage ? 'text-vintage-leather font-typewriter' : 'text-brand-600 font-medium'}`,
    divider: isVintage ? 'border-vintage-ink/30' : 'border-gray-200',
    dividerText: isVintage ? 'bg-vintage-bg text-vintage-leather font-typewriter' : 'bg-white text-gray-500',
});

// --- Component ---

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginEmail, registerEmail, loginGoogle, loginApple, theme, t } = useApp();
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { isLogin, email, password, name, error, isLoading } = state;

  const styles = useStyles(theme === 'vintage');

  useEffect(() => {
    if (isOpen) {
        dispatch({ type: 'RESET' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_FIELD', field, value: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      if (isLogin) {
        await loginEmail(email, password);
      } else {
        await registerEmail(email, password, name);
      }
      onClose();
    } catch (err) {
        console.error("Auth Error:", err);
        const errorMessage = getAuthErrorMessage(err as AuthError, t);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleGoogleLogin = async () => {
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await loginGoogle();
      onClose();
    } catch (err) {
      console.error("Google Auth Error:", err);
      const errorMessage = getAuthErrorMessage(err as AuthError, t);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleAppleLogin = async () => {
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await loginApple();
      onClose();
    } catch (err) {
      console.error("Apple Auth Error:", err);
      const errorMessage = getAuthErrorMessage(err as AuthError, t);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className={`w-full max-w-md p-8 relative ${styles.modalBg}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" aria-label={t.common.close}>
          <Icon name="x" className="w-6 h-6" />
        </button>

        <h2 className={styles.title}>
          {isLogin ? t.auth.loginTitle : t.auth.registerTitle}
        </h2>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-shake" role="alert">{error}</div>}

        <div className="space-y-4">
            <button 
                type="button" 
                onClick={handleGoogleLogin} 
                className={styles.googleButton}
                disabled={isLoading}
            >
                <Icon name="google" className="w-5 h-5" />
                {isLogin ? "Sign in with Google" : "Sign up with Google"}
            </button>

            <button 
                type="button" 
                onClick={handleAppleLogin} 
                className={styles.appleButton}
                disabled={isLoading}
            >
                <Icon name="apple" className="w-5 h-5 fill-current" />
                {isLogin ? "Sign in with Apple" : "Sign up with Apple"}
            </button>

            <div className="relative flex items-center justify-center my-6">
                <hr className={`absolute w-full ${styles.divider}`} />
                <span className={`relative px-4 text-sm ${styles.dividerText}`}>
                    {t.common.or || 'OR'}
                </span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <input type="text" placeholder={t.auth.namePlaceholder} value={name} onChange={handleFieldChange('name')} className={styles.input} required />
          )}
          <input type="email" placeholder={t.auth.emailPlaceholder} value={email} onChange={handleFieldChange('email')} className={styles.input} required />
          <input type="password" placeholder={t.auth.passwordPlaceholder} value={password} onChange={handleFieldChange('password')} className={styles.input} required />

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? t.common.processing : (isLogin ? t.auth.loginBtn : t.auth.registerBtn)}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => dispatch({ type: 'TOGGLE_MODE' })} className={styles.switchButton}>
            {isLogin ? t.auth.toRegister : t.auth.toLogin}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
