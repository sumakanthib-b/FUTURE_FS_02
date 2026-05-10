import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../components/AuthContext';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  ArrowRight,
  Zap,
  Sparkles,
  Bot,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import StatusBadge from '../components/StatusBadge';

interface Lead {
  id: string;
  name: string;
  email: string;
  source: string;
  status: 'new' | 'contacted' | 'converted';
  createdAt: any;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    // All leads for stats
    const qAll = query(collection(db, 'leads'));
    const unsubscribeAll = onSnapshot(qAll, (snapshot) => {
      setAllLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[]);
    });

    // Recent leads for the table
    const qRecent = query(collection(db, 'leads'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(qRecent, (snapshot) => {
      setRecentLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });

    return () => {
      unsubscribeAll();
      unsubscribeRecent();
    };
  }, [isAdmin]);

  const stats = {
    total: allLeads.length,
    new: allLeads.filter(l => l.status === 'new').length,
    converted: allLeads.filter(l => l.status === 'converted').length,
    conversionRate: allLeads.length > 0 ? ((allLeads.filter(l => l.status === 'converted').length / allLeads.length) * 100).toFixed(1) : 0
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500 italic">Restricted Access.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-12 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight flex items-center gap-3">
            System <span className="text-indigo-400">Overview</span>
            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
            </div>
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Hello, {user?.displayName || 'Admin'}. Here is what's happening today.</p>
        </div>
        <Link 
          to="/leads" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 group"
        >
          View Full Pipeline
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewStat title="Pipeline Total" value={stats.total} icon={Users} color="indigo" />
        <OverviewStat title="Attention Req." value={stats.new} icon={Clock} color="amber" />
        <OverviewStat title="Succesful Closures" value={stats.converted} icon={CheckCircle} color="emerald" />
        <OverviewStat title="Conversion %" value={`${stats.conversionRate}%`} icon={TrendingUp} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Leads Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Latest Inbound Activity
            </h2>
            <Link to="/leads" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:underline">View All</Link>
          </div>
          <div className="frosted-card rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-6 border-b border-white/5 h-20 bg-white/5" />
                    </tr>
                  ))
                ) : recentLeads.length === 0 ? (
                  <tr>
                    <td className="px-6 py-12 text-center text-slate-500 italic">No activity recorded yet.</td>
                  </tr>
                ) : (
                  recentLeads.map((lead) => (
                    <tr key={lead.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-slate-400 group-hover:text-indigo-400 transition-colors border border-white/5">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{lead.name}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{lead.source}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-6 py-5 text-right font-medium text-[10px] text-slate-500 uppercase tracking-widest">
                        {formatDate(lead.createdAt).split('at')[0]}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Prediction / Sidebar Card */}
        <div className="space-y-6">
          <div className="frosted-card rounded-3xl p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Bot className="w-16 h-16 text-indigo-400" />
             </div>
             
             <div className="flex items-center gap-2 mb-6 relative z-10">
               <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                 <Sparkles className="w-4 h-4 text-indigo-400" />
               </div>
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Agent Summary</h3>
             </div>

             <div className="space-y-4 relative z-10">
               <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                 <p className="text-xs text-indigo-300 leading-relaxed font-medium">
                   "You have <span className="text-white font-bold">{stats.new} new leads</span> that haven't been contacted yet. Based on historical data, response time within 2 hours increases conversion by 40%."
                 </p>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-xl font-bold text-white">{stats.conversionRate}%</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global Success</p>
                 </div>
                 <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-xl font-bold text-white">{Math.ceil(stats.total * 1.2)}</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Projected leads</p>
                 </div>
               </div>
             </div>
          </div>

          <div className="frosted-card rounded-3xl p-6">
             <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
               <MessageSquare className="w-3 h-3 text-emerald-400" />
               Quick Actions
             </h3>
             <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black text-slate-300 uppercase tracking-widest transition-all">
                  Send Follow-up Emails
                </button>
                <button className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black text-slate-300 uppercase tracking-widest transition-all">
                  Export pipeline (CSV)
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewStat({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  const colors: any = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div className={cn("p-6 rounded-[2rem] border frosted-card group hover:translate-y-[-4px] transition-all", colors[color])}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-5 h-5 opacity-80" />
        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20" />
      </div>
      <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}
