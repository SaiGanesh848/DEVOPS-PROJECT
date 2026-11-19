import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiUploadCloud,
  FiFolder,
  FiShare2,
  FiUsers,
  FiShield,
  FiFileText,
  FiLogOut,
  FiX,
  FiLock,
  FiCheckCircle,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const getNavLinks = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { name: 'Admin Dashboard', path: '/admin/dashboard', icon: FiHome },
          { name: 'User Management', path: '/admin/users', icon: FiUsers },
          { name: 'All Files', path: '/admin/files', icon: FiFolder },
          { name: 'Reports & Audits', path: '/reports', icon: FiFileText },
        ];
      case 'sender':
        return [
          { name: 'Sender Dashboard', path: '/sender/dashboard', icon: FiHome },
          { name: 'Secure Upload', path: '/sender/upload', icon: FiUploadCloud },
          { name: 'My Files', path: '/sender/files', icon: FiFolder },
          { name: 'File Sharing & Links', path: '/sender/share', icon: FiShare2 },
        ];
      case 'recipient':
        return [
          { name: 'Recipient Dashboard', path: '/recipient/dashboard', icon: FiHome },
          { name: 'Shared With Me', path: '/recipient/shared', icon: FiFolder },
        ];
      case 'auditor':
        return [
          { name: 'Auditor Dashboard', path: '/auditor/dashboard', icon: FiShield },
          { name: 'Audit Logs', path: '/auditor/logs', icon: FiLock },
          { name: 'System Reports', path: '/reports', icon: FiFileText },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const roleBadgeColor = {
    admin: 'bg-red-900/60 text-red-200 border-red-700',
    sender: 'bg-indigo-900/60 text-indigo-200 border-indigo-700',
    recipient: 'bg-emerald-900/60 text-emerald-200 border-emerald-700',
    auditor: 'bg-purple-900/60 text-purple-200 border-purple-700',
  }[user?.role] || 'bg-gray-800 text-gray-300 border-gray-700';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gray-900 text-white flex flex-col transition-transform duration-300 ease-in-out border-r border-gray-800 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <FiShield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block leading-tight">
                SecureTransfer
              </span>
              <span className="text-xs text-indigo-400 font-medium tracking-wide">
                Audit & Security
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 lg:hidden"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-4 rounded-xl bg-gray-800/80 border border-gray-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wider border ${roleBadgeColor}`}
            >
              {user?.role}
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <FiCheckCircle className="w-3 h-3" /> Active
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Main Menu
          </p>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <FiLogOut className="w-5 h-5 mr-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
