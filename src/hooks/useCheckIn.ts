import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckInFormData } from '../types/database';
import { messages } from '../utils/messageUtils';
import { findMemberForCheckIn } from '../utils/member/search';
import { checkInLogger } from '../utils/logger/checkIn';

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

      // Find member
      const result = await findMemberForCheckIn({
        name: formData.name,
        email: formData.email
      });

      // Handle member lookup results
      if (result.needs_email) {
        return {
          success: false,
          message: messages.checkIn.duplicateName,
          isDuplicate: true
        };
      }

      if (result.is_new) {
        return {
          success: false,
          message: messages.checkIn.newMember,
          isNewMember: true
        };
      }

      if (!result.member_id) {
        return {
          success: false,
          message: messages.checkIn.memberNotFound
        };
      }

      // Log check-in attempt
      checkInLogger.logCheckInAttempt(result.member_id, formData.classType);

      // Proceed with check-in
      const { data: checkIn, error: checkInError } = await supabase
        .from('check_ins')
        .insert([{
          member_id: result.member_id,
          class_type: formData.classType
        }])
        .select('is_extra')
        .single();

      if (checkInError) {
        if (checkInError.hint === 'duplicate_class') {
          return {
            success: false,
            message: messages.checkIn.duplicateCheckIn,
            isDuplicate: true
          };
        }
        throw checkInError;
      }

      const checkInResult = {
        success: true,
        isExtra: checkIn.is_extra,
        message: checkIn.is_extra ? messages.checkIn.extraCheckIn : messages.checkIn.success
      };

      checkInLogger.logCheckInResult(checkInResult);
      return checkInResult;

    } catch (err) {
      checkInLogger.logCheckInError(err);
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