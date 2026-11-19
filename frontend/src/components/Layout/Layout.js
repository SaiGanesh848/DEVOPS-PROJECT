import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const getTitleFromPath = (pathname) => {
  if (pathname.includes('/admin/dashboard')) return 'Admin Overview';
  if (pathname.includes('/admin/users')) return 'User Access Management';
  if (pathname.includes('/admin/files')) return 'Global File Directory';
  if (pathname.includes('/sender/dashboard')) return 'Sender Dashboard';
  if (pathname.includes('/sender/upload')) return 'Secure File Upload';
  if (pathname.includes('/sender/files')) return 'My Vault Files';
  if (pathname.includes('/sender/share')) return 'File Sharing & Links';
  if (pathname.includes('/recipient/dashboard')) return 'Recipient Dashboard';
  if (pathname.includes('/recipient/shared')) return 'Files Shared With Me';
  if (pathname.includes('/auditor/dashboard')) return 'Auditor Operations';
  if (pathname.includes('/auditor/logs')) return 'Security Audit Logs';
  if (pathname.includes('/reports')) return 'Compliance & Audit Reports';
  return 'Secure File Transfer';
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = getTitleFromPath(location.pathname);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={pageTitle} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
