import { useState } from 'react';
import { useCheckInRecordsPaginated } from '../../hooks/useCheckInRecordsPaginated';
import { ClassType } from '../../types/database';
import { format } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Pagination from '../common/Pagination';
import DateRangePicker from '../common/DateRangePicker';
import { useTrainers } from '../../hooks/useTrainers';

export default function CheckInRecordsList() {
  const [filters, setFilters] = useState({
    memberName: '',
    startDate: '',
    endDate: '',
    isExtra: undefined as boolean | undefined,
    isPrivate: undefined as boolean | undefined,
    trainerId: ''
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

  const {
    trainers,
    loading: trainersLoading,
    error: trainersError
  } = useTrainers();

  const handleSearch = async (page = 1) => {
    console.log('搜索参数:', {
      memberName: filters.memberName,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      isExtra: filters.isExtra,
      isPrivate: filters.isPrivate,
      trainerId: filters.trainerId,
      page,
      pageSize: 10
    });
    
    await fetchRecords({
      memberName: filters.memberName,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      isExtra: filters.isExtra,
      isPrivate: filters.isPrivate,
      trainerId: filters.trainerId || undefined,
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
      isExtra: undefined,
      isPrivate: undefined,
      trainerId: ''
    });
    handleSearch(1);
  };

  const getStatsSummary = () => {
    if (!records.length) return null;
    
    const memberName = filters.memberName || '所有会员';
    const dateRange = filters.startDate && filters.endDate 
      ? `${filters.startDate} - ${filters.endDate}`
      : '所有时间';
    
    const totalPrivateClasses = stats.oneOnOne + stats.oneOnTwo;
    
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-4">
        <p className="text-gray-600 flex items-center space-x-1 text-lg">
          <span className="font-medium text-[#4285F4]">{memberName}</span>
          <span>于</span>
          <span className="font-medium text-[#4285F4]">{dateRange}</span>
          <span>共签到</span>
          <span className="font-bold text-[#4285F4]">{stats.total}</span>
          <span>次，其中</span>
          <span className="font-medium text-green-600">{stats.regular}</span>
          <span>次正常签到，</span>
          <span className="font-medium text-red-600">{stats.extra}</span>
          <span>次额外签到；</span>
          <span className="font-medium text-purple-600">{totalPrivateClasses}</span>
          <span>次私教课，</span>
          <span className="font-medium text-blue-600">{stats.total - totalPrivateClasses}</span>
          <span>次团课。</span>
        </p>
      </div>
    );
  };

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">签到记录查询 Check-in Records</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会员姓名/邮箱 Member Name/Email
            </label>
            <input
              type="text"
              value={filters.memberName}
              onChange={(e) => setFilters(prev => ({ ...prev, memberName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#4285F4] focus:border-[#4285F4]"
              placeholder="输入会员姓名或邮箱..."
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
              教练 Trainer
            </label>
            <select
              value={filters.trainerId}
              onChange={(e) => {
                const newTrainerId = e.target.value;
                console.log('选择的教练ID:', newTrainerId);
                setFilters(prev => ({ ...prev, trainerId: newTrainerId }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#4285F4] focus:border-[#4285F4]"
            >
              <option value="">全部 All</option>
              {trainersLoading ? (
                <option value="" disabled>加载中... Loading...</option>
              ) : trainersError ? (
                <option value="" disabled>加载失败 Error loading trainers</option>
              ) : (
                trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} ({trainer.type === 'senior' ? '高级教练' : 'JR教练'})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              课程性质 Class Nature
            </label>
            <select
              value={filters.isPrivate === undefined ? '' : filters.isPrivate.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setFilters(prev => ({
                  ...prev,
                  isPrivate: value === '' ? undefined : value === 'true'
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#4285F4] focus:border-[#4285F4]"
            >
              <option value="">全部 All</option>
              <option value="false">团课 Group</option>
              <option value="true">私教课 Private</option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#4285F4] focus:border-[#4285F4]"
            >
              <option value="">全部 All</option>
              <option value="false">正常签到 Regular</option>
              <option value="true">额外签到 Extra</option>
            </select>
          </div>

          <div className="flex items-end justify-end">
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                重置 Reset
              </button>
              <button
                onClick={handleFilter}
                className="px-4 py-2 bg-[#4285F4] text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                搜索 Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {recordsLoading ? (
        <LoadingSpinner />
      ) : records.length > 0 ? (
        <>
          {getStatsSummary()}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      会员姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      邮箱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      上课时段 Time Slot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      课程性质
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      教练
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
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.members && record.members[0]?.name ? record.members[0].name : '未知会员'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.members && record.members[0]?.email ? record.members[0].email : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.time_slot || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.is_private
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {record.is_private ? '私教课' : '团课'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.trainer && record.trainer[0]?.name ? record.trainer[0].name : '-'}
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
        <div className="bg-white p-4 rounded-lg shadow-sm text-center text-gray-500">
          暂无签到记录 No check-in records found
        </div>
      )}
    </div>
  );
}