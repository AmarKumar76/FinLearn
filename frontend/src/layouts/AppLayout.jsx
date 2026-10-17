import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import api from '../services/api';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState('connecting');

  useEffect(() => {
    let isMounted = true;
    async function checkBackend() {
      try {
        const res = await api.checkHealth();
        if (isMounted) {
          if (res.status === 'healthy' || res.status === 'success' || res.status === 'ok') {
            setHealthStatus('healthy');
          } else {
            setHealthStatus(res.status || 'degraded');
          }
        }
      } catch (err) {
        if (isMounted) {
          setHealthStatus('offline');
        }
      }
    }

    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-ivory text-aubergine">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main app body */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet context={{ healthStatus }} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
