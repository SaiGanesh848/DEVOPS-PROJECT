import React from 'react';
import { FiCalendar, FiX } from 'react-icons/fi';

const DateRangeFilter = ({
  startDate = '',
  endDate = '',
  onStartChange,
  onEndChange,
  onClear,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex items-center">
        <span className="absolute left-3 text-gray-400 pointer-events-none">
          <FiCalendar className="w-4 h-4" />
        </span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          placeholder="Start Date"
          title="From Date"
        />
      </div>
      <span className="text-gray-400 text-sm">to</span>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-gray-400 pointer-events-none">
          <FiCalendar className="w-4 h-4" />
        </span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          placeholder="End Date"
          title="To Date"
        />
      </div>
      {(startDate || endDate) && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          title="Clear date filter"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default DateRangeFilter;
