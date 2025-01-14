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
        classType: formData.classType 
      });

      // Find member
      const result = await findMemberForCheckIn({
        name: formData.name,
        email: formData.email
      });

      logger.info('会员搜索结果', {
        result,
        needs_email: result.needs_email,
        member_id: result.member_id
      });

      // Handle member lookup results
      if (result.needs_email) {
        logger.info('需要邮箱验证', { name: formData.name });
        return {
          success: false,
          message: messages.checkIn.duplicateName,
          isDuplicate: true
        };
      }

      if (!result.member_id) {
        logger.warn('未找到会员', { 
          name: formData.name,
          searchResult: result 
        });
        return {
          success: false,
          message: messages.checkIn.memberNotFound
        };
      }

      // Log check-in attempt
      logger.info('尝试签到', {
        member_id: result.member_id,
        class_type: formData.classType
      });

      // Proceed with check-in
      const { data: checkIn, error: checkInError } = await supabase
        .from('check_ins')
        .insert([{
          member_id: result.member_id,
          class_type: formData.classType,
          check_in_date: new Date().toISOString().split('T')[0]
        }])
        .select('is_extra')
        .single();

      if (checkInError) {
        logger.error('签到错误', { 
          error: checkInError,
          code: checkInError.code,
          hint: checkInError.hint,
          details: checkInError.details,
          message: checkInError.message
        });
        
        if (checkInError.hint === 'duplicate_class') {
          return {
            success: false,
            message: messages.checkIn.duplicateCheckIn,
            isDuplicate: true
          };
        }
        throw checkInError;
      }

      logger.info('签到成功', { 
        checkIn,
        isExtra: checkIn.is_extra,
        member_id: result.member_id
      });

      const checkInResult = {
        success: true,
        isExtra: checkIn.is_extra,
        message: checkIn.is_extra ? messages.checkIn.extraCheckIn : messages.checkIn.success
      };

      logger.info('签到结果', checkInResult);
      return checkInResult;

    } catch (err) {
      const errorDetails = {
        error: err instanceof Error ? err.message : 'Unknown error',
        name: formData.name,
        classType: formData.classType,
        stack: err instanceof Error ? err.stack : undefined,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
      };
      
      console.error('签到失败详细信息:', errorDetails);
      logger.error('签到失败', errorDetails);
      
      const message = err instanceof Error ? err.message : messages.checkIn.error;
      setError(message);
      
      return {
        success: false,
        message
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