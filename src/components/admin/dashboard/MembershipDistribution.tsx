import React from 'react';
import { Pie } from 'react-chartjs-2';
import { useMembershipStats } from '../../../hooks/useMembershipStats';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';

const MembershipDistribution: React.FC = () => {
  const { stats, loading, error } = useMembershipStats();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  const data = {
    labels: ['单日月卡', '双日月卡', '十次卡', '两次卡', '单次卡'],
    datasets: [
      {
        data: [
          stats.membershipTypeCounts.singleDaily,
          stats.membershipTypeCounts.doubleDaily,
          stats.membershipTypeCounts.tenClasses,
          stats.membershipTypeCounts.twoClasses,
          stats.membershipTypeCounts.singleClass,
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: '会员卡分布 Membership Distribution',
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <Pie data={data} options={options} />
    </div>
  );
};

export default MembershipDistribution;