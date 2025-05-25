// hooks/use-transactions.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Transaction } from '@/types/transaction';

interface UseTransactionsResult {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTransactions(limit: number = 10): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.transactions.getAll();
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      // Check if data exists and is an object
      if (response.data && typeof response.data === 'object' && 'transactions' in response.data) {
        // Limit the number of transactions if needed
        const fetchedTransactions = response.data.transactions || [];
        setTransactions(fetchedTransactions.slice(0, limit));
      } else {
        // Handle case where transactions property doesn't exist
        setTransactions([]);
        console.warn("API response didn't include expected 'transactions' property:", response.data);
      }
    } catch (err) {
      setError("Failed to load transactions. Please try again.");
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [limit]);

  return { transactions, isLoading, error, refetch: fetchTransactions };
}

// Hook for fetching user-specific transactions
export function useUserTransactions(userId: number): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserTransactions = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // This endpoint should be implemented in your API client
      // If it doesn't exist, you'll need to add it
      const response = await api.transactions.getByUserId(userId);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      // Check if data exists and is an object
      if (response.data && typeof response.data === 'object' && 'transactions' in response.data) {
        setTransactions(response.data.transactions || []);
      } else {
        setTransactions([]);
        console.warn("API response didn't include expected 'transactions' property:", response.data);
      }
    } catch (err) {
      setError("Failed to load user transactions. Please try again.");
      console.error("Error fetching user transactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTransactions();
  }, [userId]);

  return { transactions, isLoading, error, refetch: fetchUserTransactions };
}