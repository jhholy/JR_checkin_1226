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

  // 根据时间段确定课程类型
  const getClassTypeFromTimeSlot = (timeSlot: string): string => {
    if (timeSlot === '09:00-10:30') {
      return 'morning';
    } else if (timeSlot === '17:00-18:30') {
      return 'evening';
    }
    // 默认返回morning
    return 'morning';
  };

  const submitCheckIn = async (formData: CheckInFormData): Promise<CheckInResult> => {
    let result;
    
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
      result = await findMemberForCheckIn({
        name: formData.name,
        email: formData.email
      });

      logger.info('会员搜索结果', {
        result,
        is_new: result.is_new,
        member_id: result.member_id
      });

      // Handle new member registration
      if (result.is_new && !result.member_id) {
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

      // 查找会员卡
      let validCardId = null;
      
      // 根据课程类型确定卡类型
      const cardType = formData.courseType === 'private' ? '私教课' : '团课';
      
      logger.info('查询会员卡', {
        member_id: result.member_id,
        card_type: cardType,
        course_type: formData.courseType
      });
      
      // 查询会员的所有卡
      const { data: cards, error: cardsError } = await supabase
        .from('membership_cards')
        .select('*')
        .eq('member_id', result.member_id)
        .eq('card_type', cardType);
      
      if (cardsError) {
        logger.error('查询会员卡失败', { error: cardsError });
      } else {
        logger.info(`找到 ${cards?.length || 0} 张${cardType}`, { cards });
        
        if (cards && cards.length > 0) {
          // 过滤出有效的卡(未过期且有剩余课时)
          const today = new Date();
          const validCards = cards.filter(card => {
            // 检查有效期
            const isValid = !card.valid_until || new Date(card.valid_until) >= today;
            
            // 检查剩余课时
            const remainingSessions = formData.courseType === 'private' 
              ? card.remaining_private_sessions 
              : card.remaining_group_sessions;
            
            const hasRemainingSessions = remainingSessions && remainingSessions > 0;
            
            return isValid && hasRemainingSessions;
          });
          
          logger.info(`找到 ${validCards.length} 张有效${cardType}`, { validCards });
          
          // 在有效卡中选择最新创建的一张
          if (validCards.length > 0) {
            const sortedValidCards = [...validCards].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            
            validCardId = sortedValidCards[0].id;
            logger.info('选择有效会员卡', { 
              card_id: validCardId, 
              card_type: sortedValidCards[0].card_type,
              card_category: sortedValidCards[0].card_category,
              valid_until: sortedValidCards[0].valid_until,
              remaining_sessions: formData.courseType === 'private' 
                ? sortedValidCards[0].remaining_private_sessions 
                : sortedValidCards[0].remaining_group_sessions
            });
          } else {
            logger.info(`未找到有效的${cardType}`);
          }
        }
      }

      // 调用handle_check_in RPC函数
      const classType = formData.courseType === 'private' ? 'private' : getClassTypeFromTimeSlot(formData.timeSlot);
      
      logger.info('准备调用handle_check_in', {
        p_member_id: result.member_id,
        p_name: formData.name,
        p_email: formData.email,
        p_card_id: validCardId,
        p_class_type: classType,
        p_check_in_date: new Date().toISOString().split('T')[0],
        p_time_slot: formData.timeSlot,
        p_trainer_id: formData.courseType === 'private' ? formData.trainerId : null,
        p_is_1v2: formData.courseType === 'private' ? formData.is1v2 : false
      });

      const { data: checkInResult, error: checkInError } = await supabase.rpc(
        'handle_check_in',
        {
          p_member_id: result.member_id,
          p_name: formData.name,
          p_email: formData.email,
          p_card_id: validCardId,
          p_class_type: classType,
          p_check_in_date: new Date().toISOString().split('T')[0],
          p_time_slot: formData.timeSlot,
          p_trainer_id: formData.courseType === 'private' ? formData.trainerId : null,
          p_is_1v2: formData.courseType === 'private' ? formData.is1v2 : false
        }
      );

      if (checkInError) {
        logger.error('签到错误', { 
          error: checkInError,
          code: checkInError.code,
          hint: checkInError.hint,
          details: checkInError.details,
          message: checkInError.message
        });
        
        // Handle duplicate check-in
        if (checkInError.message?.includes('今天已经在这个时段签到过了')) {
          return {
            success: false,
            message: messages.checkIn.duplicateCheckIn,
            isDuplicate: true
          };
        }

        throw checkInError;
      }

      // Ensure checkInResult exists
      if (!checkInResult) {
        throw new Error('签到记录创建失败');
      }

      logger.info('签到成功', { 
        checkInResult,
        isExtra: checkInResult.isExtra,
        isNewMember: checkInResult.isNewMember,
        member_id: result.member_id
      });

      // Return result based on isExtra flag and class type
      const finalResult = {
        success: true,  // Both normal and extra check-ins are considered successful
        isExtra: checkInResult.isExtra,
        isNewMember: checkInResult.isNewMember,
        message: checkInResult.message || (checkInResult.isExtra 
          ? (formData.courseType === 'private' 
             ? messages.checkIn.extraCheckInPrivate 
             : messages.checkIn.extraCheckInGroup)
          : messages.checkIn.success)
      };

      logger.info('签到结果', finalResult);
      return finalResult;

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
      
      // 返回标准格式的CheckInResult对象
      return {
        success: false,
        message: errorMessage,
        isNewMember: result?.is_new,
        isExtra: true // 如果发生错误,标记为额外签到
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