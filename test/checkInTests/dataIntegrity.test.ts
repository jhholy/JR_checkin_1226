import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { checkIn } from '../../../utils/business/checkIn';
import { CheckInParams } from '../../../types/checkIn';
import { initializeTestData } from '../helpers/testData';
import { cleanupTestCheckIns } from '../helpers/checkInHelpers';
import { supabase } from '../../../lib/supabase';

describe('Data Integrity Tests', () => {
  let testMark: string;

  beforeAll(async () => {
    const result = await initializeTestData();
    testMark = result.testMark;
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (testMark) {
      await cleanupTestCheckIns(testMark);
    }
  });

  it('should save check-in records correctly', async () => {
    const params: CheckInParams = {
      name: '王五',
      classType: 'muaythai',
      test_mark: testMark
    };
    const checkInResult = await checkIn(params);

    // Verify check-in record
    const { data: record } = await supabase
      .from('checkins')
      .select('*')
      .eq('id', checkInResult.id)
      .single();

    expect(record).toBeTruthy();
    expect(record.member_id).toBe(checkInResult.member_id);
    expect(record.class_type).toBe('muaythai');
    expect(record.is_extra).toBe(checkInResult.is_extra);
    expect(record.test_mark).toBe(testMark);
  });

  it('should mark check-in type correctly', async () => {
    // First check-in
    const result1 = await checkIn({
      test_mark: testMark,
      name: '李四',
      classType: 'muaythai'
    });
    expect(result1.is_extra).toBe(false);

    // Second check-in
    const result2 = await checkIn({
      test_mark: testMark,
      name: '李四',
      classType: 'boxing'
    });
    expect(result2.is_extra).toBe(true);

    // Verify both records
    const { data: records } = await supabase
      .from('checkins')
      .select('*')
      .eq('member_id', result1.member_id)
      .eq('test_mark', testMark);

    expect(records).toHaveLength(2);
    expect(records?.find(r => r.id === result1.id)?.is_extra).toBe(false);
    expect(records?.find(r => r.id === result2.id)?.is_extra).toBe(true);
  });

  it('should update class count correctly', async () => {
    // Get initial class count
    const { data: initialMember } = await supabase
      .from('members')
      .select('remaining_classes')
      .eq('name', '李四')
      .eq('test_mark', testMark)
      .single();

    const initialClasses = initialMember?.remaining_classes || 0;

    // Perform check-in
    await checkIn({
      test_mark: testMark,
      name: '李四',
      classType: 'muaythai'
    });

    // Verify class count decreased
    const { data: updatedMember } = await supabase
      .from('members')
      .select('remaining_classes')
      .eq('name', '李四')
      .eq('test_mark', testMark)
      .single();

    expect(updatedMember?.remaining_classes).toBe(initialClasses - 1);
  });
});
