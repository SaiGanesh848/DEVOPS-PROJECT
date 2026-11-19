import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FiShare2,
  FiLink,
  FiCopy,
  FiCheck,
  FiClock,
  FiSlash,
  FiShield,
  FiFolder,
  FiUser,
  FiAlertCircle,
  FiLock,
} from 'react-icons/fi';
import * as shareService from '../../services/shareService';
import * as fileService from '../../services/fileService';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const FileSharePage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedFileId = queryParams.get('fileId') || '';

  // Form states
  const [files, setFiles] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(preselectedFileId);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [maxDownloads, setMaxDownloads] = useState(5);
  // Default expiry: 24 hours from now in YYYY-MM-DDTHH:mm format
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [canDownload, setCanDownload] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createdShare, setCreatedShare] = useState(null);
  const [copied, setCopied] = useState(false);

  // Shares table states
  const [shares, setShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Revoke modal
  const [selectedShare, setSelectedShare] = useState(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  // Load user files & recipients
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [filesRes, recipientsRes] = await Promise.all([
          fileService.getMyFiles({ limit: 100 }),
          shareService.getRecipients(),
        ]);
        setFiles(filesRes.data || []);
        setRecipients(recipientsRes.data || []);
        if (preselectedFileId) {
          setSelectedFileId(preselectedFileId);
        } else if (filesRes.data?.length > 0) {
          setSelectedFileId(filesRes.data[0]._id);
        }
        if (recipientsRes.data?.length > 0) {
          setSelectedRecipientId(recipientsRes.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load prerequisites:', err);
      }
    };
    loadPrerequisites();
  }, [preselectedFileId]);

  // Load shares list
  const fetchShares = useCallback(async () => {
    try {
      setLoadingShares(true);
      const res = await shareService.getMyShares({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setShares(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load share history');
    } finally {
      setLoadingShares(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const handleCreateShare = async (e) => {
    e.preventDefault();
    if (!selectedFileId || !selectedRecipientId) {
      toast.error('Please select both a file and a recipient');
      return;
    }

    try {
      setCreating(true);
      const res = await shareService.createShare({
        fileId: selectedFileId,
        recipientId: selectedRecipientId,
        maxDownloads: parseInt(maxDownloads, 10),
        expiresAt: new Date(expiresAt).toISOString(),
        permissions: {
          canView: true,
          canDownload,
        },
      });

      setCreatedShare(res.data);
      toast.success('Secure share link generated successfully!');
      fetchShares();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create share link');
    } finally {
      setCreating(false);
    }
  };

  const copyShareLink = (token) => {
    const link = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeConfirm = async () => {
    if (!selectedShare) return;
    try {
      setRevoking(true);
      await shareService.revokeShare(selectedShare._id);
      toast.success('Share link revoked. Access has been immediately cut off.');
      setRevokeOpen(false);
      setSelectedShare(null);
      fetchShares();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke share link');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <FiShare2 className="w-6 h-6 text-indigo-600" />
          File Sharing & Access Configuration
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure precise recipient policies: download quota caps, expiration timestamps, and revocations.
        </p>
      </div>

      {/* Share Creation Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
          <FiLink className="w-4 h-4 text-indigo-600" />
          Generate Protected Access Link
        </h2>

        <form onSubmit={handleCreateShare} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Select File */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Select File to Share
              </label>
              <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 text-gray-800"
              >
                {files.length === 0 ? (
                  <option value="">No files uploaded yet</option>
                ) : (
                  files.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.originalName} ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Select Recipient */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Authorized Recipient
              </label>
              <select
                value={selectedRecipientId}
                onChange={(e) => setSelectedRecipientId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 text-gray-800"
              >
                {recipients.length === 0 ? (
                  <option value="">No active recipients found</option>
                ) : (
                  recipients.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.email})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Max Downloads */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Download Limit
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">Allowed downloads before auto-lock</p>
            </div>

            {/* Expiration Date/Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Expiration Date & Time
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">Link will become invalid after this time</p>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Access Permissions
              </label>
              <div className="pt-2">
                <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canDownload}
                    onChange={(e) => setCanDownload(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Permit Direct File Download</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={creating || files.length === 0 || recipients.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {creating ? 'Generating Token...' : 'Generate Protected Link'}
            </button>
          </div>
        </form>

        {/* Display Created Link Banner */}
        {createdShare && (
          <div className="mt-6 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <FiLock className="w-3.5 h-3.5" /> Newly Generated Share Token
              </span>
              <span className="text-xs text-indigo-600 font-medium">
                Expires: {new Date(createdShare.expiresAt).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/share/${createdShare.token}`}
                className="flex-1 bg-white border border-indigo-200 text-gray-800 text-xs font-mono rounded-lg px-3 py-2"
              />
              <button
                type="button"
                onClick={() => copyShareLink(createdShare.token)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing Shares Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Manage Active & Expired Shares</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live audit status, download counters, and link revocation controls.
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired / Exhausted</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        {loadingShares ? (
          <div className="py-12">
            <LoadingSpinner text="Fetching share history..." />
          </div>
        ) : shares.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No shares recorded yet.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      File Shared
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Quota Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Expiration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-sm">
                  {shares.map((share) => {
                    const isRevoked = share.isRevoked;
                    const isExpired = new Date() > new Date(share.expiresAt);
                    const isExhausted = share.downloadCount >= share.maxDownloads;
                    let statusText = 'ACTIVE';
                    let variant = 'success';
                    if (isRevoked) {
                      statusText = 'REVOKED';
                      variant = 'danger';
                    } else if (isExpired) {
                      statusText = 'EXPIRED';
                      variant = 'warning';
                    } else if (isExhausted) {
                      statusText = 'EXHAUSTED';
                      variant = 'gray';
                    }

                    return (
                      <tr
                        key={share._id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          statusText !== 'ACTIVE' ? 'opacity-70 bg-gray-50/40' : ''
                        }`}
                      >
                        <td className="px-6 py-3.5 font-semibold text-gray-900">
                          {share.file?.originalName || 'Deleted File'}
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          <p className="font-medium text-xs text-gray-800">{share.recipient?.name}</p>
                          <p className="text-[11px] text-gray-400">{share.recipient?.email}</p>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-700">
                          {share.downloadCount} / {share.maxDownloads} downloads
                        </td>
                        <td className="px-6 py-3.5 text-xs text-gray-500">
                          {new Date(share.expiresAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge text={statusText} variant={variant} />
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => copyShareLink(share.token)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Copy Protected Link"
                          >
                            <FiCopy className="w-4 h-4" />
                          </button>
                          {!share.isRevoked && (
                            <button
                              onClick={() => {
                                setSelectedShare(share);
                                setRevokeOpen(true);
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Revoke Share Immediately"
                            >
                              <FiSlash className="w-4 h-4" />
                            </button>
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

      {/* Revoke Confirm Dialog */}
      <ConfirmDialog
        isOpen={revokeOpen}
        title="Revoke Share Access"
        message={`Are you sure you want to revoke this link for "${selectedShare?.file?.originalName}"? Any future download attempts by the recipient will be denied and flagged in the audit ledger.`}
        confirmText="Revoke Access"
        variant="danger"
        onConfirm={handleRevokeConfirm}
        onCancel={() => {
          setRevokeOpen(false);
          setSelectedShare(null);
        }}
        loading={revoking}
      />
    </div>
  );
};

export default FileSharePage;
