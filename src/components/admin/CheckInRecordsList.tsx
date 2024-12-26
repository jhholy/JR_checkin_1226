import React, { useState, FormEvent } from 'react';
import { useCheckInRecordsPaginated } from '../../hooks/useCheckInRecordsPaginated';
import { formatDateTime } from '../../utils/dateUtils';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { ClassType } from '../../types/database';
import Pagination from '../common/Pagination';
import CheckInSummary from './CheckInSummary';
import DateRangePicker from '../common/DateRangePicker';

const PAGE_SIZE = 10;

export default function CheckInRecordsList() {
  const [filters, setFilters] = useState({
    memberName: '',
    startDate: '',
    endDate: '',
    classType: '' as '' | ClassType,
    isExtra: '' as '' | 'true' | 'false'
  });

  const { 
    records = [], 
    totalCount = 0,
    currentPage = 1,
    totalPages = 1,
    loading = false, 
    error = null, 
    fetchRecords 
  } = useCheckInRecordsPaginated(PAGE_SIZE);

  const handleSearch = (page: number = 1) => {
    fetchRecords({
      memberName: filters.memberName || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      classType: filters.classType || undefined,
      isExtra: filters.isExtra ? filters.isExtra === 'true' : undefined,
      page,
      pageSize: PAGE_SIZE
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(1);
    }
  };

  const handlePageChange = (page: number) => {
    handleSearch(page);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">签到记录查询 Check-in Records</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会员姓名 Member Name
              </label>
              <input
                type="text"
                value={filters.memberName}
                onChange={(e) => setFilters(prev => ({ ...prev, memberName: e.target.value }))}
                onKeyPress={handleKeyPress}
                placeholder="搜索会员... Search member..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <DateRangePicker
              value={{ startDate: filters.startDate, endDate: filters.endDate }}
              onChange={({ startDate, endDate }) => 
                setFilters(prev => ({ ...prev, startDate, endDate }))
              }
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                课程类型 Class Type
              </label>
              <select
                value={filters.classType}
                onChange={(e) => setFilters(prev => ({ ...prev, classType: e.target.value as '' | ClassType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">全部 All</option>
                <option value="morning">早课 Morning</option>
                <option value="evening">晚课 Evening</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                签到状态 Check-in Status
              </label>
              <select
                value={filters.isExtra}
                onChange={(e) => setFilters(prev => ({ ...prev, isExtra: e.target.value as '' | 'true' | 'false' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">全部 All</option>
                <option value="false">正常 Regular</option>
                <option value="true">额外 Extra</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              共 {totalCount} 条记录
            </div>
            <button
              type="submit"
              className="bg-muaythai-blue text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              搜索 Search
            </button>
          </div>
        </form>
      </div>

      {records.length > 0 ? (
        <>
          <CheckInSummary 
            records={records}
            totalCount={totalCount}
            filters={{
              memberName: filters.memberName,
              startDate: filters.startDate,
              endDate: filters.endDate
            }}
          />

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      会员 Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      日期 Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      课程 Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      状态 Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.member?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.member?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(new Date(record.created_at))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.class_type === 'morning' ? '早课 Morning' : '晚课 Evening'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.is_extra ? (
                          <span className="text-muaythai-red">额外签到 Extra</span>
                        ) : (
                          <span className="text-green-600">正常 Regular</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          暂无签到记录 No check-in records found
        </div>
      )}
    </div>
  );
}