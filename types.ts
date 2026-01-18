
export type TransactionType = 'income' | 'expense';
export type Language = 'en' | 'bn';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface UserProfile {
  name: string;
  currency: string;
  language: Language;
  syncId?: string;
  lastSync?: string;
}

export interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: Record<string, number>;
}

export const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other'],
  expense: ['Food', 'Rent', 'Utilities', 'Entertainment', 'Transport', 'Shopping', 'Health', 'Travel', 'Other']
};
