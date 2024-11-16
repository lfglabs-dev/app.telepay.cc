import { Transaction } from '@/types/transaction';

const STORAGE_KEY = 'telepay_transactions';

export function getStoredTransactions(): Transaction[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function addTransaction(transaction: Transaction): void {
    const transactions = getStoredTransactions();
    transactions.unshift(transaction); // Add to beginning of array
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
} 