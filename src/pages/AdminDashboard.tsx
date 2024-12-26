import React, { useState, Suspense } from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AdminLogin from '../components/AdminLogin';
import NetworkError from '../components/common/NetworkError';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { lazyLoadComponent } from '../utils/performance/lazyLoad';

// Lazy load dashboard components
const DashboardLayout = lazyLoadComponent(() => import('../components/admin/dashboard/DashboardLayout'));
const MemberList = lazyLoadComponent(() => import('../components/admin/MemberList'));
const CheckInRecordsList = lazyLoadComponent(() => import('../components/admin/CheckInRecordsList'));
const ExcelImport = lazyLoadComponent(() => import('../components/admin/ExcelImport'));
const DataExport = lazyLoadComponent(() => import('../components/admin/DataExport'));

type ActiveTab = 'dashboard' | 'members' | 'checkins' | 'import' | 'export';

export default function AdminDashboard() {
  const { user, loading, error, retry } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

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
                {['dashboard', 'members', 'checkins', 'import', 'export'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as ActiveTab)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      activeTab === tab
                        ? 'border-muaythai-blue text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'dashboard' && '数据看板'}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<LoadingSpinner />}>
          {activeTab === 'dashboard' && <DashboardLayout />}
          {activeTab === 'members' && <MemberList />}
          {activeTab === 'checkins' && <CheckInRecordsList />}
          {activeTab === 'import' && <ExcelImport />}
          {activeTab === 'export' && <DataExport />}
        </Suspense>
      </main>
    </div>
  );
}