import React, { useState, useEffect, useCallback } from 'react';
import {
  FiShield,
  FiSearch,
  FiFilter,
  FiLock,
  FiCalendar,
  FiRefreshCw,
  FiAlertTriangle,
} from 'react-icons/fi';
import * as auditService from '../../services/auditService';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import { toast } from 'react-toastify';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Filters
  const [eventType, setEventType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await auditService.getAuditLogs({
        page,
        limit: 15,
        eventType: eventType || undefined,
        status: status || undefined,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setLogs(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalLogs(res.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, eventType, status, search, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getEventBadge = (type) => {
    switch (type) {
      case 'FILE_UPLOAD':
        return { variant: 'info', label: 'FILE_UPLOAD' };
      case 'FILE_SHARE':
        return { variant: 'purple', label: 'FILE_SHARE' };
      case 'FILE_DOWNLOAD':
        return { variant: 'success', label: 'FILE_DOWNLOAD' };
      case 'DOWNLOAD_FAILED':
        return { variant: 'danger', label: 'DOWNLOAD_FAILED' };
      case 'UNAUTHORIZED_ACCESS':
        return { variant: 'danger', label: 'UNAUTHORIZED_ACCESS' };
      case 'LINK_REVOKED':
        return { variant: 'orange', label: 'LINK_REVOKED' };
      case 'LINK_EXPIRED_ACCESS':
        return { variant: 'warning', label: 'LINK_EXPIRED_ACCESS' };
      case 'USER_LOGIN':
        return { variant: 'indigo', label: 'USER_LOGIN' };
      case 'USER_LOGOUT':
        return { variant: 'gray', label: 'USER_LOGOUT' };
      case 'USER_REGISTER':
        return { variant: 'blue', label: 'USER_REGISTER' };
      default:
        return { variant: 'gray', label: type };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FiLock className="w-6 h-6 text-purple-600" />
              Security Audit Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              {totalLogs} Events
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Tamper-proof chronological trail of all system activities, downloads, and policy violations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold">
          <FiShield className="w-4 h-4 text-emerald-600" />
          <span>Read-Only Compliance Protection</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search details, IP address, event..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700"
            >
              <option value="">All Event Types</option>
              <option value="FILE_UPLOAD">FILE_UPLOAD</option>
              <option value="FILE_SHARE">FILE_SHARE</option>
              <option value="FILE_DOWNLOAD">FILE_DOWNLOAD</option>
              <option value="DOWNLOAD_FAILED">DOWNLOAD_FAILED</option>
              <option value="UNAUTHORIZED_ACCESS">UNAUTHORIZED_ACCESS</option>
              <option value="LINK_REVOKED">LINK_REVOKED</option>
              <option value="LINK_EXPIRED_ACCESS">LINK_EXPIRED_ACCESS</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="USER_LOGOUT">USER_LOGOUT</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
            </select>

            <button
              onClick={() => {
                setEventType('');
                setStatus('');
                setSearch('');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={(val) => {
              setStartDate(val);
              setPage(1);
            }}
            onEndChange={(val) => {
              setEndDate(val);
              setPage(1);
            }}
            onClear={() => {
              setStartDate('');
              setEndDate('');
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Querying audit records..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No audit records match your filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      User Identity
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Target File
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Client IP
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Audit Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {logs.map((log) => {
                    const badge = getEventBadge(log.eventType);
                    return (
                      <tr key={log._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <Badge text={badge.label} variant={badge.variant} />
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {log.user ? (
                            <div>
                              <p className="font-semibold text-xs text-gray-800">{log.user.name}</p>
                              <p className="text-[11px] text-gray-400">{log.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Public Token</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600 max-w-xs truncate">
                          {log.file?.originalName || '—'}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <Badge
                            text={log.status}
                            variant={log.status === 'SUCCESS' ? 'success' : 'danger'}
                          />
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600 max-w-sm truncate" title={log.details}>
                          {log.details || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
