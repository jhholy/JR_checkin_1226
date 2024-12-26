import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { lazyLoadComponent } from '../../utils/performance/lazyLoad';

// 懒加载组件
const Home = lazyLoadComponent(() => import('../../pages/Home'));
const MemberCheckIn = lazyLoadComponent(() => import('../../pages/MemberCheckIn'));
const AdminDashboard = lazyLoadComponent(() => import('../../pages/AdminDashboard'));
const Login = lazyLoadComponent(() => import('../../components/AdminLogin'));

const AppRouter: React.FC = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/member" element={<MemberCheckIn />} />
        <Route 
          path="/admin" 
          element={user ? <AdminDashboard /> : <Login />} 
        />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;