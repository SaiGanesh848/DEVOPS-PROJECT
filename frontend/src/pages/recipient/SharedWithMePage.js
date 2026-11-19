import React, { useState, useEffect, useCallback } from 'react';
import {
  FiFolder,
  FiDownload,
  FiFilter,
  FiClock,
  FiAlertCircle,
  FiSlash,
  FiCheckCircle,
} from 'react-icons/fi';
import * as shareService from '../../services/shareService';
import FileIcon from '../../components/common/FileIcon';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const SharedWithMePage = () => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShares, setTotalShares] = useState(0);

  const fetchShares = useCallback(async () => {
    try {
      setLoading(true);
      const res = await shareService.getSharedWithMe({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setShares(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalShares(res.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load shared files');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const handleDownload = (share) => {
    if (share.status !== 'active') {
      toast.error(`Cannot download: ${share.statusReason || 'Access inactive'}`);
      return;
    }

    const downloadUrl = `/api/shares/access/${share.token}`;
    window.open(downloadUrl, '_blank');
    toast.info(`Downloading "${share.file?.originalName}"...`);
    setTimeout(fetchShares, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Files Shared With Me</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {totalShares} Items
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Access protected files authorized by senders with active token guarantees.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 text-gray-700"
          >
            <option value="">All Shared Items</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired / Exhausted</option>
            <option value="revoked">Revoked by Sender</option>
          </select>
        </div>
      </div>

      {/* Shared Files Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Retrieving authorized files..." />
          </div>
        ) : shares.length === 0 ? (
          <EmptyState
            title="No Files Found"
            message="No files have been shared with your email address yet."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Shared By
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Downloads Left
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Expiration Date
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status & Policy
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-sm">
                  {shares.map((share) => {
                    const isDownloadable = share.status === 'active';
                    let badgeVariant = 'success';
                    if (share.status === 'revoked') badgeVariant = 'danger';
                    if (share.status === 'expired') badgeVariant = 'warning';
                    if (share.status === 'exhausted') badgeVariant = 'gray';

                    return (
                      <tr
                        key={share._id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          !isDownloadable ? 'opacity-70 bg-gray-50/40' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <FileIcon mimeType={share.file?.mimeType} fileName={share.file?.originalName} />
                            <div>
                              <p className="font-semibold text-gray-900">
                                {share.file?.originalName || 'Unavailable File'}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">
                                {formatBytes(share.file?.size)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-xs text-gray-800">{share.sender?.name}</p>
                          <p className="text-[11px] text-gray-400">{share.sender?.email}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <span className="font-bold text-gray-900">
                            {share.downloadsRemaining || 0}
                          </span>{' '}
                          of {share.maxDownloads} remaining
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(share.expiresAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <Badge text={share.status.toUpperCase()} variant={badgeVariant} />
                            {share.statusReason && (
                              <p className="text-[11px] text-red-500 leading-tight">
                                {share.statusReason}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isDownloadable ? (
                            <button
                              onClick={() => handleDownload(share)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
                            >
                              <FiDownload className="w-3.5 h-3.5 mr-1" /> Download
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Unavailable</span>
                          )}
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

export default SharedWithMePage;
