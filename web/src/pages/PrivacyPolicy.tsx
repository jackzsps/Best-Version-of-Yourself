import React from 'react';
import { useApp } from '../store/AppContext';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { PRIVACY_POLICY_TEXT } from '../../../shared/privacyPolicyData';

const PrivacyPolicy = () => {
    const { theme, t, language } = useApp();
    const isVintageTheme = theme === 'vintage';

    const containerClass = isVintageTheme ? 'bg-vintage-bg text-vintage-ink overflow-y-auto h-full' : 'bg-gray-50 overflow-y-auto h-full';
    const headerClass = isVintageTheme ? 'bg-vintage-bg/90 p-6 border-b-2 border-vintage-line pt-8 sticky top-0 z-10' : 'bg-white p-6 shadow-sm sticky top-0 z-10';
    const titleClass = isVintageTheme ? 'text-vintage-ink font-typewriter text-2xl font-bold' : 'text-2xl font-bold text-gray-900';
    const contentClass = isVintageTheme ? 'vintage-card p-6 rounded-sm prose prose-vintage' : 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100 prose prose-gray max-w-none';
    const backButtonClass = isVintageTheme ? 'text-vintage-ink font-typewriter hover:underline mb-4 block' : 'text-gray-500 hover:text-gray-700 mb-4 block';

    const policyText = language === 'zh-TW' ? PRIVACY_POLICY_TEXT['zh-TW'] : PRIVACY_POLICY_TEXT['en'];

    return (
        <div className={`flex-1 ${containerClass} pb-24 no-scrollbar`}>
            <header className={headerClass}>
                <Link to="/settings" className={backButtonClass}>
                     {language === 'zh-TW' ? '← 返回設定' : '← Back to Settings'}
                </Link>
                <h1 className={titleClass}>{t.settings.privacyPolicy}</h1>
            </header>
            <div className="p-6">
                <div className={contentClass}>
                    <ReactMarkdown>{policyText}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
