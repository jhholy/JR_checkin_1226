import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';

interface Props {
  lastUpdate: Date;
  autoRefresh: boolean;
  onRefresh: () => void;
  onToggleAutoRefresh: () => void;
}

export default function DashboardHeader({ 
  lastUpdate, 
  autoRefresh, 
  onRefresh, 
  onToggleAutoRefresh 
}: Props) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">数据看板 Dashboard</h1>
      
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <Clock className="w-4 h-4" />
          更新于: {formatDateTime(lastUpdate)}
        </div>
        
        <button
          onClick={onToggleAutoRefresh}
          className={`text-sm px-3 py-1 rounded-md ${
            autoRefresh 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {autoRefresh ? '自动刷新已开启' : '自动刷新已关闭'}
        </button>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1 text-muaythai-blue hover:text-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>
    </div>
  );
}