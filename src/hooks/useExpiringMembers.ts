import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Member {
  id: number;
  name: string;
  membership_type: string;
  expiry_date: string;
}

export const useExpiringMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchExpiringMembers = async () => {
      try {
        setLoading(true);
        
        // 获取30天内到期的会员
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const { data, error: membersError } = await supabase
          .from('members')
          .select('id, name, membership, membership_expiry')
          .lt('membership_expiry', thirtyDaysFromNow.toISOString())
          .gt('membership_expiry', new Date().toISOString())
          .order('membership_expiry');

        if (membersError) throw membersError;

        setMembers(data?.map(member => ({
          id: member.id,
          name: member.name,
          membership_type: member.membership,
          expiry_date: member.membership_expiry,
        })) || []);

      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpiringMembers();
  }, []);

  return { members, loading, error };
};