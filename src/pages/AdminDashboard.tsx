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

  const tabs = [
    { id: 'members', label: '会员管理' },
    { id: 'checkins', label: '签到记录' },
    { id: 'import', label: '数据导入' },
    { id: 'export', label: '数据导出' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-[#4285F4]" />
                <span className="text-lg font-medium">管理后台</span>
              </div>
              <div className="flex gap-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`relative py-2 text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'text-[#4285F4] font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4285F4]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'members' && <MemberList />}
        {activeTab === 'checkins' && <CheckInRecordsList />}
        {activeTab === 'import' && <ExcelImport />}
        {activeTab === 'export' && <DataExport />}
      </main>
    </div>
  );
}