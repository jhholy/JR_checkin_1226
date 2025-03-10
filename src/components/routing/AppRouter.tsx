import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Home from '../../pages/Home';
import GroupClassCheckIn from '../../pages/GroupClassCheckIn';
import PrivateClassCheckIn from '../../pages/PrivateClassCheckIn';
import AdminDashboard from '../../pages/AdminDashboard';
import AdminLogin from '../AdminLogin';
import MemberLogin from '../../pages/MemberLogin';
import Layout from '../layout/Layout';
import LoadingSpinner from '../common/LoadingSpinner';
import { MemberAuthProvider } from '../../contexts/MemberAuthContext';

const AppRouter: React.FC = () => {
  const { user, loading, error } = useAuth();

  // 如果正在加载认证状态，显示加载动画
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <MemberAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout showHeader={false}><Home /></Layout>} />
          <Route path="/group-class" element={<GroupClassCheckIn />} />
          <Route path="/private-class" element={<PrivateClassCheckIn />} />
          <Route path="/member-login" element={<Layout showHeader={false}><MemberLogin /></Layout>} />
          <Route path="/member-center" element={
            <Layout>
              {/* 会员中心内容 */}
            </Layout>
          } />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route 
            path="/admin/login" 
            element={
              user ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Layout showHeader={false}>
                  <AdminLogin onSuccess={() => window.location.reload()} />
                </Layout>
              )
            }
          />
          <Route 
            path="/admin/dashboard" 
            element={
              loading ? (
                <LoadingSpinner />
              ) : user ? (
                <Layout>
                  <AdminDashboard />
                </Layout>
              ) : (
                <Navigate to="/admin/login" replace />
              )
            } 
          />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </BrowserRouter>
    </MemberAuthProvider>
  );
};

export default AppRouter;