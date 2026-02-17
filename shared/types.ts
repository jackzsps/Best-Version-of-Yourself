// shared/types.ts

// ❌ 移除這行！這是導致 React Native 崩潰的元兇 (Web SDK)
// import { Timestamp } from 'firebase/firestore';

// ✅ 定義一個通用的 Timestamp 介面 (Duck Typing)
// 這樣無論是 Web SDK 還是 Native SDK 的 Timestamp 物件都能相容
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date; // 選擇性加入，方便轉換為 Date 物件
}

export enum RecordMode {
  STRICT = 'STRICT',       // Max values
  CONSERVATIVE = 'CONSERVATIVE' // Min values
}

export type Language = 'en' | 'zh-TW';
export type Theme = 'default' | 'vintage';

export type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'other';
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

export interface Entry {
  id: string;
  // 👇 這裡改用通用介面，不再依賴具體的 SDK 類別
  date: FirestoreTimestamp;
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
}

export type Tab = 'dashboard' | 'add' | 'settings';

// Subscription Types
export type SubscriptionStatus = 'trial' | 'pro' | 'basic';

export interface UserSubscription {
  status: SubscriptionStatus;
  // 👇 這裡也改用通用介面
  expiryDate?: FirestoreTimestamp; 
}