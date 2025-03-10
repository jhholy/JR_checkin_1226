import React from 'react';
import { Users, CalendarCheck, AlertCircle, PieChart, BarChart } from 'lucide-react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import StatCard from '../common/StatCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useCheckInTrends } from '../../hooks/useCheckInTrends';
import { useMembershipCardStats } from '../../hooks/useMembershipCardStats';
import { useTrainerWorkload } from '../../hooks/useTrainerWorkload';

// 中国传统色彩配色
const chineseColors = {
  // 红色系
  reds: [
    '#8C1F28', // 淡枣红 DAN ZAO HONG
    '#9D2933', // 血石红 XUE SHI HONG
    '#C3272B', // 中国红 ZHONG GUO HONG
    '#CF5C35', // 蟹壳红 XIE KE HONG
    '#C87456', // 淡红瓦 DAN HONG WA
    '#F04B22', // 橙排红 CHENG FEI HONG
    '#F47983', // 珊瑚朱 SHAN HU ZHU
  ],
  // 橙色系
  oranges: [
    '#DD7E3B', // 洗柿橙 XI SHI CHENG
    '#F6A6A6', // 藏花红 CANG HUA HONG
    '#E8B49A', // 薄香橙 BO XIANG CHENG
  ],
  // 蓝色系
  blues: [
    '#283F3E', // 铜器青 TONG QI QING
    '#1D4C50', // 青灰蓝 QING HUI LAN
    '#3F605B', // 飞泉青 FEI QUAN QING
    '#0D35B1', // 唐瓷蓝 TANG CI LAN
    '#1559CF', // 琉璃蓝 LIU LI LAN
    '#7097DE', // 天水蓝 TIAN SHUI LAN
    '#1A93BC', // 钴蓝 GU LAN
  ],
  // 背景和边框
  backgrounds: [
    'rgba(195, 39, 43, 0.8)',    // 中国红
    'rgba(221, 126, 59, 0.8)',   // 洗柿橙
    'rgba(21, 89, 207, 0.8)',    // 琉璃蓝
    'rgba(112, 151, 222, 0.8)',  // 天水蓝
    'rgba(26, 147, 188, 0.8)',   // 钴蓝
    'rgba(63, 96, 91, 0.8)',     // 飞泉青
    'rgba(240, 75, 34, 0.8)',    // 橙排红
    'rgba(232, 180, 154, 0.8)',  // 薄香橙
  ],
  borders: [
    'rgb(195, 39, 43)',    // 中国红
    'rgb(221, 126, 59)',   // 洗柿橙
    'rgb(21, 89, 207)',    // 琉璃蓝
    'rgb(112, 151, 222)',  // 天水蓝
    'rgb(26, 147, 188)',   // 钴蓝
    'rgb(63, 96, 91)',     // 飞泉青
    'rgb(240, 75, 34)',    // 橙排红
    'rgb(232, 180, 154)',  // 薄香橙
  ]
};

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
          color="bg-[#1559CF]" // 琉璃蓝
        />
        <StatCard
          title="今日签到"
          value={stats.todayCheckins}
          icon={CalendarCheck}
          color="bg-[#DD7E3B]" // 洗柿橙
        />
        <StatCard
          title="今日额外签到"
          value={stats.extraCheckins}
          icon={AlertCircle}
          color="bg-[#C3272B]" // 中国红
        />
        <StatCard
          title="即将过期会员"
          value={stats.expiringMembers}
          icon={AlertCircle}
          color="bg-[#3F605B]" // 飞泉青
        />
      </div>

      {/* 图表区域 */}
      <div className="space-y-6">
        {/* 会员活跃度分析 */}
        <div className="bg-white rounded-lg shadow p-6 border-2 border-[#283F3E]">
          <div className="flex items-center mb-4">
            <BarChart className="w-5 h-5 text-[#C3272B] mr-2" />
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
                      borderColor: chineseColors.borders[2], // 琉璃蓝
                      backgroundColor: 'rgba(21, 89, 207, 0.1)',
                      tension: 0.1,
                      fill: true,
                      borderWidth: 2,
                    },
                    {
                      label: '私教签到 Private Class',
                      data: trends.map(trend => trend.privateClass || 0),
                      borderColor: chineseColors.borders[0], // 中国红
                      backgroundColor: 'rgba(195, 39, 43, 0.1)',
                      tension: 0.1,
                      fill: true,
                      borderWidth: 2,
                    }
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        font: {
                          weight: 'bold',
                        },
                        color: '#283F3E', // 铜器青
                      }
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        color: '#283F3E', // 铜器青
                      },
                      grid: {
                        color: 'rgba(40, 63, 62, 0.1)', // 铜器青
                      }
                    },
                    x: {
                      ticks: {
                        color: '#283F3E', // 铜器青
                      },
                      grid: {
                        color: 'rgba(40, 63, 62, 0.1)', // 铜器青
                      }
                    }
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* 会员卡使用情况 */}
        <div className="bg-white rounded-lg shadow p-6 border-2 border-[#283F3E]">
          <div className="flex items-center mb-4">
            <PieChart className="w-5 h-5 text-[#DD7E3B] mr-2" />
            <h2 className="text-lg font-medium">会员卡类型分布 Membership Card Distribution</h2>
          </div>
          
          {cardStatsLoading ? (
            <LoadingSpinner />
          ) : cardStatsError ? (
            <ErrorMessage message={cardStatsError.message} />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <div className="h-80">
                <Pie 
                  data={{
                    labels: cardStats.map(stat => stat.cardType),
                    datasets: [
                      {
                        data: cardStats.map(stat => stat.count),
                        backgroundColor: [
                          chineseColors.backgrounds[0], // 中国红
                          chineseColors.backgrounds[1], // 洗柿橙
                          chineseColors.backgrounds[2], // 琉璃蓝
                          chineseColors.backgrounds[3], // 天水蓝
                          chineseColors.backgrounds[4], // 钴蓝
                          chineseColors.backgrounds[5], // 飞泉青
                          chineseColors.backgrounds[6], // 橙排红
                          chineseColors.backgrounds[7], // 薄香橙
                          'rgba(157, 41, 51, 0.8)',    // 血石红
                          'rgba(200, 116, 86, 0.8)',   // 淡红瓦
                        ],
                        borderColor: chineseColors.borders,
                        borderWidth: 2,
                      }
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          font: {
                            weight: 'bold',
                          },
                          color: '#283F3E', // 铜器青
                        }
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 教练工作量分析 */}
        <div className="bg-white rounded-lg shadow p-6 border-2 border-[#283F3E]">
          <div className="flex items-center mb-4">
            <BarChart className="w-5 h-5 text-[#1A93BC] mr-2" />
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
                      backgroundColor: chineseColors.backgrounds[3], // 天水蓝
                      borderColor: chineseColors.borders[3], // 天水蓝
                      borderWidth: 2,
                    }
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        font: {
                          weight: 'bold',
                        },
                        color: '#283F3E', // 铜器青
                      }
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        color: '#283F3E', // 铜器青
                      },
                      grid: {
                        color: 'rgba(40, 63, 62, 0.1)', // 铜器青
                      }
                    },
                    x: {
                      ticks: {
                        color: '#283F3E', // 铜器青
                      },
                      grid: {
                        color: 'rgba(40, 63, 62, 0.1)', // 铜器青
                      }
                    }
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