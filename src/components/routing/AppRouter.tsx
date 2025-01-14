import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Home from '../../pages/Home';
import MemberCheckIn from '../../pages/MemberCheckIn';
import NewMemberCheckIn from '../../pages/NewMemberCheckIn';
import AdminDashboard from '../../pages/AdminDashboard';
import AdminLogin from '../AdminLogin';
import Layout from '../layout/Layout';
import LoadingSpinner from '../common/LoadingSpinner';

const AppRouter: React.FC = () => {
  const { user, loading, error } = useAuth();

  // 如果正在加载认证状态，显示加载动画
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout showHeader={false}><Home /></Layout>} />
        <Route path="/member" element={<MemberCheckIn />} />
        <Route path="/new-member" element={<NewMemberCheckIn />} />
        <Route 
          path="/admin" 
          element={
            loading ? (
              <LoadingSpinner />
            ) : user ? (
              <Layout>
                <AdminDashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/login" 
          element={
            user ? (
              <Navigate to="/admin" replace />
            ) : (
              <Layout>
                <AdminLogin onSuccess={() => window.location.reload()} />
              </Layout>
            )
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;