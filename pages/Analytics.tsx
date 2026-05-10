import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn, formatDate } from '../lib/utils';

interface Lead {
  id: string;
  status: string;
  source: string;
  createdAt: any;
}

export default function Analytics() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[];
      setLeads(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Process data for charts
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    converted: leads.filter(l => l.status === 'converted').length,
    conversionRate: leads.length > 0 ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : 0
  };

  // Status Distribution
  const pieData = [
    { name: 'New', value: leads.filter(l => l.status === 'new').length, color: '#6366f1' },
    { name: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, color: '#f59e0b' },
    { name: 'Converted', value: leads.filter(l => l.status === 'converted').length, color: '#10b981' },
  ];

  // Source Distribution
  const sourceData = Array.from(new Set(leads.map(l => l.source))).map(source => ({
    name: source || 'Unknown',
    count: leads.filter(l => l.source === source).length
  })).sort((a, b) => b.count - a.count);

  // Growth Trend (simplified per day)
  const trendData = leads.reduce((acc: any[], lead) => {
    const date = formatDate(lead.createdAt).split(',')[0];
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.leads += 1;
    } else {
      acc.push({ date, leads: 1 });
    }
    return acc;
  }, []).slice(-7);

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Assembling Intelligence...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 pb-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-white font-display tracking-tight">Performance Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Real-time metrics and conversion tracking</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white uppercase tracking-widest">Last 30 Days</span>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard title="Gross Leads" value={stats.total} trend="+12.5%" icon={Users} color="indigo" />
        <MetricCard title="Unprocessed" value={stats.new} trend="-5.2%" icon={Clock} color="amber" />
        <MetricCard title="Conversions" value={stats.converted} trend="+18.4%" icon={CheckCircle} color="emerald" />
        <MetricCard title="Success Rate" value={`${stats.conversionRate}%`} trend="+2.1%" icon={TrendingUp} color="blue" />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Trend Area Chart */}
        <div className="frosted-card rounded-[2.5rem] p-4 text-white">
          <div className="p-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Inbound Trend
            </h3>
          </div>
          <div className="h-80 w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                  itemStyle={{ fontSize: '10px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="frosted-card rounded-[2.5rem] p-4 text-white">
          <div className="p-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Pipeline Velocity
            </h3>
          </div>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                  itemStyle={{ fontSize: '10px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-white">{stats.total}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Active</span>
            </div>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-3 gap-4 px-8 pb-4">
             {pieData.map((item) => (
               <div key={item.name} className="flex flex-col items-center gap-1">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                   <span className="text-[10px] font-bold text-white uppercase">{item.name}</span>
                 </div>
                 <span className="text-xs font-bold text-slate-500">{((item.value / stats.total) * 100).toFixed(0)}%</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Traffic Source Bar Chart */}
        <div className="frosted-card rounded-[2.5rem] p-4 text-white">
          <div className="p-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Acquisition Channels</h3>
          </div>
          <div className="h-64 w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#fff', fontSize: 10, fontWeight: 700 }}
                  width={100}
                />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goal Conversion Funnel */}
        <div className="frosted-card rounded-[2.5rem] p-8 flex flex-col justify-center text-white">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-8">Conversion Funnel</h3>
          <div className="space-y-6">
            <FunnelStep label="Total Leads" value={stats.total} percentage={100} color="indigo" />
            <FunnelStep label="Contacted" value={leads.filter(l => l.status !== 'new').length} percentage={Math.round((leads.filter(l => l.status !== 'new').length / stats.total) * 100) || 0} color="amber" />
            <FunnelStep label="Converted" value={stats.converted} percentage={Math.round(Number(stats.conversionRate))} color="emerald" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, color }: { title: string; value: string | number; trend: string; icon: any; color: string }) {
  const colors: any = {
    indigo: "bg-indigo-500 shadow-indigo-500/20 text-white",
    amber: "bg-amber-500 shadow-amber-500/20 text-white",
    emerald: "bg-emerald-500 shadow-emerald-500/20 text-white",
    blue: "bg-blue-500 shadow-blue-500/20 text-white",
  };

  const isPositive = trend.startsWith('+');

  return (
    <div className="frosted-card rounded-[2.5rem] p-6 hover:translate-y-[-4px] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("p-4 rounded-2xl shadow-xl", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border",
          isPositive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
        )}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-4xl font-black text-white">{value}</p>
    </div>
  );
}

function FunnelStep({ label, value, percentage, color }: { label: string; value: number; percentage: number; color: string }) {
  const colors: any = {
    indigo: "bg-indigo-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-black text-white">{value} <span className="text-slate-500 text-[10px]">({percentage}%)</span></span>
      </div>
      <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full shadow-lg", colors[color])}
        />
      </div>
    </div>
  );
}
