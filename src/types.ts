import { Timestamp } from 'firebase/firestore';

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
// 1. 新增這個定義，方便管理
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}



export interface Entry {
  id: string;

  
  //timestamp: number;
  //date: Timestamp; // Added date field for Firestore queries
  // 🔴 刪除這行: timestamp: number;
  // 🟢 改成這行:
  date: FirestoreTimestamp;
  //imageUrl?: string;
// 🟢 修改這兩行，明確允許 null (這樣跟 AddEntry 的 || null 才能配合)
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
  //note?: string;
}

export type Tab = 'dashboard' | 'add' | 'settings';