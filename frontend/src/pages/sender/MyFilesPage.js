import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFolder,
  FiSearch,
  FiUploadCloud,
  FiShare2,
  FiDownload,
  FiTrash2,
  FiCalendar,
  FiHardDrive,
} from 'react-icons/fi';
import * as fileService from '../../services/fileService';
import FileIcon from '../../components/common/FileIcon';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
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

const MyFilesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);

  // Delete modal state
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fileService.getMyFiles({
        page,
        limit: 10,
        search: search.trim() || undefined,
      });
      setFiles(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalFiles(res.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDownload = async (file) => {
    try {
      toast.info(`Preparing download for ${file.originalName}...`);
      await fileService.downloadFile(file._id, file.originalName);
      toast.success('Download started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    }
  };

  const confirmDelete = (file) => {
    setSelectedFile(file);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    try {
      setDeleting(true);
      await fileService.deleteFile(selectedFile._id);
      toast.success(`File "${selectedFile.originalName}" deleted from vault`);
      setDeleteOpen(false);
      setSelectedFile(null);
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Vault Files</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
              {totalFiles} Total
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Browse and manage files stored in your encrypted personal repository.
          </p>
        </div>
        <button
          onClick={() => navigate('/sender/upload')}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow transition-colors"
        >
          <FiUploadCloud className="mr-2 w-4 h-4" /> Upload New File
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by filename or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Retrieving vault files..." />
          </div>
        ) : files.length === 0 ? (
          <EmptyState
            title="No Files in Vault"
            message={
              search
                ? 'No files matched your search query.'
                : 'You have not uploaded any files yet. Upload your first file to share.'
            }
            actionLabel="Upload First File"
            onAction={() => navigate('/sender/upload')}
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
                      Size
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Transfers
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-sm">
                  {files.map((file) => (
                    <tr key={file._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <FileIcon mimeType={file.mimeType} fileName={file.originalName} />
                          <div>
                            <p className="font-semibold text-gray-900">{file.originalName}</p>
                            {file.description && (
                              <p className="text-xs text-gray-500 truncate max-w-sm mt-0.5">
                                {file.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {formatBytes(file.size)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">
                          <span className="font-bold text-indigo-600">{file.totalDownloads || 0}</span> DLs
                          <span className="text-gray-400 mx-1">•</span>
                          <span>{file.totalShares || 0} shares</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/sender/share?fileId=${file._id}`)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Generate Share Link"
                        >
                          <FiShare2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Download Copy"
                        >
                          <FiDownload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(file)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete File"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(newPage) => setPage(newPage)}
                />
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Delete Vault File"
        message={`Are you sure you want to delete "${selectedFile?.originalName}"? Any active sharing links for this file will be immediately invalidated.`}
        confirmText="Delete File"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedFile(null);
        }}
        loading={deleting}
      />
    </div>
  );
};

export default MyFilesPage;
