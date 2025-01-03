import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { searchMember } from '../../business/memberSearch';
import { initializeTestData, cleanupTestData } from '../helpers/testData';
import { supabase } from '../../../lib/supabase';

describe('Member Search Tests', () => {
  let testMark: string;

  beforeAll(async () => {
    const result = await initializeTestData();
    testMark = result.testMark;
  });

  afterAll(async () => {
    if (testMark) {
      await cleanupTestData(testMark);
    }
  });

  describe('Exact Match Tests', () => {
    it('should find member by exact name match', async () => {
      const result = await searchMember('张三', testMark);
      expect(result.found).toBe(true);
      expect(result.member?.name).toBe('张三');
    });

    it('should verify member by email when duplicate names exist', async () => {
      const result = await searchMember('王小明', testMark, 'wang.xm1.test.mt@example.com');
      expect(result.found).toBe(true);
      expect(result.member?.email).toBe('wang.xm1.test.mt@example.com');
    });
  });

  describe('Special Cases', () => {
    it('should handle non-existent members', async () => {
      const result = await searchMember('不存在的会员', testMark);
      expect(result.found).toBe(false);
      expect(result.error).toContain('会员不存在');
      expect(result.error).toContain('Member not found');
    });

    it('should require email for duplicate names', async () => {
      const result = await searchMember('王小明', testMark);
      expect(result.needsEmail).toBe(true);
      expect(result.error).toContain('需要邮箱验证');
      expect(result.error).toContain('Email verification required');
    });

    it('should handle case-insensitive search', async () => {
      // Create test member with mixed case name
      const { data: member } = await supabase
        .from('members')
        .insert({
          name: 'TestMember',
          email: 'test.member@example.com',
          test_mark: testMark
        })
        .select()
        .single();

      // Search with different cases
      const lowerResult = await searchMember('testmember', testMark);
      expect(lowerResult.found).toBe(true);
      expect(lowerResult.member?.id).toBe(member.id);

      const upperResult = await searchMember('TESTMEMBER', testMark);
      expect(upperResult.found).toBe(true);
      expect(upperResult.member?.id).toBe(member.id);
    });

    it('should handle whitespace in names', async () => {
      // Create test member with spaces
      const { data: member } = await supabase
        .from('members')
        .insert({
          name: '  Spaced  Name  ',
          email: 'spaced.name@example.com',
          test_mark: testMark
        })
        .select()
        .single();

      // Search with different spacing
      const result1 = await searchMember('Spaced  Name', testMark);
      expect(result1.found).toBe(true);
      expect(result1.member?.id).toBe(member.id);

      const result2 = await searchMember('SpacedName', testMark);
      expect(result2.found).toBe(false);
    });
  });

  describe('Partial Name Matching', () => {
    it('should find members with partial name match', async () => {
      // Create test members
      await supabase.from('members').insert([
        {
          name: '张三丰',
          email: 'zhang.sf@example.com',
          test_mark: testMark
        },
        {
          name: '张三疯',
          email: 'zhang.sf2@example.com',
          test_mark: testMark
        }
      ]);

      const results = await searchMember('张三', testMark, undefined, true);
      expect(results.partialMatches?.length).toBeGreaterThanOrEqual(2);
      results.partialMatches?.forEach(member => {
        expect(member.name).toContain('张三');
      });
    });

    it('should handle no partial matches', async () => {
      const results = await searchMember('完全不存在', testMark, undefined, true);
      expect(results.found).toBe(false);
      expect(results.partialMatches?.length).toBe(0);
    });
  });

  describe('Multiple Results Handling', () => {
    it('should return all matching members when requested', async () => {
      // Create multiple test members with similar names
      await supabase.from('members').insert([
        {
          name: 'Test User 1',
          email: 'test1@example.com',
          test_mark: testMark
        },
        {
          name: 'Test User 2',
          email: 'test2@example.com',
          test_mark: testMark
        }
      ]);

      const results = await searchMember('Test User', testMark, undefined, true);
      expect(results.partialMatches?.length).toBeGreaterThanOrEqual(2);
      results.partialMatches?.forEach(member => {
        expect(member.name).toContain('Test User');
      });
    });

    it('should sort results by relevance', async () => {
      const results = await searchMember('张', testMark, undefined, true);
      expect(results.partialMatches).toBeTruthy();
      
      // Verify results are sorted (exact matches first)
      const exactMatches = results.partialMatches?.filter(m => m.name === '张');
      const partialMatches = results.partialMatches?.filter(m => m.name !== '张');
      
      if (exactMatches && partialMatches) {
        exactMatches.forEach(exact => {
          partialMatches.forEach(partial => {
            const exactIndex = results.partialMatches?.indexOf(exact);
            const partialIndex = results.partialMatches?.indexOf(partial);
            expect(exactIndex).toBeLessThan(partialIndex);
          });
        });
      }
    });
  });
});
