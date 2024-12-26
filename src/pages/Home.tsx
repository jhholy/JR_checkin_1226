import React from 'react';
import { Link } from 'react-router-dom';
import { MuayThaiIcon } from '../components/icons/MuayThaiIcon';
import { Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-2">
            <MuayThaiIcon className="text-4xl" />
            <h1 className="text-4xl font-bold">JR Muay Thai</h1>
            <MuayThaiIcon className="text-4xl" />
          </div>
          <h2 className="text-2xl text-gray-600">JR 泰拳馆</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Link
            to="/member"
            className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-bold mb-2 text-muaythai-blue">
              Member Check-in
            </h2>
            <p className="text-xl text-gray-600 mb-4">老会员签到</p>
            <p className="text-gray-500">
              Already a member? Check in here for your class.
              <br />
              已注册会员请在此签到
            </p>
          </Link>

          <Link
            to="/new-member"
            className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-bold mb-2 text-muaythai-red">
              New Member Check-in
            </h2>
            <p className="text-xl text-gray-600 mb-4">新会员签到</p>
            <p className="text-gray-500">
              First time at JR Muay Thai? Start here.
              <br />
              首次来馆请在此签到
            </p>
          </Link>
        </div>

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