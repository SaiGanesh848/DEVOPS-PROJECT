import React, { useState, useEffect, useCallback } from 'react';
import {
  FiFileText,
  FiDownload,
  FiFilter,
  FiCalendar,
  FiHardDrive,
  FiClock,
  FiSlash,
  FiCheckCircle,
  FiAlertTriangle,
  FiPieChart,
  FiRefreshCw,
} from 'react-icons/fi';
import * as reportService from '../../services/reportService';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const ReportsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('transfers'); // transfers, audit, expired, storage
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [extraData, setExtraData] = useState(null); // for storage summary / byType
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter || undefined,
        eventType: eventTypeFilter || undefined,
      };

      let res;
      if (activeTab === 'transfers') {
        res = await reportService.getTransferHistory(params);
        setReportData(res.data || []);
      } else if (activeTab === 'audit') {
        res = await reportService.getFileAccessAudit(params);
        setReportData(res.data || []);
      } else if (activeTab === 'expired') {
        res = await reportService.getExpiredShares(params);
        setReportData(res.data || []);
      } else if (activeTab === 'storage') {
        res = await reportService.getStorageUsage(params);
        setReportData(res.data || []);
        setExtraData({ summary: res.summary, byType: res.byType });
      }

      setTotalPages(res?.totalPages || 1);
      setTotalRecords(res?.total || 0);
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, startDate, endDate, statusFilter, eventTypeFilter]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setEventTypeFilter('');
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const params = {
        reportType: activeTab,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter || undefined,
        eventType: eventTypeFilter || undefined,
      };

      const res = await reportService.exportReport(activeTab, params);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${activeTab}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report successfully exported to CSV!');
    } catch (err) {
      toast.error('CSV export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FiFileText className="w-6 h-6 text-indigo-600" />
            Audit & Compliance Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Produce certified query-driven reports for compliance verification and usage telemetry.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={exporting || loading}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50"
        >
          <FiDownload className="mr-2 w-4 h-4" />
          {exporting ? 'Generating CSV...' : 'Export to CSV'}
        </button>
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { id: 'transfers', name: 'Transfer History', desc: 'File movements & recipients', icon: FiFileText },
          { id: 'audit', name: 'File Access Audit', desc: 'Read & download security log', icon: FiClock },
          { id: 'expired', name: 'Expired Shares', desc: 'Revoked & lapsed links', icon: FiSlash },
          { id: 'storage', name: 'Storage Telemetry', desc: 'Capacity & user quotas', icon: FiHardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`p-4 rounded-2xl text-left border transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white text-gray-800 border-gray-100 hover:border-indigo-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
              <p className="font-bold text-sm leading-tight">{tab.name}</p>
              <p className={`text-xs mt-1 ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={(v) => {
            setStartDate(v);
            setPage(1);
          }}
          onEndChange={(v) => {
            setEndDate(v);
            setPage(1);
          }}
          onClear={() => {
            setStartDate('');
            setEndDate('');
            setPage(1);
          }}
        />

        <div className="flex items-center gap-2">
          {activeTab === 'transfers' && (
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          )}

          {activeTab === 'audit' && (
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700"
            >
              <option value="">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
            </select>
          )}

          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setStatusFilter('');
              setEventTypeFilter('');
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Storage Specific Summary Cards */}
      {activeTab === 'storage' && extraData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Total Files Stored</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{extraData.summary.totalFiles || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Total Storage Used</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">
              {formatBytes(extraData.summary.totalSize)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Average File Size</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {formatBytes(extraData.summary.avgFileSize)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Largest File</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {formatBytes(extraData.summary.maxFileSize)}
            </p>
          </div>
        </div>
      )}

      {/* Storage Usage By File Type */}
      {activeTab === 'storage' && extraData?.byType && extraData.byType.length > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FiPieChart className="w-4 h-4 text-indigo-600" />
            Storage Breakdown by MIME Category
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {extraData.byType.map((item) => (
              <div key={item._id} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 truncate">{item._id || 'other'}</p>
                <p className="text-sm font-bold text-indigo-600 mt-1">{formatBytes(item.totalSize)}</p>
                <p className="text-[11px] text-gray-400">{item.count} files</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Running aggregate query..." />
          </div>
        ) : reportData.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No report data found for this selection.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              {/* Tab 1: Transfer History */}
              {activeTab === 'transfers' && (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">File Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sender</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Recipient</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quota Used</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Shared Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {reportData.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50/80">
                        <td className="px-5 py-3.5 font-semibold text-gray-900">{item.file?.originalName}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{item.sender?.name} ({item.sender?.email})</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{item.recipient?.name} ({item.recipient?.email})</td>
                        <td className="px-5 py-3.5 text-xs font-mono">{item.downloadCount} / {item.maxDownloads}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5">
                          <Badge
                            text={(item.status || 'UNKNOWN').toUpperCase()}
                            variant={(item.status || '').toLowerCase() === 'active' ? 'success' : (item.status || '').toLowerCase() === 'revoked' ? 'danger' : 'warning'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab 2: File Access Audit */}
              {activeTab === 'audit' && (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">File</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Event</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {reportData.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50/80">
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-800">{item.user?.name || 'Public Access'}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{item.file?.originalName || '—'}</td>
                        <td className="px-5 py-3.5 font-mono text-xs">{item.eventType}</td>
                        <td className="px-5 py-3.5">
                          <Badge text={item.status} variant={item.status === 'SUCCESS' ? 'success' : 'danger'} />
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{item.ipAddress || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab 3: Expired Shares */}
              {activeTab === 'expired' && (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">File Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sender</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Recipient</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Downloads</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Expired At</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {reportData.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50/80">
                        <td className="px-5 py-3.5 font-semibold text-gray-900">{item.file?.originalName}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-700">{item.sender?.name}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-700">{item.recipient?.name}</td>
                        <td className="px-5 py-3.5 font-mono text-xs">{item.downloadCount} / {item.maxDownloads}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(item.expiresAt).toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <Badge
                            text={item.isRevoked ? 'REVOKED' : 'EXPIRED'}
                            variant={item.isRevoked ? 'danger' : 'warning'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab 4: Storage Usage */}
              {activeTab === 'storage' && (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Files</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Storage Consumed</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {reportData.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50/80">
                        <td className="px-5 py-3.5 font-semibold text-gray-900">{item.name}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{item.email}</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-indigo-600">{item.fileCount || 0}</td>
                        <td className="px-5 py-3.5 text-xs font-mono text-gray-700">{formatBytes(item.storageUsed)}</td>
                        <td className="px-5 py-3.5">
                          <Badge
                            text={item.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                            variant={item.isActive ? 'success' : 'danger'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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

export default ReportsPage;
