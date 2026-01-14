export const TRANSLATIONS = {
  'en': {
    common: {
      appName: "Best Version",
      save: "Save",
      cancel: "Cancel",
      processing: "Processing...",
      loading: "Loading...",
      error: "Error",
      delete: "Delete",
      update: "Update",
      close: "Close",
      reset: "Reset",
      untitled: "Untitled",
      or: "OR"
    },
    nav: {
      home: "Home",
      settings: "Settings",
      add: "Add"
    },
    dashboard: {
      title: "Good Morning",
      subtitle: "Here is your daily summary.",
      spent: "Daily Spend",
      calories: "Calories",
      weekly: "Activity Trends",
      recent: "Recent",
      noEntries: "No entries yet.",
      tapToStart: "Tap + to track something.",
      strict: "Strict",
      conservative: "Conservative",
      unitCal: "kcal",
      unitCurrency: "$",
      editEntry: "Edit Entry",
      confirmDelete: "Are you sure you want to delete this entry?",
      deleteWarning: "This action cannot be undone.",
      vintageDelete: {
        title: "VOID ENTRY?",
        message: "Are you sure you want to rip this page out of your journal?",
        keep: "KEEP IT",
        destroy: "DESTROY"
      },
      timeRange: {
        today: "Today",    // 新增
        week: "7 Days",
        month: "Month",
        quarter: "Quarter", // 新增
        year: "Year"
      },
      insights: {
        title: "AI Insights",
        spendingRise: "You've spent {percent}% more on '{usage}' categories this month compared to last.",
        spendingFall: "Great job! You've reduced '{usage}' spending by {percent}% compared to last month.",
        proteinLow: "Protein intake is averaging low ({amount}g/day). Consider adding more lean meats or beans.",
        proteinGood: "Excellent protein intake! You are averaging {amount}g per day.",
        generalTip: "Keep tracking your daily habits to unlock personalized insights.",
      },
      reports: {
        overview: "Overview",
        expense: "Finance",
        diet: "Diet",
        categoryDist: "Spending by Category",
        usageDist: "Needs vs Wants",
        macroDist: "Macronutrients",
        noData: "Not enough data for analysis"
      }
    },
    addEntry: {
      title: "New Entry",
      subtitle: "Snap a photo to track instantly.",
      tapToCapture: "Tap to Capture",
      or: "OR",
      manual: "Enter Manually",
      analyzingTitle: "Analyzing...",
      analyzingDesc: "Identifying food and checking prices.",
      reviewTitle: "Review Entry",
      type: "Record Type",
      itemName: "Item Name",
      category: "Category",
      paymentMethod: "Payment",
      usage: "Purpose",
      cost: "Cost ($)",
      calories: "Calories (kcal)",
      nutrition: "Nutrition",
      protein: "Protein",
      carbs: "Carbs",
      fat: "Fat",
      date: "Date",
      note: "Note / AI Insight",
      aiInsight: "AI Insight:",
      detectedRange: "Detected Range:",
      saveEntry: "Save Entry",
      analysisFailed: "Analysis failed. Please try again or enter manually.",
      entrySaved: "Entry saved!",
      modeStrict: "Strict (Max)",
      modeConservative: "Conservative (Min)"
    },
    entryTypes: {
      combined: "Both",
      expense: "Expense",
      diet: "Diet"
    },
    categories: {
      food: "Food",
      transport: "Transport",
      shopping: "Shopping",
      entertainment: "Fun",
      bills: "Bills",
      other: "Other"
    },
    paymentMethods: {
      cash: "Cash",
      card: "Card",
      mobile: "Mobile"
    },
    usage: {
      must: "Must",
      need: "Need",
      want: "Want",
      mustDesc: "Survival / Obligations",
      needDesc: "Efficiency / Quality of Life",
      wantDesc: "Desire / Luxury"
    },
    settings: {
      title: "Settings",
      account: "Account Settings",
      signIn: "Sign In / Register",
      signOut: "Sign Out",
      logoutWarning: "A write operation is in progress. Please wait for it to complete.",
      authDesc: "Sign in to sync your records to the cloud, ensuring data safety and cross-device access.",
      language: "Language",
      languageDesc: "Choose your preferred interface language.",
      theme: "Theme",
      themeDesc: "Choose your visual style.",
      themeDefault: "Modern Bento",
      themeVintage: "Vintage Journal",
      standard: "Recording Standard",
      standardDesc: "When AI detects a range of values (e.g., 500-600 calories), how should we record it automatically?",
      strict: "Strict (Recommended)",
      strictDesc: "Records the maximum detected value. Best for ensuring you don't underestimate calorie intake.",
      conservative: "Conservative",
      conservativeDesc: "Records the minimum detected value.",
      about: "About",
      poweredBy: "Powered by Google Gemini",
      privacyPolicy: "Privacy Policy"
    },
    auth: {
      loginTitle: "Welcome Back",
      registerTitle: "Create Account",
      namePlaceholder: "Your Name",
      emailPlaceholder: "Email",
      passwordPlaceholder: "Password",
      loginBtn: "Sign In",
      registerBtn: "Sign Up",
      toRegister: "Don't have an account? Sign Up",
      toLogin: "Already have an account? Sign In",
      errorEmail: "Invalid email format",
      errorCredential: "Wrong email or password",
      errorInUse: "Email already in use",
      errorWeak: "Password too weak (min 6 chars)",
      errorNetwork: "Network error"
    }
  },
  'zh-TW': {
    common: {
      appName: "最好版本的自己",
      save: "儲存",
      cancel: "取消",
      processing: "處理中...",
      loading: "載入中...",
      error: "錯誤",
      delete: "刪除",
      update: "更新",
      close: "關閉",
      reset: "重設",
      untitled: "未命名",
      or: "或"
    },
    nav: {
      home: "首頁",
      settings: "設定",
      add: "新增"
    },
    dashboard: {
      title: "早安",
      subtitle: "這是您的今日摘要。",
      spent: "今日支出",
      calories: "今日熱量",
      weekly: "活動趨勢",
      recent: "最近紀錄",
      noEntries: "尚無紀錄",
      tapToStart: "點擊 + 按鈕開始紀錄",
      strict: "偏重口",
      conservative: "偏清淡",
      unitCal: "大卡",
      unitCurrency: "$",
      editEntry: "編輯紀錄",
      confirmDelete: "確定要刪除這筆紀錄嗎？",
      deleteWarning: "此動作無法復原。",
      vintageDelete: {
        title: "作廢此頁？",
        message: "確定要將這頁從手帳中撕下嗎？",
        keep: "保留",
        destroy: "銷毀"
      },
      timeRange: {
        today: "本日",      // 新增
        week: "近7日",
        month: "本月",
        quarter: "本季",    // 新增
        year: "今年"
      },
      insights: {
        title: "AI 洞察",
        spendingRise: "本月在「{usage}」類別的支出比上個月增加了 {percent}%。",
        spendingFall: "做得好！本月在「{usage}」類別的支出比上個月減少了 {percent}%。",
        proteinLow: "最近蛋白質攝取偏低 (平均每日 {amount}克)。建議多補充瘦肉或豆類。",
        proteinGood: "蛋白質攝取充足！平均每日達 {amount}克。",
        generalTip: "持續紀錄您的日常習慣，以解鎖更精準的個人化分析。",
      },
      reports: {
        overview: "總覽",
        expense: "財務分析",
        diet: "飲食分析",
        categoryDist: "支出分類占比",
        usageDist: "必要 vs 想要",
        macroDist: "營養素分佈 (公克)",
        noData: "該時段資料不足以進行分析"
      }
    },
    addEntry: {
      title: "新增紀錄",
      subtitle: "拍攝照片，立即開始追蹤。",
      tapToCapture: "點擊拍照",
      or: "或",
      manual: "手動輸入",
      analyzingTitle: "分析中...",
      analyzingDesc: "正在識別食物與查詢價格...",
      reviewTitle: "確認紀錄",
      type: "紀錄類型",
      itemName: "項目名稱",
      category: "分類",
      paymentMethod: "支付方式",
      usage: "用途分類",
      cost: "花費 ($)",
      calories: "熱量 (大卡)",
      nutrition: "營養成分",
      protein: "蛋白質",
      carbs: "碳水",
      fat: "脂肪",
      date: "日期",
      note: "備註 / AI 分析",
      aiInsight: "AI 分析觀點：",
      detectedRange: "偵測範圍：",
      saveEntry: "儲存紀錄",
      analysisFailed: "分析失敗，請重試或手動輸入。",
      entrySaved: "紀錄已儲存！",
      modeStrict: "偏重口 (最大值)",
      modeConservative: "偏清淡 (最小值)"
    },
    entryTypes: {
      combined: "完整紀錄",
      expense: "純記帳",
      diet: "純飲食"
    },
    categories: {
      food: "餐飲",
      transport: "交通",
      shopping: "購物",
      entertainment: "娛樂",
      bills: "帳單",
      other: "其他"
    },
    paymentMethods: {
      cash: "現金",
      card: "信用卡",
      mobile: "行動支付"
    },
    usage: {
      must: "必須",
      need: "需要",
      want: "想要",
      mustDesc: "生存 / 必要義務",
      needDesc: "效率 / 生活品質",
      wantDesc: "慾望 / 娛樂享受"
    },
    settings: {
      title: "設定",
      account: "帳號設定",
      signIn: "登入 / 註冊",
      signOut: "登出",
      logoutWarning: "正在寫入資料，請稍後再登出。",
      authDesc: "登入以將您的紀錄同步到雲端，確保資料安全且跨裝置存取。",
      language: "語言",
      languageDesc: "選擇您偏好的介面語言。",
      theme: "介面風格",
      themeDesc: "選擇您喜歡的視覺風格。",
      themeDefault: "現代便當盒",
      themeVintage: "復古手帳風",
      standard: "紀錄標準",
      standardDesc: "當 AI 偵測到數值區間（例如 500-600 大卡）時，自動紀錄的標準。",
      strict: "偏重口（推薦）",
      strictDesc: "紀錄偵測到的最大值。適合重口味、或不想低估熱量攝取的你。",
      conservative: "偏清淡",
      conservativeDesc: "紀錄偵測到的最小值。適合清淡飲食者。",
      about: "關於",
      poweredBy: "Powered by Google Gemini",
      privacyPolicy: "隱私權政策"
    },
    auth: {
      loginTitle: "登入帳號",
      registerTitle: "註冊新帳號",
      namePlaceholder: "您的暱稱",
      emailPlaceholder: "電子信箱",
      passwordPlaceholder: "密碼",
      loginBtn: "登入",
      registerBtn: "註冊",
      toRegister: "還沒有帳號？點此註冊",
      toLogin: "已有帳號？點此登入",
      errorEmail: "Email 格式錯誤",
      errorCredential: "帳號或密碼錯誤",
      errorInUse: "Email 已被註冊",
      errorWeak: "密碼強度不足 (至少6字)",
      errorNetwork: "網路連線失敗"
    }
  }
};