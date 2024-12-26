import { ExcelRow, ParsedRow } from './types';
import { Member, MembershipType } from '../../types/database';
import { validateName } from '../nameValidation';
import { validateEmail } from '../validation/emailValidation';
import { isValidMembershipType, validateMembershipData } from '../validation/membershipValidation';

export const validateRow = (row: ExcelRow, rowNumber: number): ParsedRow => {
  const errors: string[] = [];
  const name = row.name?.trim() || '';

  if (!name) {
    return {
      data: {},
      errors: ['Name is required'],
      rowNumber
    };
  }

  // Clean and validate membership type
  const membershipType = row.membership?.trim() || null;
  const validatedMembership = isValidMembershipType(membershipType) ? membershipType : null;

  const parsedData: Partial<Member> = {
    name,
    email: row.email?.trim() || null,
    membership: validatedMembership,
    remaining_classes: row.remaining_classes ? Number(row.remaining_classes) : 0,
    membership_expiry: row.membership_expiry || null,
    is_new_member: false
  };

  // Validate fields
  if (!validateName(name)) {
    errors.push(`Invalid name format: "${name}"`);
  }

  if (parsedData.email && !validateEmail(parsedData.email)) {
    errors.push('Invalid email format');
  }

  // Validate membership data
  const membershipErrors = validateMembershipData(
    membershipType,
    parsedData.remaining_classes,
    parsedData.membership_expiry
  );
  errors.push(...membershipErrors);

  return {
    data: parsedData,
    errors,
    rowNumber
  };
};