import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiFolder,
  FiShare2,
  FiHardDrive,
  FiArrowRight,
  FiShield,
  FiActivity,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi';
import * as dashboardService from '../../services/dashboardService';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getAdminDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading system metrics..." />;
  }

  const {
    totalUsers = 0,
    totalFiles = 0,
    activeShares = 0,
    totalStorage = 0,
    recentActivity = [],
    usersByRole = [],
    uploadsLast7Days = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-indigo-100 mb-3">
            <FiShield className="w-3.5 h-3.5" /> Administrator Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="mt-1 text-sm text-indigo-200 max-w-xl">
            System status is healthy. Storage utilization, access logs, and active share limits are continuously monitored.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/users"
            className="inline-flex items-center px-4 py-2 bg-white text-indigo-900 rounded-xl font-semibold text-sm shadow hover:bg-indigo-50 transition-colors"
          >
            Manage Users <FiArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center px-4 py-2 bg-indigo-600/60 hover:bg-indigo-600 border border-white/20 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Compliance Reports
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Registered Users"
          value={totalUsers}
          icon={FiUsers}
          color="indigo"
        />
        <StatsCard
          title="Vault Files Uploaded"
          value={totalFiles}
          icon={FiFolder}
          color="blue"
        />
        <StatsCard
          title="Active Share Links"
          value={activeShares}
          icon={FiShare2}
          color="green"
        />
        <StatsCard
          title="Storage Consumed"
          value={formatBytes(totalStorage)}
          icon={FiHardDrive}
          color="purple"
        />
      </div>

      {/* Grid: Role Distribution & Daily Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Roles Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiUsers className="w-4 h-4 text-indigo-600" />
            Users by Access Role
          </h2>
          <div className="space-y-4">
            {usersByRole.map((roleItem) => {
              const count = roleItem.count;
              const percentage = totalUsers ? Math.round((count / totalUsers) * 100) : 0;
              const roleColor = {
                admin: 'bg-red-500',
                sender: 'bg-indigo-600',
                recipient: 'bg-emerald-500',
                auditor: 'bg-purple-600',
              }[roleItem.role] || 'bg-gray-400';

              return (
                <div key={roleItem.role} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="capitalize text-gray-700">{roleItem.role}</span>
                    <span className="text-gray-500">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full ${roleColor} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Uploads Trend (Last 7 Days) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FiActivity className="w-4 h-4 text-blue-600" />
              File Ingestion & Transfer Volume (Recent)
            </span>
            <span className="text-xs text-gray-400 font-normal">Last 7 days record</span>
          </h2>

          {uploadsLast7Days.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              No upload activity recorded in the past 7 days.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 text-xs font-bold text-gray-500 uppercase pb-2 border-b">
                <span>Date</span>
                <span className="text-center">Files Uploaded</span>
                <span className="text-right">Volume</span>
              </div>
              {uploadsLast7Days.map((item) => (
                <div key={item._id} className="grid grid-cols-3 text-sm py-1.5 border-b border-gray-50">
                  <span className="font-medium text-gray-800">{item._id}</span>
                  <span className="text-center font-bold text-indigo-600">{item.count}</span>
                  <span className="text-right text-gray-600">{formatBytes(item.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FiActivity className="w-4 h-4 text-indigo-600" />
            Live Audit Stream (Last 10 Events)
          </h2>
          <Link
            to="/reports"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Full Audit Logs <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-sm">
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                recentActivity.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-900">
                      <span className="font-mono text-xs">{log.eventType}</span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {log.user ? log.user.name : 'Unauthenticated'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {log.file ? log.file.originalName : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        text={log.status}
                        variant={log.status === 'SUCCESS' ? 'success' : 'danger'}
                      />
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
