import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { MuayThaiIcon } from '../components/icons/MuayThaiIcon';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <MuayThaiIcon className="w-32 h-32 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">JR泰拳团课签到</h1>
          <p className="text-gray-600">JR Muay Thai Group Class Check-in</p>
        </div>

        <div className="space-y-4">
          {/* 老会员签到入口 */}
          <Link
            to="/member"
            className="block w-full"
          >
            <div className="bg-[#4285F4] text-white rounded-lg p-4 hover:bg-blue-600 transition-colors">
              <div className="text-lg font-medium">老会员签到 Member Check-in</div>
              <div className="text-sm opacity-90">已注册会员请点击这里 Registered members click here</div>
            </div>
          </Link>

          {/* 新会员签到入口 */}
          <Link
            to="/new-member"
            className="block w-full"
          >
            <div className="bg-[#EA4335] text-white rounded-lg p-4 hover:bg-red-600 transition-colors">
              <div className="text-lg font-medium">新会员签到 New Member Check-in</div>
              <div className="text-sm opacity-90">第一次来馆练习请点击这里 First time visitors click here</div>
            </div>
          </Link>
        </div>

        {/* 管理员登录入口 */}
        <div className="mt-8 text-center">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Shield className="w-5 h-5" />
            <span>管理员登录 Admin Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}