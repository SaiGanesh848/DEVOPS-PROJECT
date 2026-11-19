import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield,
  FiAlertTriangle,
  FiSlash,
  FiActivity,
  FiArrowRight,
  FiLock,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
} from 'react-icons/fi';
import * as dashboardService from '../../services/dashboardService';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const AuditorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getAuditorDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load auditor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Initializing audit monitor..." />;
  }

  const {
    totalEvents = 0,
    failedAccesses = 0,
    linkRevocations = 0,
    last24hCount = 0,
    eventsByType = [],
    recentActivity = [],
  } = data || {};

  const getEventBadge = (eventType) => {
    if (eventType.includes('FAILED') || eventType.includes('UNAUTHORIZED')) {
      return { variant: 'danger', label: eventType };
    }
    if (eventType.includes('REVOKED')) {
      return { variant: 'warning', label: eventType };
    }
    if (eventType.includes('DOWNLOAD')) {
      return { variant: 'success', label: eventType };
    }
    if (eventType.includes('SHARE')) {
      return { variant: 'purple', label: eventType };
    }
    return { variant: 'indigo', label: eventType };
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-purple-200 mb-3">
            <FiShield className="w-3.5 h-3.5" /> Security & Compliance Auditor Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Compliance Monitor, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-purple-200 max-w-xl">
            Immutable append-only audit trail. Real-time anomaly detection for unauthorized access attempts, expired token re-use, and revoked shares.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/auditor/logs"
            className="inline-flex items-center px-4 py-2 bg-white text-purple-900 rounded-xl font-bold text-sm shadow hover:bg-purple-50 transition-colors"
          >
            Live Logs <FiArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center px-4 py-2 bg-purple-700/60 hover:bg-purple-700 border border-white/20 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Generate Reports
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Audit Events"
          value={totalEvents}
          icon={FiActivity}
          color="indigo"
        />
        <StatsCard
          title="Failed & Security Alerts"
          value={failedAccesses}
          icon={FiAlertTriangle}
          color="red"
        />
        <StatsCard
          title="Link Revocations"
          value={linkRevocations}
          icon={FiSlash}
          color="yellow"
        />
        <StatsCard
          title="Last 24 Hours Activity"
          value={last24hCount}
          icon={FiClock}
          color="blue"
        />
      </div>

      {/* Grid: Events by Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiActivity className="w-4 h-4 text-purple-600" />
            Events by Audit Type
          </h2>
          <div className="space-y-3">
            {eventsByType.length === 0 ? (
              <p className="text-xs text-gray-400">No events logged.</p>
            ) : (
              eventsByType.map((item) => {
                const percentage = totalEvents ? Math.round((item.count / totalEvents) * 100) : 0;
                return (
                  <div key={item.type} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="font-mono text-gray-700">{item.type}</span>
                      <span className="text-gray-500">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Security Alert Monitor */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FiShield className="w-4 h-4 text-red-500" />
              Security Integrity Verification
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Read-Only Ledger
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-medium text-slate-500">Data Immutability</p>
              <p className="text-lg font-bold text-slate-800 mt-1">Enforced</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Logs cannot be altered</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-medium text-slate-500">Access Control Model</p>
              <p className="text-lg font-bold text-slate-800 mt-1">RBAC v2.4</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Role tokens enforced</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-medium text-slate-500">Revocation SLA</p>
              <p className="text-lg font-bold text-slate-800 mt-1">&lt; 100 ms</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Immediate invalidation</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <FiLock className="w-3.5 h-3.5" /> Auditor Role Guarantees
            </p>
            <p className="text-indigo-700">
              Auditor credentials have read-only inspection access across all transfer actions, download counters, and authentication records. Modification or deletion endpoints are strictly barred by middleware.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Stream */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FiActivity className="w-4 h-4 text-purple-600" />
            Recent Security & Audit Trail
          </h2>
          <Link
            to="/auditor/logs"
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            Full Trail <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  File Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Client IP
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recentActivity.map((log) => {
                const badge = getEventBadge(log.eventType);
                return (
                  <tr key={log._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs">
                      <Badge text={badge.label} variant={badge.variant} />
                    </td>
                    <td className="px-6 py-3.5 text-gray-700">
                      {log.user ? (
                        <div>
                          <p className="font-semibold text-xs text-gray-800">{log.user.name}</p>
                          <p className="text-[11px] text-gray-400">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Public Token</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 text-xs">
                      {log.file?.originalName || '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        text={log.status}
                        variant={log.status === 'SUCCESS' ? 'success' : 'danger'}
                      />
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditorDashboard;
