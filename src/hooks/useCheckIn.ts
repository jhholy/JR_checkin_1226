import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckInFormData } from '../types/database';
import { messages } from '../utils/messageUtils';
import { findMemberForCheckIn } from '../utils/member/search';
import { checkInLogger } from '../utils/logger/checkIn';
import { logger } from '../utils/logger/core';

interface CheckInResult {
  success: boolean;
  isExtra?: boolean;
  message: string;
  isDuplicate?: boolean;
  isNewMember?: boolean;
}

export function useCheckIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitCheckIn = async (formData: CheckInFormData): Promise<CheckInResult> => {
    try {
      setLoading(true);
      setError(null);

      logger.info('开始签到流程', { 
        name: formData.name, 
        email: formData.email,
        timeSlot: formData.timeSlot,
        courseType: formData.courseType
      });

      // Find member
      const result = await findMemberForCheckIn({
        name: formData.name,
        email: formData.email
      });

      logger.info('会员搜索结果', {
        result,
        is_new: result.is_new,
        member_id: result.member_id
      });

      // Handle new member registration
      if (result.is_new) {
        logger.info('注册新会员', { 
          name: formData.name,
          email: formData.email,
          timeSlot: formData.timeSlot
        });

        // 第一步：注册新会员
        const { data: registerResult, error: registerError } = await supabase
          .rpc('register_new_member', {
            p_name: formData.name,
            p_email: formData.email,
            p_time_slot: formData.timeSlot,
            p_is_private: formData.courseType === 'private',
            p_trainer_id: formData.courseType === 'private' ? formData.trainerId : null,
            p_is_1v2: formData.courseType === 'private' ? formData.is1v2 : false
          });

        if (registerError) {
          logger.error('新会员注册失败', { 
            error: registerError,
            details: registerError.details,
            hint: registerError.hint
          });
          // 不直接抛出错误，而是返回错误结果
          return {
            success: false,
            message: registerError.message || '新会员注册失败，请重试。New member registration failed, please try again.',
            isNewMember: true
          };
        }

        if (!registerResult) {
          logger.error('新会员注册结果无效');
          return {
            success: false,
            message: '新会员注册失败，请重试。New member registration failed, please try again.',
            isNewMember: true
          };
        }

        logger.info('新会员注册成功', registerResult);
        
        // 新会员注册时已经创建了签到记录,直接返回结果
        return {
          success: true,
          isExtra: true,
          isNewMember: true,
          message: messages.newMember
        };
      }

      // Handle existing member check-in
      if (!result.member_id) {
        logger.error('会员查找结果异常', { 
          result,
          formData 
        });
        throw new Error('会员查找结果异常');
      }

      // Log check-in attempt
      logger.info('尝试签到', {
        member_id: result.member_id,
        timeSlot: formData.timeSlot,
        courseType: formData.courseType
      });

      // Proceed with check-in
      const { data: checkIn, error: checkInError } = await supabase
        .from('check_ins')
        .insert([{
          member_id: result.member_id,
          check_in_date: new Date().toISOString().split('T')[0],
          is_private: formData.courseType === 'private',
          trainer_id: formData.courseType === 'private' ? formData.trainerId : null,
          time_slot: formData.timeSlot,
          is_1v2: formData.courseType === 'private' ? formData.is1v2 : false
        }])
        .select('is_extra, members(is_new_member)')
        .single();

      if (checkInError) {
        logger.error('签到错误', { 
          error: checkInError,
          code: checkInError.code,
          hint: checkInError.hint,
          details: checkInError.details,
          message: checkInError.message
        });
        
        // Handle duplicate check-in
        if (checkInError.hint === 'duplicate_checkin' || 
            checkInError.message?.includes('Already checked in for this class type today')) {
          return {
            success: false,
            message: messages.checkIn.duplicateCheckIn,
            isDuplicate: true
          };
        }

        throw checkInError;
      }

      // Ensure checkIn exists
      if (!checkIn) {
        throw new Error('签到记录创建失败');
      }

      logger.info('签到成功', { 
        checkIn,
        isExtra: checkIn.is_extra,
        isNewMember: checkIn.members?.is_new_member,
        member_id: result.member_id
      });

      // Return result based on is_extra flag and class type
      const checkInResult = {
        success: true,  // Both normal and extra check-ins are considered successful
        isExtra: checkIn.is_extra,
        isNewMember: checkIn.members?.is_new_member,
        message: checkIn.is_extra 
          ? (formData.courseType === 'private' 
             ? messages.checkIn.extraCheckInPrivate 
             : messages.checkIn.extraCheckInGroup)
          : messages.checkIn.success
      };

      logger.info('签到结果', checkInResult);
      return checkInResult;

    } catch (err) {
      const errorDetails = {
        error: err instanceof Error ? err.message : 'Unknown error',
        name: formData.name,
        timeSlot: formData.timeSlot,
        courseType: formData.courseType,
        trainerId: formData.trainerId,
        is1v2: formData.is1v2,
        stack: err instanceof Error ? err.stack : undefined,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
      };
      
      console.error('签到失败详细信息:', errorDetails);
      logger.error('签到失败', errorDetails);
      
      let errorMessage: string;
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = (err as any).message || messages.checkIn.error;
      } else {
        errorMessage = messages.checkIn.error;
      }
      
      setError(errorMessage);
      
      // 确保返回有效的CheckInResult
      return {
        success: false,
        message: errorMessage,
        isNewMember: result?.is_new
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    submitCheckIn,
    loading,
    error
  };
}