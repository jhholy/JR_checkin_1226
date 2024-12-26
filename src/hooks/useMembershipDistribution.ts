```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MembershipType } from '../types/database';

interface MembershipData {
  type: MembershipType;
  count: number;
}

export function useMembershipDistribution() {
  const [data, setData] = useState<MembershipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDistribution() {
      try {
        const { data: members, error: fetchError } = await supabase
          .from('members')
          .select('membership');

        if (fetchError) throw fetchError;

        // Count memberships
        const counts = new Map<MembershipType, number>();
        members?.forEach(member => {
          if (member.membership) {
            counts.set(
              member.membership,
              (counts.get(member.membership) || 0) + 1
            );
          }
        });

        // Convert to array
        const distribution: MembershipData[] = Array.from(counts.entries())
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count);

        setData(distribution);

      } catch (err) {
        console.error('Failed to fetch membership distribution:', err);
        setError('获取数据失败，请重试。Failed to fetch data, please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchDistribution();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDistribution, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}
```