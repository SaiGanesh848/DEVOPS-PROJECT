import React, { useState, useEffect, useCallback } from 'react';
import {
  FiFolder,
  FiSearch,
  FiDownload,
  FiTrash2,
  FiCalendar,
  FiUser,
  FiFileText,
} from 'react-icons/fi';
import * as fileService from '../../services/fileService';
import FileIcon from '../../components/common/FileIcon';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const AllFilesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);

  // Delete modal
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fileService.getAllFiles({
        page,
        limit: 10,
        search: search.trim() || undefined,
      });
      setFiles(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalFiles(res.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load system files');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDownload = async (file) => {
    try {
      toast.info(`Downloading ${file.originalName}...`);
      await fileService.downloadFile(file._id, file.originalName);
      toast.success('Download initiated');
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
      toast.success(`File "${selectedFile.originalName}" deleted`);
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Global File Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {totalFiles} Total Files
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            System-wide visibility of all encrypted uploaded assets and their respective owners.
          </p>
        </div>
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
            placeholder="Search files across all users by name or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Scanning file directory..." />
          </div>
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
                      Uploaded By
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      File Size
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date Uploaded
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-sm">
                  {files.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        No files currently stored in vault.
                      </td>
                    </tr>
                  ) : (
                    files.map((file) => (
                      <tr key={file._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <FileIcon mimeType={file.mimeType} fileName={file.originalName} />
                            <div>
                              <p className="font-semibold text-gray-900">{file.originalName}</p>
                              {file.description && (
                                <p className="text-xs text-gray-500 truncate max-w-xs">
                                  {file.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <FiUser className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium text-xs">
                              {file.uploadedBy?.name || 'Unknown'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 pl-5">
                            {file.uploadedBy?.email}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                          {formatBytes(file.size)}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Direct Download (Admin)"
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
                    ))
                  )}
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
        title="Permanently Soft-Delete File"
        message={`Are you sure you want to delete "${selectedFile?.originalName}"? All active shares associated with this file will be automatically revoked.`}
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

export default AllFilesPage;
