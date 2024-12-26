import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { NewMemberFormData } from '../types/database';
import { messages } from '../utils/messageUtils';
import { validateNewMemberForm } from '../utils/validation/formValidation';
import { findMemberForCheckIn } from '../utils/member/search';
import { debugMemberSearch } from '../utils/debug/memberSearch';

interface CheckInResult {
  success: boolean;
  isExtra?: boolean;
  message: string;
  existingMember?: boolean;
}

export function useNewMemberCheckIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitNewMemberCheckIn = async (formData: NewMemberFormData): Promise<CheckInResult> => {
    try {
      setLoading(true);
      setError(null);

      console.log('Starting new member check-in:', formData);

      // Input validation
      const validation = validateNewMemberForm(formData.name, formData.email);
      if (!validation.isValid) {
        console.log('Validation failed:', validation.error);
        throw new Error(validation.error);
      }

      const name = formData.name.trim();
      const email = formData.email?.trim();

      // Debug member search in development
      if (process.env.NODE_ENV === 'development') {
        await debugMemberSearch(name);
      }

      // First check if member already exists
      const memberResult = await findMemberForCheckIn({ 
        name,
        email 
      });

      console.log('Member search result:', memberResult);

      // If member exists, return appropriate message
      if (memberResult.member_id) {
        console.log('Existing member found');
        return {
          success: false,
          message: messages.checkIn.memberExists,
          existingMember: true
        };
      }

      // If email verification needed
      if (memberResult.needs_email) {
        console.log('Email verification needed');
        return {
          success: false,
          message: messages.checkIn.duplicateName,
          existingMember: true
        };
      }

      // Register new member
      console.log('Registering new member');
      const { error: registerError } = await supabase.rpc(
        'register_new_member',
        {
          p_name: name,
          p_email: email,
          p_class_type: formData.classType
        }
      );

      if (registerError) {
        console.error('Registration error:', registerError);
        // Handle specific error cases
        if (registerError.message.includes('member_exists')) {
          return {
            success: false,
            message: messages.checkIn.memberExists,
            existingMember: true
          };
        }
        throw registerError;
      }

      // Return success with welcome message
      const result = {
        success: true,
        isExtra: true,
        message: messages.newMember.success
      };
      console.log('Registration successful:', result);
      return result;

    } catch (err) {
      console.error('Check-in error:', err);
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
    submitNewMemberCheckIn,
    loading,
    error
  };
}