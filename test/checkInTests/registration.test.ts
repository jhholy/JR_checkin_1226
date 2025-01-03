import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { registerNewMember } from '../../../utils/business/registration';
// Removed unused import
import { initializeTestData } from '../helpers/testData';
import { cleanupTestData } from '../helpers/testData';
import { supabase } from '../../../lib/supabase';

describe('Registration Tests', () => {
  let testMark: string;

  beforeAll(async () => {
    const result = await initializeTestData();
    testMark = result.testMark;
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (testMark) {
      await cleanupTestData(testMark);
    }
  });

  describe('Error Handling', () => {
    it('should handle empty name', async () => {
      try {
        await registerNewMember({
          test_mark: testMark,
          name: '',
          email: 'test@example.com'
        });
        throw new Error('Should not allow empty name');
      } catch (error: any) {
        expect(error.message).toContain('姓名不能为空');
      }
    });

    it('should handle special characters in name', async () => {
      const result = await registerNewMember({
        test_mark: testMark,
        name: '李四@#$',
        email: 'special.chars@example.com'
      });
      expect(result.status).toBe('error');
      expect(result.message).toContain('姓名包含非法字符');
    });

    it('should validate email format', async () => {
      try {
        await registerNewMember({
          test_mark: testMark,
          name: '新会员',
          email: 'invalid.email'
        });
        throw new Error('Should not allow invalid email');
      } catch (error: any) {
        expect(error.message).toContain('邮箱格式不正确');
      }
    });
  });

  it('should prompt check-in page for existing member name', async () => {
    const result = await registerNewMember({
      test_mark: testMark,
      name: '王五',
      email: 'wang.wu.new@example.com'
    });
    expect(result.status).toBe('existing');
    expect(result.message).toContain('已存在会员');
  });

  it('should successfully register new member', async () => {
    const newMemberName = '新会员' + Date.now();
    const result = await registerNewMember({
      test_mark: testMark,
      name: newMemberName,
      email: `new.member.${Date.now()}@example.com`
    });
    expect(result.status).toBe('success');
    expect(result.member_id).toBeTruthy();

    // Verify member was created
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('name', newMemberName)
      .eq('test_mark', testMark)
      .single();

    expect(member).toBeTruthy();
    expect(member.is_new_member).toBe(true);
  });
});
