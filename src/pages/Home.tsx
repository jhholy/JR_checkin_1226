import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { MuayThaiIcon } from '../components/icons/MuayThaiIcon';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <MuayThaiIcon className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">JR Muay Thai</h1>
          <p className="text-gray-600">泰拳训练营签到系统 / Check-in System</p>
        </div>

        <div className="space-y-4">
          {/* 老会员签到入口 */}
          <Link
            to="/member"
            className="block w-full bg-muaythai-blue text-white py-3 px-4 rounded-lg text-center hover:bg-blue-700 transition-colors"
          >
            老会员签到 / Member Check-in
          </Link>

          {/* 新会员签到入口 */}
          <Link
            to="/new-member"
            className="block w-full bg-muaythai-red text-white py-3 px-4 rounded-lg text-center hover:bg-red-700 transition-colors"
          >
            新会员签到 / New Member Check-in
          </Link>
        </div>

        {/* 管理员登录入口 */}
        <div className="mt-8 text-center">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-muaythai-blue transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Login 管理员登录</span>
          </Link>
        </div>
      </div>
    </div>
  );
}