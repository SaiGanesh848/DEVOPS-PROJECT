import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiShield,
  FiDownload,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiFolder,
  FiLock,
  FiArrowLeft,
} from 'react-icons/fi';
import api from '../../services/api';
import FileIcon from '../../components/common/FileIcon';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const DownloadSharePage = () => {
  const { token } = useParams();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShareDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/shares/token/${token}/details`);
        setShareData(res.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Invalid or nonexistent share link token.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchShareDetails();
  }, [token]);

  const handleDownload = () => {
    const downloadUrl = `/api/shares/access/${token}`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoadingSpinner text="Validating cryptographic access token..." />
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl border border-gray-100 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <FiAlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-600">{error || 'This link is no longer accessible.'}</p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              <FiArrowLeft className="mr-1 w-4 h-4" /> Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { file, sender, recipient, expiresAt, maxDownloads, downloadCount, isAccessible, reason } =
    shareData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 sm:p-10 shadow-2xl border border-gray-100 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <FiShield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-base leading-tight">Secure File Vault</h1>
              <span className="text-xs text-indigo-600 font-semibold">Protected Token Download</span>
            </div>
          </div>
          <Badge
            text={isAccessible ? 'VERIFIED' : 'RESTRICTED'}
            variant={isAccessible ? 'success' : 'danger'}
          />
        </div>

        {/* File Preview Card */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
          <div className="flex items-center space-x-4">
            <FileIcon mimeType={file?.mimeType} fileName={file?.originalName} />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 text-base truncate">{file?.originalName}</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{formatBytes(file?.size)}</p>
            </div>
          </div>
          {file?.description && (
            <p className="text-xs text-gray-600 italic border-t border-gray-200/60 pt-2">
              "{file.description}"
            </p>
          )}
        </div>

        {/* Share Policy Metadata */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Shared By:</span>
            <span className="text-gray-900 font-semibold">{sender?.name} ({sender?.email})</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Target Recipient:</span>
            <span className="text-gray-900 font-semibold">{recipient?.name} ({recipient?.email})</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Expiration Timestamp:</span>
            <span className="text-gray-900 font-mono">{new Date(expiresAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500 font-medium">Download Limit:</span>
            <span className="text-gray-900 font-mono">
              {downloadCount} used / {maxDownloads} maximum
            </span>
          </div>
        </div>

        {/* Download Action or Inaccessible Reason */}
        {isAccessible ? (
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all gap-2"
          >
            <FiDownload className="w-5 h-5" /> Download Encrypted Asset
          </button>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-1">
            <p className="text-xs font-bold text-red-700 uppercase">Download Unavailable</p>
            <p className="text-xs text-red-600">{reason || 'This transfer link has been closed.'}</p>
          </div>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs text-gray-500 hover:text-indigo-600 font-medium">
            Sign in with registered credentials →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DownloadSharePage;
