import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { NewMemberFormData, DatabaseError, RegisterResult, Database } from '../types/database';
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

  const handleError = (error: DatabaseError) => {
    console.error('Check-in error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    
    let errorMessage = messages.error;
    
    if (error.message) {
      if (error.code === 'PGRST202') {
        errorMessage = messages.databaseError;
      } else if (error.hint === 'invalid_name') {
        errorMessage = messages.validation.invalidName;
      } else if (error.hint === 'member_exists') {
        errorMessage = messages.memberExists;
      } else if (error.hint === 'email_exists') {
        errorMessage = messages.validation.emailExists;
      } else {
        errorMessage = error.message;
      }
    }
    
    setError(errorMessage);
    return errorMessage;
  };

  const submitNewMemberCheckIn = async (formData: NewMemberFormData): Promise<CheckInResult> => {
    try {
      setLoading(true);
      setError(null);

      console.log('Starting new member check-in with data:', {
        name: formData.name,
        email: formData.email,
        classType: formData.classType
      });

      // Input validation
      const validation = validateNewMemberForm(formData.name, formData.email);
      if (!validation.isValid) {
        console.log('Frontend validation failed:', validation.error);
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
        console.log('Existing member found:', memberResult);
        return {
          success: false,
          message: messages.memberExists,
          existingMember: true
        };
      }

      // If email verification needed
      if (memberResult.needs_email) {
        console.log('Email verification needed for:', name);
        return {
          success: false,
          message: messages.duplicateName,
          existingMember: true
        };
      }

      // Register new member
      console.log('Attempting to register new member:', {
        name,
        email,
        classType: formData.classType
      });
      
      const { data, error: registerError } = await supabase.rpc(
        'register_new_member',
        {
          p_name: name,
          p_email: email,
          p_class_type: formData.classType
        }
      );

      if (registerError) {
        console.error('Registration error:', {
          error: registerError,
          code: registerError.code,
          message: registerError.message,
          details: registerError.details,
          hint: registerError.hint
        });
        
        // Handle specific error cases
        if (registerError.message.includes('member_exists')) {
          return {
            success: false,
            message: messages.memberExists,
            existingMember: true
          };
        }
        throw registerError;
      }

      console.log('Registration successful, response:', data);

      // Return success with welcome message
      const result = {
        success: true,
        isExtra: true,
        message: messages.newMember
      };
      console.log('Registration completed:', result);
      return result;

    } catch (err) {
      const errorMessage = handleError(err as DatabaseError);
      return {
        success: false,
        message: errorMessage
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