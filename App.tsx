import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { auth, db, testFirestoreConnection } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  Building2, 
  LogOut, 
  ShieldCheck,
  Globe,
  LayoutDashboard,
  Users,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Analytics from './pages/Analytics';
import ClientPortal from './pages/ClientPortal';
import Login from './pages/Login';
import LeadCaptureForm from './components/LeadCaptureForm';
import AdminSidebar from './components/AdminSidebar';

function Navbar() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isAdminPath = location.pathname.startsWith('/dashboard') || 
                      location.pathname.startsWith('/leads') || 
                      location.pathname.startsWith('/analytics');
  
  const isPortalPath = location.pathname.startsWith('/portal');

  return (
    <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 text-indigo-400 font-black text-xl tracking-tight font-display">
              <div className="p-1.5 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              LeadFlow
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {!isAdminPath && isAdmin && (
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Console
                  </Link>
                )}

                {!isPortalPath && !isAdmin && (
                  <Link 
                    to="/portal" 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    My Status
                  </Link>
                )}

                {isAdminPath || isPortalPath ? (
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all underline decoration-slate-400/20 underline-offset-4"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                ) : null}
                
                <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">
                      {isAdmin ? 'System Admin' : 'Client Access'}
                    </p>
                    <p className="text-xs font-bold text-white truncate max-w-[120px]">{user.displayName || user.email}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/20 shadow-sm overflow-hidden flex items-center justify-center bg-slate-800">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="p" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-indigo-400">{user.email?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <Link to="/login" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto bg-slate-950/50">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (!isAdmin) {
        navigate('/portal');
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
      <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] animate-pulse">Initializing Admin Shell...</p>
    </div>
  );
  
  return user && isAdmin ? <AdminLayout>{children}</AdminLayout> : null;
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
      <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] animate-pulse">Syncing Private Vault...</p>
    </div>
  );
  
  return user ? <>{children}</> : null;
}

function LandingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-white/10 backdrop-blur-md"
          >
            <ShieldCheck className="w-4 h-4" />
            Empowering Modern Agencies
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter font-display"
          >
            Convert your <br/>
            <span className="text-indigo-400 italic">visitors</span> <br/>
            into <span className="underline decoration-indigo-500/30">clients</span>.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-lg leading-relaxed font-medium"
          >
            LeadFlow CRM provides a seamless bridge between your contact forms and your client pipeline. Minimal, fast, and secure.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-12"
          >
            <div className="space-y-1">
              <p className="text-3xl font-black text-white">2.4k+</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Leads Tracked</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-white">92%</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Response Rate</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-white">24/7</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Support</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <LeadCaptureForm />
        </motion.div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-indigo-500/30 selection:text-white relative overflow-x-hidden">
          {/* Background Mesh Gradients */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full"></div>
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full"></div>
          </div>

          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/dashboard" 
                  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
                />
                <Route 
                  path="/leads" 
                  element={<ProtectedRoute><Leads /></ProtectedRoute>} 
                />
                <Route 
                  path="/analytics" 
                  element={<ProtectedRoute><Analytics /></ProtectedRoute>} 
                />
                <Route 
                  path="/portal" 
                  element={<UserRoute><ClientPortal /></UserRoute>} 
                />
              </Routes>
            </main>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

