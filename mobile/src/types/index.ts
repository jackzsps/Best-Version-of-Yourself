// 手動複製 shared/types.ts 內容，避免引用路徑問題
// React Native 對於 monorepo 的 symlink 支援有時會有問題，直接複製最穩妥

export enum RecordMode {
  STRICT = 'STRICT', // Max values
  CONSERVATIVE = 'CONSERVATIVE', // Min values
}

export type Language = 'en' | 'zh-TW';
export type Theme = 'default' | 'vintage';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'other';
export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type UsageCategory = 'must' | 'need' | 'want';
export type EntryType = 'combined' | 'expense' | 'diet';

export interface RangeValue {
  min: number;
  max: number;
}

export interface Macros {
  protein: RangeValue;
  carbs: RangeValue;
  fat: RangeValue;
}

export interface AnalysisResult {
  isFood: boolean;
  isExpense: boolean;
  recordType: EntryType; // AI suggested record type
  itemName: string;
  category: ExpenseCategory;
  usage: UsageCategory;
  cost: number | null; // In local currency
  calories: RangeValue | null;
  macros: Macros | null;
  reasoning: string;
}

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface Entry {
  id: string;
  date: FirestoreTimestamp | any; // Allow 'any' for Firebase Timestamp object compatibility
  imageUrl?: string | null;
  note?: string | null;
  itemName: string;
  type: EntryType;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  usage: UsageCategory;
  cost: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  modeUsed: RecordMode;
  isSyncing?: boolean; // Mobile specific
}

export type Tab = 'dashboard' | 'add' | 'settings';

export type SubscriptionStatus = 'trial' | 'pro' | 'basic';

export interface UserSubscription {
  status: SubscriptionStatus;
  expiryDate?: FirestoreTimestamp; // Use timestamp for expiry
  productId?: string;
  transactionId?: string;
  purchaseDate?: number; // timestamp ms
  originalTransactionIdIOS?: string;
}

// Add these new types for React Navigation v7
export type RootStackParamList = {
  MainTabs: undefined;
  PrivacyPolicy: undefined;
};

export type TabParamList = {
  Home: undefined;
  Add: undefined;
  Settings: undefined;
};