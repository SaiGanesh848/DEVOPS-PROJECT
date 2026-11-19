import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = 'indigo', change }) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
    },
    cyan: {
      bg: 'bg-cyan-100',
      text: 'text-cyan-600',
    },
  };

  const colors = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {value !== undefined && value !== null ? value : '—'}
          </p>
          {change !== undefined && change !== null && (
            <div className="mt-2 flex items-center">
              <span
                className={`text-xs font-semibold ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </span>
              <span className="text-xs text-gray-400 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 p-4 rounded-xl ${colors.bg}`}>
          {Icon && <Icon className={`h-7 w-7 ${colors.text}`} />}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
