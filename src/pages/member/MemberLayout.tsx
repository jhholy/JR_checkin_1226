import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { User, CreditCard, ClipboardList } from 'lucide-react';

const MemberLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {/* 侧边导航栏 */}
          <div className="w-64 bg-white shadow-sm min-h-screen p-4">
            <nav className="space-y-2">
              <NavLink 
                to="/member" 
                end
                className={({ isActive }) => 
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-[#1559CF] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <User className="w-5 h-5" />
                <span>会员信息</span>
              </NavLink>

              <NavLink 
                to="/member/card"
                className={({ isActive }) => 
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-[#1559CF] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <CreditCard className="w-5 h-5" />
                <span>会员卡</span>
              </NavLink>

              <NavLink 
                to="/member/records"
                className={({ isActive }) => 
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-[#1559CF] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <ClipboardList className="w-5 h-5" />
                <span>签到记录</span>
              </NavLink>
            </nav>
          </div>

          {/* 主内容区域 */}
          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default MemberLayout; 