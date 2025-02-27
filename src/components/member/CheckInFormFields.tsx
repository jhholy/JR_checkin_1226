import React from 'react';
import { ClassType } from '../../types/database';

interface Props {
  name: string;
  email: string;
  classType: ClassType;
  loading: boolean;
  isNewMember?: boolean;
  showClassType?: boolean;
  onChange: (field: string, value: string) => void;
}

export default function CheckInFormFields({ 
  name, 
  email,
  classType, 
  loading, 
  isNewMember,
  showClassType = true,
  onChange 
}: Props) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          姓名 Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder={isNewMember ? "请输入姓名 Enter your name" : "请输入会员姓名 Enter member name"}
          required
          disabled={loading}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          邮箱 Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="请输入邮箱 Enter email"
          required
          disabled={loading}
        />
        <p className="mt-1 text-sm text-gray-500">
          邮箱用于身份验证，所有会员必填
          <br />
          Email is required for all members
        </p>
      </div>

      {showClassType && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            课程 Class
          </label>
          <select
            value={classType}
            onChange={(e) => onChange('classType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            <option value="morning">早课 Morning (9:00-10:30)</option>
            <option value="evening">晚课 Evening (17:00-18:30)</option>
          </select>
        </div>
      )}
    </>
  );
}