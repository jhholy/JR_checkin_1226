import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabase';

describe('Supabase Function Verification', () => {
  const TEST_MARK = `verify_test_${Date.now()}`;

  beforeEach(async () => {
    // Clean up any existing test data
    await supabase.rpc('cleanup_test_data', { test_mark: TEST_MARK });
  });

  describe('initialize_test_environment', () => {
    it('should initialize environment with JSONB parameter', async () => {
      const { data, error } = await supabase.rpc(
        'initialize_test_environment',
        { test_mark: TEST_MARK }
      );
      
      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: true,
        message: 'Test environment initialized successfully',
        test_mark: TEST_MARK
      });
    });

    it('should reject null test_mark', async () => {
      const { error } = await supabase.rpc(
        'initialize_test_environment',
        { test_mark: null }
      );
      
      expect(error).toBeDefined();
      expect(error?.message).toContain('test_mark parameter cannot be null');
    });

    it('should create required indexes', async () => {
      // Initialize to ensure indexes
      await supabase.rpc('initialize_test_environment', { test_mark: TEST_MARK });

      // Query indexes directly
      const { data: memberIndexes, error: memberError } = await supabase
        .from('pg_indexes')
        .select('indexname')
        .eq('indexname', 'idx_members_test_mark')
        .single();

      const { data: checkinIndexes, error: checkinError } = await supabase
        .from('pg_indexes')
        .select('indexname')
        .eq('indexname', 'idx_checkins_test_mark')
        .single();

      expect(memberError).toBeNull();
      expect(checkinError).toBeNull();
      expect(memberIndexes).toBeDefined();
      expect(checkinIndexes).toBeDefined();
    });
  });

  describe('cleanup_test_data', () => {
    it('should clean up test data with JSONB parameter', async () => {
      // Create test member
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert([{
          name: 'Test User',
          email: `test_${TEST_MARK}@test.com`,
          member_type: 'regular',
          test_mark: TEST_MARK
        }])
        .select()
        .single();

      expect(memberError).toBeNull();
      expect(member).toBeDefined();

      // Clean up
      const { data, error } = await supabase.rpc(
        'cleanup_test_data',
        { test_mark: TEST_MARK }
      );
      
      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: true,
        message: 'Test data cleaned up successfully',
        test_mark: TEST_MARK
      });

      // Verify cleanup
      const { data: remaining, error: checkError } = await supabase
        .from('members')
        .select()
        .eq('test_mark', TEST_MARK);

      expect(checkError).toBeNull();
      expect(remaining).toHaveLength(0);
    });

    it('should reject null test_mark', async () => {
      const { error } = await supabase.rpc(
        'cleanup_test_data',
        { test_mark: null }
      );
      
      expect(error).toBeDefined();
      expect(error?.message).toContain('test_mark parameter cannot be null');
    });
  });
});
