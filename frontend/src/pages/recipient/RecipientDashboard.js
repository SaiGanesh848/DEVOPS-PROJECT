import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiFolder,
  FiDownload,
  FiCheckCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiClock,
  FiShield,
  FiLock,
  FiSlash,
} from 'react-icons/fi';
import * as dashboardService from '../../services/dashboardService';
import * as shareService from '../../services/shareService';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import FileIcon from '../../components/common/FileIcon';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const RecipientDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getRecipientDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load recipient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownload = (share) => {
    if (share.isRevoked) {
      toast.error('Access Denied: This link has been revoked by the sender.');
      return;
    }
    if (new Date() > new Date(share.expiresAt)) {
      toast.error('Access Denied: This share link has expired.');
      return;
    }
    if (share.downloadCount >= share.maxDownloads) {
      toast.error('Access Denied: Maximum download limit has been reached.');
      return;
    }

    // Direct download via token access URL
    const downloadUrl = `/api/shares/access/${share.token}`;
    window.open(downloadUrl, '_blank');
    toast.info(`Downloading "${share.file?.originalName}"...`);
    setTimeout(fetchDashboardData, 1500);
  };

  if (loading) {
    return <LoadingSpinner text="Loading recipient dashboard..." />;
  }

  const {
    sharedWithMe = 0,
    activeLinks = 0,
    expiredOrRevoked = 0,
    downloadsCount = 0,
    recentShares = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-100 mb-3">
            <FiShield className="w-3.5 h-3.5" /> Recipient Secured Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-emerald-100 max-w-xl">
            You can securely download authorized files transferred to you before their scheduled expiration date and within permitted download counts.
          </p>
        </div>
        <div>
          <Link
            to="/recipient/shared"
            className="inline-flex items-center px-4 py-2.5 bg-white text-emerald-900 rounded-xl font-bold text-sm shadow hover:bg-emerald-50 transition-colors"
          >
            All Shared Files <FiArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 3 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatsCard
          title="Files Shared With Me"
          value={sharedWithMe}
          icon={FiFolder}
          color="indigo"
        />
        <StatsCard
          title="Active & Downloadable"
          value={activeLinks}
          icon={FiCheckCircle}
          color="green"
        />
        <StatsCard
          title="Expired or Revoked"
          value={expiredOrRevoked}
          icon={FiAlertTriangle}
          color="orange"
        />
      </div>

      {/* Recent Files Shared With Me */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FiFolder className="w-4 h-4 text-emerald-600" />
            Recently Shared Files
          </h2>
          <Link
            to="/recipient/shared"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
          >
            View all ({sharedWithMe}) <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sender
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Remaining Downloads
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Expires On
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-sm">
              {recentShares.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                    No files have been shared with your account yet.
                  </td>
                </tr>
              ) : (
                recentShares.map((share) => {
                  const isRevoked = share.isRevoked;
                  const isExpired = new Date() > new Date(share.expiresAt);
                  const isExhausted = share.downloadCount >= share.maxDownloads;
                  const isDeleted = share.file?.isDeleted;

                  let statusText = 'ACTIVE';
                  let variant = 'success';
                  let isDownloadable = true;

                  if (isRevoked) {
                    statusText = 'REVOKED';
                    variant = 'danger';
                    isDownloadable = false;
                  } else if (isExpired) {
                    statusText = 'EXPIRED';
                    variant = 'warning';
                    isDownloadable = false;
                  } else if (isExhausted) {
                    statusText = 'EXHAUSTED';
                    variant = 'gray';
                    isDownloadable = false;
                  } else if (isDeleted) {
                    statusText = 'REMOVED';
                    variant = 'danger';
                    isDownloadable = false;
                  }

                  const remaining = Math.max(0, share.maxDownloads - share.downloadCount);

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
                        <span className="font-bold text-gray-900">{remaining}</span> of {share.maxDownloads} left
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(share.expiresAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge text={statusText} variant={variant} />
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
                          <span className="text-xs text-gray-400 italic">Access Inactive</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecipientDashboard;
