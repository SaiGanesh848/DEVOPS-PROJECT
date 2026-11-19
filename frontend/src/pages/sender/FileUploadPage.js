import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUploadCloud,
  FiFile,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiArrowRight,
  FiLock,
} from 'react-icons/fi';
import * as fileService from '../../services/fileService';
import FileIcon from '../../components/common/FileIcon';
import { toast } from 'react-toastify';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.zip'];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const FileUploadPage = () => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const validateFile = (selected) => {
    setError('');
    if (!selected) return false;

    const ext = '.' + selected.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return false;
    }

    if (selected.size > MAX_SIZE_BYTES) {
      setError('File size exceeds the 50MB maximum allowable threshold.');
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && validateFile(selected)) {
      setFile(selected);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && validateFile(dropped)) {
      setFile(dropped);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }

      const res = await fileService.uploadFile(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      });

      setUploadedFile(res.data);
      toast.success('File uploaded and secured into vault!');
    } catch (err) {
      const msg = err.response?.data?.message || 'File upload failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDescription('');
    setUploadedFile(null);
    setUploadProgress(0);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <FiLock className="w-6 h-6 text-indigo-600" />
          Secure Vault Ingestion
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Files are automatically assigned UUIDs, stored outside web root, and guarded by role-based access tokens.
        </p>
      </div>

      {uploadedFile ? (
        /* Success Screen */
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <FiCheckCircle className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">File Ingestion Successful!</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your file has been safely encrypted and committed to the audit ledger.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 max-w-md mx-auto text-left space-y-2 border border-gray-200">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Original Name:</span>
              <span className="text-gray-900 font-semibold">{uploadedFile.originalName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">File Size:</span>
              <span className="text-gray-900 font-mono">{formatBytes(uploadedFile.size)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Vault Identifier:</span>
              <span className="text-gray-600 font-mono">{uploadedFile.id}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Upload Another
            </button>
            <button
              onClick={() => navigate('/sender/share')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow transition-colors flex items-center gap-2"
            >
              Create Share Link <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Upload Form */
        <form onSubmit={handleUpload} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                : file
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.zip"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <FiUploadCloud className="w-8 h-8" />
            </div>

            <p className="text-base font-semibold text-gray-800">
              Drag and drop your file here, or{' '}
              <span className="text-indigo-600 underline">browse files</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supported formats: PDF, DOCX, TXT, JPG, PNG, ZIP (Max 50MB)
            </p>
          </div>

          {/* Selected File Preview */}
          {file && (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileIcon fileName={file.name} />
                <div>
                  <p className="text-sm font-bold text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              File Description / Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Confidential financial audit reports Q3 2026..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              maxLength={500}
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-indigo-600">
                <span>Uploading to Vault...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-semibold text-sm shadow-lg shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Ingesting File ({uploadProgress}%)...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FiLock className="w-4 h-4" />
                Upload & Register with Vault
              </span>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default FileUploadPage;
