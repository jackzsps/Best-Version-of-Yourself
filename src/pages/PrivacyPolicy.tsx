import React from 'react';
import { useApp } from '../store/AppContext';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const PrivacyPolicy = () => {
    const { theme, t, language } = useApp();
    const isVintageTheme = theme === 'vintage';

    const containerClass = isVintageTheme ? 'bg-vintage-bg text-vintage-ink overflow-y-auto h-full' : 'bg-gray-50 overflow-y-auto h-full';
    const headerClass = isVintageTheme ? 'bg-vintage-bg/90 p-6 border-b-2 border-vintage-line pt-8 sticky top-0 z-10' : 'bg-white p-6 shadow-sm sticky top-0 z-10';
    const titleClass = isVintageTheme ? 'text-vintage-ink font-typewriter text-2xl font-bold' : 'text-2xl font-bold text-gray-900';
    const contentClass = isVintageTheme ? 'vintage-card p-6 rounded-sm prose prose-vintage' : 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100 prose prose-gray max-w-none';
    const backButtonClass = isVintageTheme ? 'text-vintage-ink font-typewriter hover:underline mb-4 block' : 'text-gray-500 hover:text-gray-700 mb-4 block';

    const policyText = language === 'zh-TW' ? `
# 隱私權政策

**生效日期：** 2024 年 5 月 27 日

歡迎使用「最好版本的自己」（以下簡稱「本應用程式」）。我們非常重視您的隱私權，本隱私權政策旨在說明我們如何收集、使用、揭露及保護您的個人資訊。

## 1. 我們收集的資訊

我們可能會收集以下類型的資訊：

*   **帳戶資訊：** 當您註冊帳戶時，我們會收集您的電子郵件地址、暱稱以及個人頭像（如果您選擇提供）。如果您使用第三方登入服務（如 Google 或 Facebook），我們會從該服務獲取您的基本個人資料。
*   **使用數據：** 我們會收集您在本應用程式中的活動記錄，例如您新增的飲食記錄、支出記錄、以及您使用的功能。這些數據有助於我們改進服務並提供個人化的分析。
*   **裝置資訊：** 我們可能會收集有關您使用的裝置的資訊，例如裝置型號、操作系統版本、唯一裝置識別碼以及 IP 地址。
*   **影像數據：** 當您使用拍照功能進行分析時，我們會暫時處理您的照片以進行圖像識別。除非您明確同意保存，否則我們不會永久儲存這些原始照片。

## 2. 我們如何使用您的資訊

我們使用收集到的資訊來：

*   **提供和維護服務：** 讓您能夠記錄和追蹤您的日常活動，並確保應用程式的正常運作。
*   **提供個人化體驗：** 根據您的記錄提供個人化的 AI 洞察和建議（例如飲食建議或支出分析）。
*   **改善我們的服務：** 分析使用數據以了解用戶如何使用本應用程式，從而開發新功能並優化用戶體驗。
*   **通訊：** 向您發送有關帳戶的重要通知、更新或行銷訊息（您可以選擇退出行銷訊息）。
*   **安全：** 監控和防止欺詐、濫用或安全漏洞。

## 3. 資訊分享與揭露

我們不會將您的個人資訊出售給第三方。我們僅在以下情況下分享您的資訊：

*   **服務提供商：** 我們可能會與協助我們營運服務的第三方服務提供商（例如雲端託管、數據分析服務）分享資訊。這些提供商僅能根據我們的指示處理您的數據。
*   **法律要求：** 如果法律要求或為了回應有效的法律程序（如法院命令或傳票），我們可能會揭露您的資訊。
*   **業務轉讓：** 如果我們涉及合併、收購或資產出售，您的資訊可能會作為該交易的一部分轉移。

## 4. 您的權利

您擁有以下權利：

*   **存取和更正：** 您可以在應用程式的設定中查看和編輯您的個人資料。
*   **刪除：** 您可以要求刪除您的帳戶及相關數據。請注意，某些數據可能因法律要求或備份目的而保留一段時間。
*   **撤回同意：** 您可以隨時撤回對我們處理您數據的同意（例如停止接收行銷郵件）。

## 5. 數據安全

我們採取合理的安全措施來保護您的資訊免受未經授權的存取、丟失或濫用。然而，請注意，沒有任何互聯網傳輸或電子儲存方法是 100% 安全的。

## 6. 兒童隱私

本應用程式不適用於 13 歲以下的兒童。我們不會故意收集 13 歲以下兒童的個人資訊。如果您發現您的孩子向我們提供了個人資訊，請聯繫我們，我們將採取措施刪除該資訊。

## 7. 政策變更

我們可能會不時更新本隱私權政策。我們將通過應用程式或電子郵件通知您任何重大變更。建議您定期查看本頁面以獲取最新資訊。

## 8. 聯絡我們

如果您對本隱私權政策有任何疑問，請通過以下方式聯繫我們：

*   Email: support@bestversion.app

` : `
# Privacy Policy

**Effective Date:** May 27, 2024

Welcome to "Best Version" (hereinafter referred to as "the App"). We value your privacy highly. This Privacy Policy explains how we collect, use, disclose, and protect your personal information.

## 1. Information We Collect

We may collect the following types of information:

*   **Account Information:** When you register for an account, we collect your email address, nickname, and profile picture (if you choose to provide one). If you use a third-party login service (such as Google or Facebook), we will obtain your basic profile information from that service.
*   **Usage Data:** We collect records of your activities within the App, such as your diet logs, expense records, and the features you use. This data helps us improve our services and provide personalized analytics.
*   **Device Information:** We may collect information about the device you use, such as device model, operating system version, unique device identifiers, and IP address.
*   **Image Data:** When you use the camera feature for analysis, we temporarily process your photos for image recognition. Unless you explicitly agree to save them, we do not permanently store these original photos.

## 2. How We Use Your Information

We use the collected information to:

*   **Provide and Maintain Service:** Enable you to log and track your daily activities and ensure the App functions correctly.
*   **Provide Personalized Experience:** Offer personalized AI insights and recommendations based on your records (e.g., diet suggestions or expense analysis).
*   **Improve Our Services:** Analyze usage data to understand how users interact with the App, allowing us to develop new features and optimize user experience.
*   **Communication:** Send you important notifications about your account, updates, or marketing messages (you can opt-out of marketing messages).
*   **Security:** Monitor and prevent fraud, abuse, or security breaches.

## 3. Information Sharing and Disclosure

We do not sell your personal information to third parties. We only share your information in the following circumstances:

*   **Service Providers:** We may share information with third-party service providers who assist us in operating our services (e.g., cloud hosting, data analytics services). These providers may only process your data according to our instructions.
*   **Legal Requirements:** We may disclose your information if required by law or in response to valid legal processes (such as court orders or subpoenas).
*   **Business Transfers:** If we are involved in a merger, acquisition, or asset sale, your information may be transferred as part of that transaction.

## 4. Your Rights

You have the following rights:

*   **Access and Correction:** You can view and edit your personal profile within the App's settings.
*   **Deletion:** You can request the deletion of your account and related data. Please note that some data may be retained for a period due to legal requirements or backup purposes.
*   **Withdraw Consent:** You can withdraw your consent for us to process your data at any time (e.g., stop receiving marketing emails).

## 5. Data Security

We take reasonable security measures to protect your information from unauthorized access, loss, or misuse. However, please note that no method of internet transmission or electronic storage is 100% secure.

## 6. Children's Privacy

The App is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you discover that your child has provided us with personal information, please contact us, and we will take steps to delete that information.

## 7. Policy Changes

We may update this Privacy Policy from time to time. We will notify you of any significant changes via the App or email. We recommend that you review this page periodically for the latest information.

## 8. Contact Us

If you have any questions about this Privacy Policy, please contact us at:

*   Email: support@bestversion.app
`;

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
