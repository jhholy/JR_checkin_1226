import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AdminLogin from '../components/AdminLogin';
import NetworkError from '../components/common/NetworkError';
import LoadingSpinner from '../components/common/LoadingSpinner';

// 直接导入所有组件
import MemberList from '../components/admin/MemberList';
import CheckInRecordsList from '../components/admin/CheckInRecordsList';
import ExcelImport from '../components/admin/ExcelImport';
import DataExport from '../components/admin/DataExport';

type ActiveTab = 'members' | 'checkins' | 'import' | 'export';

export default function AdminDashboard() {
  const { user, loading, error, retry } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('members');

  if (loading) return <LoadingSpinner />;
  if (error) return <NetworkError onRetry={retry} />;
  if (!user) return <AdminLogin onSuccess={() => window.location.reload()} />;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Shield className="h-8 w-8 text-muaythai-blue" />
                <span className="ml-2 text-xl font-bold">管理后台</span>
              </div>
              <div className="ml-6 flex space-x-8">
                {['members', 'checkins', 'import', 'export'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as ActiveTab)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      activeTab === tab
                        ? 'border-muaythai-blue text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'members' && '会员管理'}
                    {tab === 'checkins' && '签到记录'}
                    {tab === 'import' && '数据导入'}
                    {tab === 'export' && '数据导出'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'members' && <MemberList />}
          {activeTab === 'checkins' && <CheckInRecordsList />}
          {activeTab === 'import' && <ExcelImport />}
          {activeTab === 'export' && <DataExport />}
        </div>
      </main>
    </div>
  );
}