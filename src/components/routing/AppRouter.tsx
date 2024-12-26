import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Home from '../../pages/Home';
import MemberCheckIn from '../../pages/MemberCheckIn';
import NewMemberCheckIn from '../../pages/NewMemberCheckIn';
import AdminDashboard from '../../pages/AdminDashboard';
import AdminLogin from '../AdminLogin';
import Layout from '../layout/Layout';

const AppRouter: React.FC = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/member" element={<MemberCheckIn />} />
        <Route path="/new-member" element={<NewMemberCheckIn />} />
        <Route 
          path="/admin" 
          element={user ? <AdminDashboard /> : <AdminLogin onSuccess={() => window.location.reload()} />} 
        />
        <Route path="/login" element={<Layout><AdminLogin onSuccess={() => window.location.reload()} /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;