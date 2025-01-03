import { supabase } from '../../../lib/supabase';
import { TestCheckInParams, TestCheckInResult } from '../../types/checkIn';

/**
 * 创建测试签到记录
 * @param params 签到参数
 * @returns 创建结果
 */
export const createTestCheckIn = async (params: TestCheckInParams): Promise<TestCheckInResult> => {
  const { 
    memberId, 
    classType, 
    checkInDate = new Date().toISOString(), 
    isExtra = false,
    test_mark
  } = params;

  if (!test_mark) {
    return {
      checkIn: null,
      success: false,
      error: '必须提供test_mark'
    };
  }

  try {
    // 验证会员是否存在且属于当前测试
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('id', memberId)
      .eq('test_mark', test_mark)
      .single();

    if (memberError || !member) {
      return {
        checkIn: null,
        success: false,
        error: '会员不存在或不属于当前测试'
      };
    }

    // 创建签到记录
    const { data, error } = await supabase
      .from('checkins')
      .insert({
        member_id: memberId,
        class_type: classType,
        check_in_date: checkInDate,
        is_extra: isExtra,
        test_mark: test_mark // 使用相同的test_mark
      })
      .select()
      .single();

    if (error) {
      return {
        checkIn: null,
        success: false,
        error: error.message
      };
    }

    return {
      checkIn: data,
      success: true
    };
  } catch (error) {
    console.error('Failed to create test check-in:', error);
    return {
      checkIn: null,
      success: false,
      error: error instanceof Error ? error.message : '创建签到记录失败'
    };
  }
};

/**
 * 获取测试签到记录
 * @param test_mark 测试标记
 * @returns 测试签到记录列表
 */
export const getTestCheckIns = async (test_mark: string) => {
  if (!test_mark) {
    throw new Error('必须提供test_mark');
  }

  try {
    const { data, error } = await supabase
      .from('checkins')
      .select(`
        *,
        members!inner (
          id,
          name,
          email,
          membership,
          remaining_classes,
          membership_expiry,
          is_new_member,
          test_mark
        )
      `)
      .eq('test_mark', test_mark)
      .eq('members.test_mark', test_mark);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get test check-ins:', error);
    throw error;
  }
};

/**
 * 清理特定测试标记的签到记录
 * @param test_mark 测试标记
 */
export const cleanupTestCheckIns = async (test_mark: string) => {
  if (!test_mark) {
    throw new Error('必须提供test_mark');
  }

  try {
    // 删除签到记录
    const { error: checkInError } = await supabase
      .from('checkins')
      .delete()
      .eq('test_mark', test_mark);

    if (checkInError) {
      throw checkInError;
    }

    console.log(`已清理测试标记 ${test_mark} 的签到记录`);
  } catch (error) {
    console.error('清理测试签到记录失败:', error);
    throw error;
  }
};
