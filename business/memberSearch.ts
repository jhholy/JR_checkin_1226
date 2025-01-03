import { supabase } from '../lib/supabase';

interface SearchMemberResult {
  found: boolean;
  member?: any;
  needsEmail?: boolean;
  error?: string;
  partialMatches?: any[];
}

export async function searchMember(
  name: string,
  testMark?: string,
  email?: string,
  includePartial: boolean = false
): Promise<SearchMemberResult> {
  try {
    // Trim whitespace
    name = name.trim();

    // Basic validation
    if (!name) {
      return {
        found: false,
        error: '请输入会员姓名 / Please enter member name'
      };
    }

    // Build query
    let query = supabase
      .from('members')
      .select('*')
      .ilike('name', name);

    if (testMark) {
      query = query.eq('test_mark', testMark);
    }

    const { data: members, error } = await query;

    if (error) {
      throw error;
    }

    // No members found
    if (!members || members.length === 0) {
      if (!includePartial) {
        return {
          found: false,
          error: '会员不存在 / Member not found'
        };
      }

      // Try partial match
      const { data: partialMatches } = await supabase
        .from('members')
        .select('*')
        .ilike('name', `%${name}%`)
        .eq('test_mark', testMark || '');

      return {
        found: false,
        partialMatches: partialMatches || [],
        error: '未找到完全匹配 / No exact matches found'
      };
    }

    // Single member found
    if (members.length === 1) {
      return {
        found: true,
        member: members[0]
      };
    }

    // Multiple members found
    if (!email) {
      return {
        found: false,
        needsEmail: true,
        error: '需要邮箱验证 / Email verification required'
      };
    }

    // Find member with matching email
    const member = members.find(m => m.email === email);
    if (!member) {
      return {
        found: false,
        needsEmail: true,
        error: '邮箱验证失败 / Email verification failed'
      };
    }

    return {
      found: true,
      member
    };
  } catch (error: any) {
    return {
      found: false,
      error: `搜索失败: ${error.message} / Search failed: ${error.message}`
    };
  }
}
