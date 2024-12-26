import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckIn, ClassType } from '../types/database';
import { useAuth } from './useAuth';

interface FetchFilters {
  startDate?: string;
  endDate?: string;
  classType?: ClassType;
  isExtra?: boolean;
  memberId?: string;
  memberName?: string;
  limit?: number;
}

export function useCheckInRecords(initialFilters?: FetchFilters) {
  const [records, setRecords] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRecords = async (filters?: FetchFilters) => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('check_ins')
        .select(`
          *,
          member:members (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.memberName) {
        // Use ilike for case-insensitive partial matching
        query = query.ilike('member.name', `%${filters.memberName}%`);
      }

      if (filters?.startDate) {
        query = query.gte('check_in_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('check_in_date', filters.endDate);
      }

      if (filters?.classType) {
        query = query.eq('class_type', filters.classType);
      }

      if (filters?.isExtra !== undefined) {
        query = query.eq('is_extra', filters.isExtra);
      }

      if (filters?.memberId) {
        query = query.eq('member_id', filters.memberId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setRecords(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch check-in records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(initialFilters);
  }, [user]);

  return { records, loading, error, fetchRecords };
}