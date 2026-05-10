import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Building2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function AdminSidebar() {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Leads', path: '/leads' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ];

  const handleLogout = () => signOut(auth);

  return (
    <div className="w-64 bg-slate-950 border-r border-white/5 flex flex-col h-[calc(100vh-64px)] sticky top-16">
      <div className="flex-1 py-8 px-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group",
              location.pathname === item.path
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-transform group-hover:scale-110",
              location.pathname === item.path ? "text-indigo-400" : "text-slate-500 group-hover:text-white/60"
            )} />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-white">System Active</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          Logout
        </button>
      </div>
    </div>
  );
}
