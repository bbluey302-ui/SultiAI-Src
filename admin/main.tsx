// ============================================================================
// SultiAI Admin Console — standalone entry point (separate app, port 5000)
// The learner app no longer contains any admin code. This app runs on its own
// and talks ONLY to the admin backend (same origin) which is backed by Supabase.
// ============================================================================
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { AdminAuthProvider } from './components/AdminAuthContext';
import { AdminDashboard } from './components/AdminDashboard';
import './index.css';

const LEARNER_APP_URL =
  (import.meta as any).env?.VITE_LEARNER_APP_URL || 'http://localhost:3000';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AdminAuthProvider>
      <AdminDashboard
        onSwitchToMobileApp={() => {
          window.open(LEARNER_APP_URL, '_blank');
        }}
      />
    </AdminAuthProvider>
  </ThemeProvider>
);
