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
  timestamp: number;
  imageUrl?: string;
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
  note?: string;
}

export type Tab = 'dashboard' | 'add' | 'settings';