import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiFolder,
  FiShare2,
  FiDownload,
  FiHardDrive,
  FiUploadCloud,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
} from 'react-icons/fi';
import * as dashboardService from '../../services/dashboardService';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import FileIcon from '../../components/common/FileIcon';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const SenderDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getSenderDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load sender dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading sender dashboard..." />;
  }

  const {
    myFiles = 0,
    myShares = 0,
    activeShares = 0,
    storageUsed = 0,
    totalDownloads = 0,
    recentUploads = [],
    recentShares = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-indigo-100 mb-3">
            <FiUploadCloud className="w-3.5 h-3.5" /> Sender Secure Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-indigo-200 max-w-xl">
            Upload files securely, generate time-limited and download-capped share links, and track delivery status in real-time.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/sender/upload"
            className="inline-flex items-center px-4 py-2.5 bg-white text-indigo-900 rounded-xl font-bold text-sm shadow hover:bg-indigo-50 transition-colors"
          >
            <FiUploadCloud className="mr-2 w-4 h-4" /> Upload New File
          </Link>
          <Link
            to="/sender/share"
            className="inline-flex items-center px-4 py-2.5 bg-indigo-500/50 hover:bg-indigo-500 border border-white/20 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            <FiShare2 className="mr-2 w-4 h-4" /> Share Link
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Vault Files"
          value={myFiles}
          icon={FiFolder}
          color="indigo"
        />
        <StatsCard
          title="Active Shares"
          value={activeShares}
          icon={FiShare2}
          color="green"
        />
        <StatsCard
          title="Total Downloads"
          value={totalDownloads}
          icon={FiDownload}
          color="blue"
        />
        <StatsCard
          title="Storage In Use"
          value={formatBytes(storageUsed)}
          icon={FiHardDrive}
          color="purple"
        />
      </div>

      {/* Two columns: Recent Uploads & Recent Shares */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FiFolder className="w-4 h-4 text-indigo-600" />
              Recent Vault Uploads
            </h2>
            <Link
              to="/sender/files"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all ({myFiles}) <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentUploads.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              You haven't uploaded any files yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentUploads.map((file) => (
                <div key={file._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <FileIcon mimeType={file.mimeType} fileName={file.originalName} />
                    <div className="truncate">
                      <p className="font-semibold text-gray-800 text-sm truncate">{file.originalName}</p>
                      <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 pl-2">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Shares */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FiShare2 className="w-4 h-4 text-purple-600" />
              Recent Shares & Link Status
            </h2>
            <Link
              to="/sender/share"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Manage ({myShares}) <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentShares.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No files shared yet. Click "Share Link" to create one.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentShares.map((share) => {
                const isRevoked = share.isRevoked;
                const isExpired = new Date() > new Date(share.expiresAt);
                const isExhausted = share.downloadCount >= share.maxDownloads;
                let status = 'Active';
                let variant = 'success';
                if (isRevoked) {
                  status = 'Revoked';
                  variant = 'danger';
                } else if (isExpired) {
                  status = 'Expired';
                  variant = 'warning';
                } else if (isExhausted) {
                  status = 'Exhausted';
                  variant = 'gray';
                }

                return (
                  <div key={share._id} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {share.file?.originalName || 'File'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        To: {share.recipient?.name || share.recipient?.email || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500 font-mono">
                        {share.downloadCount}/{share.maxDownloads} DL
                      </span>
                      <Badge text={status} variant={variant} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SenderDashboard;
