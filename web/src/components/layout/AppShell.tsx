'use client';

import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from './Sidebar';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith('/landing'));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isPublic && !isAuthenticated && !accessToken) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, accessToken, isPublic]);

  if (!mounted) return null;

  if (isPublic) return <>{children}</>;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
