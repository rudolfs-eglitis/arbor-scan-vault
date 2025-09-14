import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserCredits {
  id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  updated_at: string;
}

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
  related_assessment_id?: string;
}

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCredits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get or create user credits
      const { data: existingCredits, error: fetchError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingCredits) {
        // Create initial credits record
        const { data: newCredits, error: createError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            balance: 0,
            lifetime_earned: 0,
            lifetime_spent: 0
          })
          .select()
          .single();

        if (createError) throw createError;
        setCredits(newCredits);
      } else {
        setCredits(existingCredits);
      }

      // Fetch transactions
      const { data: transactionData, error: transError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transError) throw transError;
      setTransactions(transactionData || []);

    } catch (error) {
      console.error('Error fetching credits:', error);
      toast.error('Failed to load credit information');
    } finally {
      setLoading(false);
    }
  };

  const spendCredits = async (amount: number, description: string, assessmentId?: string) => {
    if (!user || !credits || credits.balance < amount) {
      toast.error('Insufficient credits');
      return false;
    }

    try {
      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          transaction_type: 'spent',
          description,
          related_assessment_id: assessmentId
        });

      if (error) throw error;

      toast.success(`Spent ${amount} credits for ${description}`);
      await fetchCredits(); // Refresh credits
      return true;
    } catch (error) {
      console.error('Error spending credits:', error);
      toast.error('Failed to spend credits');
      return false;
    }
  };

  const hasCredits = (amount: number): boolean => {
    return credits ? credits.balance >= amount : false;
  };

  useEffect(() => {
    if (user) {
      fetchCredits();

      // Set up real-time subscription for credit updates
      const channel = supabase
        .channel('credit-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchCredits()
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'credit_transactions',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchCredits()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    credits,
    transactions,
    loading,
    spendCredits,
    hasCredits,
    refetch: fetchCredits
  };
};