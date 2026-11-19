import React from 'react';
import {
  FiFile,
  FiFileText,
  FiImage,
  FiArchive,
  FiFilm,
  FiMusic,
} from 'react-icons/fi';

const FileIcon = ({ filename = '', type = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const ext = filename
    ? filename.split('.').pop().toLowerCase()
    : type.toLowerCase();

  const iconConfig = {
    pdf: { icon: FiFileText, color: 'text-red-500', bg: 'bg-red-50' },
    doc: { icon: FiFileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    docx: { icon: FiFileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    txt: { icon: FiFileText, color: 'text-gray-500', bg: 'bg-gray-50' },
    jpg: { icon: FiImage, color: 'text-green-500', bg: 'bg-green-50' },
    jpeg: { icon: FiImage, color: 'text-green-500', bg: 'bg-green-50' },
    png: { icon: FiImage, color: 'text-green-500', bg: 'bg-green-50' },
    gif: { icon: FiImage, color: 'text-green-500', bg: 'bg-green-50' },
    svg: { icon: FiImage, color: 'text-green-500', bg: 'bg-green-50' },
    zip: { icon: FiArchive, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    rar: { icon: FiArchive, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    '7z': { icon: FiArchive, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    mp4: { icon: FiFilm, color: 'text-purple-500', bg: 'bg-purple-50' },
    avi: { icon: FiFilm, color: 'text-purple-500', bg: 'bg-purple-50' },
    mp3: { icon: FiMusic, color: 'text-pink-500', bg: 'bg-pink-50' },
    wav: { icon: FiMusic, color: 'text-pink-500', bg: 'bg-pink-50' },
  };

  const config = iconConfig[ext] || {
    icon: FiFile,
    color: 'text-gray-500',
    bg: 'bg-gray-50',
  };

  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center justify-center p-2 rounded-lg ${config.bg}`}>
      <IconComponent className={`${sizeClasses[size]} ${config.color}`} />
    </div>
  );
};

export default FileIcon;
