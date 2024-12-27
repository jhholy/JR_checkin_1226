import { useState } from 'react';
import { useCheckInRecordsPaginated } from '../../hooks/useCheckInRecordsPaginated';
import { ClassType } from '../../types/database';
import { format } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Pagination from '../common/Pagination';
import DateRangePicker from '../common/DateRangePicker';

export default function CheckInRecordsList() {
  const [filters, setFilters] = useState({
    memberName: '',
    startDate: '',
    endDate: '',
    classType: '' as ClassType | '',
    isExtra: undefined as boolean | undefined
  });

  const {
    records,
    currentPage,
    totalPages,
    loading: recordsLoading,
    error,
    fetchRecords,
    stats
  } = useCheckInRecordsPaginated(10);

  const handleSearch = async (page = 1) => {
    await fetchRecords({
      memberName: filters.memberName,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      classType: filters.classType || undefined,
      isExtra: filters.isExtra,
      page,
      pageSize: 10
    });
  };

  const handleFilter = () => {
    handleSearch(1);
  };

  const handlePageChange = (page: number) => {
    handleSearch(page);
  };

  const handleReset = () => {
    setFilters({
      memberName: '',
      startDate: '',
      endDate: '',
      classType: '',
      isExtra: undefined
    });
    handleSearch(1);
  };

  const getStatsSummary = () => {
    if (!records.length) return null;
    
    const memberName = filters.memberName || '所有会员';
    const dateRange = filters.startDate && filters.endDate 
      ? `${filters.startDate} - ${filters.endDate}`
      : '所有时间';
    
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-4">
        <p className="text-gray-600 flex items-center space-x-1 text-lg">
          <span className="font-medium text-muaythai-blue">{memberName}</span>
          <span>于</span>
          <span className="font-medium text-muaythai-blue">{dateRange}</span>
          <span>共签到</span>
          <span className="font-bold text-muaythai-blue">{stats.total}</span>
          <span>次，其中正常签到</span>
          <span className="font-medium text-green-600">{stats.regular}</span>
          <span>次，额外签到</span>
          <span className="font-medium text-red-600">{stats.extra}</span>
          <span>次。</span>
        </p>
      </div>
    );
  };

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">签到记录查询 Check-in Records</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会员姓名 Member Name
            </label>
            <input
              type="text"
              value={filters.memberName}
              onChange={(e) => setFilters(prev => ({ ...prev, memberName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="输入会员姓名..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日期范围 Date Range
            </label>
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onStartDateChange={(date) => setFilters(prev => ({ ...prev, startDate: date || '' }))}
              onEndDateChange={(date) => setFilters(prev => ({ ...prev, endDate: date || '' }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              课程类型 Class Type
            </label>
            <select
              value={filters.classType}
              onChange={(e) => setFilters(prev => ({ ...prev, classType: e.target.value as ClassType | '' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">全部 All</option>
              <option value="morning">早课 Morning</option>
              <option value="evening">晚课 Evening</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              签到类型 Check-in Type
            </label>
            <select
              value={filters.isExtra === undefined ? '' : filters.isExtra.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setFilters(prev => ({
                  ...prev,
                  isExtra: value === '' ? undefined : value === 'true'
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">全部 All</option>
              <option value="false">正常签到 Regular</option>
              <option value="true">额外签到 Extra</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            重置 Reset
          </button>
          <button
            onClick={handleFilter}
            className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-muaythai-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-muaythai-blue transition-colors"
          >
            搜索 Search
          </button>
        </div>
      </div>

      {recordsLoading ? (
        <LoadingSpinner />
      ) : records.length > 0 ? (
        <>
          {getStatsSummary()}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      会员姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      课程类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      签到时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      签到类型
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.members?.name || '未知会员'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.class_type === 'morning' ? '早课' : '晚课'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.is_extra
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {record.is_extra ? '额外签到' : '正常签到'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
          暂无签到记录 No check-in records found
        </div>
      )}
    </div>
  );
}