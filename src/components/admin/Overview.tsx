import React from 'react';
import { Users, CalendarCheck, AlertCircle, PieChart, BarChart } from 'lucide-react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import StatCard from '../common/StatCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useCheckInTrends } from '../../hooks/useCheckInTrends';
import { useMembershipCardStats } from '../../hooks/useMembershipCardStats';
import { useTrainerWorkload } from '../../hooks/useTrainerWorkload';

interface DashboardStats {
  totalMembers: number;
  todayCheckins: number;
  extraCheckins: number;
  expiringMembers: number;
}

interface Props {
  stats: DashboardStats;
}

export default function Overview({ stats }: Props) {
  const { trends, loading: trendsLoading, error: trendsError } = useCheckInTrends();
  const { cardStats, loading: cardStatsLoading, error: cardStatsError } = useMembershipCardStats();
  const { trainerStats, loading: trainerStatsLoading, error: trainerStatsError } = useTrainerWorkload();

  return (
    <div className="space-y-8">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总会员数"
          value={stats.totalMembers}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="今日签到"
          value={stats.todayCheckins}
          icon={CalendarCheck}
          color="bg-green-500"
        />
        <StatCard
          title="今日额外签到"
          value={stats.extraCheckins}
          icon={AlertCircle}
          color="bg-orange-500"
        />
        <StatCard
          title="即将过期会员"
          value={stats.expiringMembers}
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      {/* 图表区域 */}
      <div className="space-y-6">
        {/* 会员活跃度分析 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <BarChart className="w-5 h-5 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium">会员活跃度分析 Member Activity</h2>
          </div>
          
          {trendsLoading ? (
            <LoadingSpinner />
          ) : trendsError ? (
            <ErrorMessage message={trendsError.message} />
          ) : (
            <div className="h-64">
              <Line 
                data={{
                  labels: trends.map(trend => trend.date),
                  datasets: [
                    {
                      label: '团课签到 Group Class',
                      data: trends.map(trend => trend.groupClass || 0),
                      borderColor: 'rgb(54, 162, 235)',
                      backgroundColor: 'rgba(54, 162, 235, 0.1)',
                      tension: 0.1,
                      fill: true,
                    },
                    {
                      label: '私教签到 Private Class',
                      data: trends.map(trend => trend.privateClass || 0),
                      borderColor: 'rgb(75, 192, 192)',
                      backgroundColor: 'rgba(75, 192, 192, 0.1)',
                      tension: 0.1,
                      fill: true,
                    }
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* 会员卡使用情况 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <PieChart className="w-5 h-5 text-green-500 mr-2" />
            <h2 className="text-lg font-medium">会员卡类型分布 Membership Card Distribution</h2>
          </div>
          
          {cardStatsLoading ? (
            <LoadingSpinner />
          ) : cardStatsError ? (
            <ErrorMessage message={cardStatsError.message} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64">
                <Pie 
                  data={{
                    labels: cardStats.map(stat => stat.cardType),
                    datasets: [
                      {
                        data: cardStats.map(stat => stat.count),
                        backgroundColor: [
                          'rgba(54, 162, 235, 0.6)',
                          'rgba(75, 192, 192, 0.6)',
                          'rgba(255, 206, 86, 0.6)',
                          'rgba(255, 99, 132, 0.6)',
                          'rgba(153, 102, 255, 0.6)',
                        ],
                        borderWidth: 1,
                      }
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                    },
                  }}
                />
              </div>
              <div className="flex flex-col justify-center">
                <ul className="space-y-2">
                  {cardStats.map((stat, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{stat.cardType}</span>
                      <span className="font-medium">{stat.count} 张</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 教练工作量分析 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <BarChart className="w-5 h-5 text-orange-500 mr-2" />
            <h2 className="text-lg font-medium">教练工作量分析 Trainer Workload</h2>
          </div>
          
          {trainerStatsLoading ? (
            <LoadingSpinner />
          ) : trainerStatsError ? (
            <ErrorMessage message={trainerStatsError.message} />
          ) : (
            <div className="h-64">
              <Bar 
                data={{
                  labels: trainerStats.map(stat => stat.trainerName),
                  datasets: [
                    {
                      label: '私教课时 Private Sessions',
                      data: trainerStats.map(stat => stat.sessionCount),
                      backgroundColor: 'rgba(255, 159, 64, 0.6)',
                      borderColor: 'rgb(255, 159, 64)',
                      borderWidth: 1,
                    }
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 