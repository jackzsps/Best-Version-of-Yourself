import React, { useState } from 'react';
import { useApp } from '../store/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginEmail, registerEmail, theme, t } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isVintage = theme === 'vintage';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginEmail(email, password);
      } else {
        await registerEmail(email, password, name);
      }
      onClose();
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message || "Error";
      if (msg.includes("auth/invalid-email")) msg = t.auth.errorEmail;
      if (msg.includes("auth/invalid-credential")) msg = t.auth.errorCredential;
      if (msg.includes("auth/email-already-in-use")) msg = t.auth.errorInUse;
      if (msg.includes("auth/weak-password")) msg = t.auth.errorWeak;
      if (msg.includes("auth/network-request-failed")) msg = t.auth.errorNetwork;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const modalBg = isVintage ? 'bg-vintage-bg border-2 border-vintage-ink shadow-2xl' : 'bg-white rounded-2xl shadow-xl';
  const inputClass = isVintage 
    ? 'w-full bg-transparent border-b border-vintage-ink/50 py-2 font-typewriter text-vintage-ink placeholder-vintage-leather/50 focus:outline-none focus:border-vintage-ink'
    : 'w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all';
  const btnClass = isVintage
    ? 'w-full py-3 border-2 border-vintage-ink font-typewriter font-bold hover:bg-vintage-ink hover:text-vintage-bg transition-colors'
    : 'w-full py-3 rounded-lg bg-gray-900 text-white font-semibold shadow-lg active:scale-95 transition-all';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md p-8 relative ${modalBg}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className={`text-2xl font-bold mb-8 text-center ${isVintage ? 'font-typewriter text-vintage-ink' : 'text-gray-900'}`}>
          {isLogin ? t.auth.loginTitle : t.auth.registerTitle}
        </h2>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-shake">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <input type="text" placeholder={t.auth.namePlaceholder} value={name} onChange={e => setName(e.target.value)} className={inputClass} required />
          )}
          <input type="email" placeholder={t.auth.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} className={inputClass} required />
          <input type="password" placeholder={t.auth.passwordPlaceholder} value={password} onChange={e => setPassword(e.target.value)} className={inputClass} required />

          <button type="submit" className={btnClass} disabled={loading}>
            {loading ? t.common.processing : (isLogin ? t.auth.loginBtn : t.auth.registerBtn)}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className={`text-sm hover:underline transition-all ${isVintage ? 'text-vintage-leather font-typewriter' : 'text-brand-600 font-medium'}`}>
            {isLogin ? t.auth.toRegister : t.auth.toLogin}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;