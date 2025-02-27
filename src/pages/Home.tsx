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
          <h1 className="text-2xl font-bold mb-2">JR泰拳馆签到系统</h1>
          <p className="text-gray-600">JR Muay Thai Check-in System</p>
        </div>

        <div className="space-y-4">
          {/* 团课签到入口 */}
          <Link
            to="/group-class"
            className="block w-full"
          >
            <div className="bg-[#4285F4] text-white rounded-lg p-4 hover:bg-blue-600 transition-colors">
              <div className="text-lg font-medium">团课签到 Group Class Check-in</div>
              <div className="text-sm opacity-90">团体课程签到入口 Group class check-in entrance</div>
            </div>
          </Link>

          {/* 私教课签到入口 */}
          <Link
            to="/private-class"
            className="block w-full"
          >
            <div className="bg-[#EA4335] text-white rounded-lg p-4 hover:bg-red-600 transition-colors">
              <div className="text-lg font-medium">私教签到 Private Class Check-in</div>
              <div className="text-sm opacity-90">私人教练课程签到入口 Private training check-in entrance</div>
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