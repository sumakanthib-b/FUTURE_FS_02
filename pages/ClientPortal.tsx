import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../components/AuthContext';
import { 
  History, 
  MessageCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import StatusBadge from '../components/StatusBadge';

interface ClientLead {
  id: string;
  name: string;
  email: string;
  status: 'new' | 'contacted' | 'converted';
  createdAt: any;
  source: string;
  message?: string;
}

export default function ClientPortal() {
  const { user } = useAuth();
  const [userLeads, setUserLeads] = useState<ClientLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    // Security rules allow users to get docs where email matches their token email
    const q = query(
      collection(db, 'leads'),
      where('email', '==', user.email),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClientLead[];
      setUserLeads(data);
      setLoading(false);
    }, (error) => {
      console.error("Portal error:", error);
      handleFirestoreError(error, OperationType.LIST, 'leads (client portal)');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.email]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] animate-pulse">Syncing your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Private Client Vault</span>
        </div>
        <h1 className="text-4xl font-black text-white font-display tracking-tight mb-2">
          Request <span className="text-indigo-400">Timeline</span>
        </h1>
        <p className="text-slate-500 font-medium">Tracking all your inquiries with LeadFlow agencies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {userLeads.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="frosted-card rounded-[2.5rem] p-12 text-center"
              >
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <History className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No active inquiries</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  Submit our contact form to start a conversation with any of our partner agencies.
                </p>
              </motion.div>
            ) : (
              userLeads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="frosted-card rounded-[2rem] p-8 group hover:bg-white/[0.07] transition-all"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-black text-white">{lead.source}</h3>
                        <StatusBadge status={lead.status} />
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Submitted {formatDate(lead.createdAt)}
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <Zap className="w-5 h-5 text-indigo-400" />
                    </div>
                  </div>

                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5 mb-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Initial Request</p>
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      "{lead.message || 'No message provided'}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-indigo-400">
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting Agency Response
                    </span>
                    <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                    <span className="flex items-center gap-2 opacity-50">
                      <MessageCircle className="w-3.5 h-3.5" />
                      Live Chat Unavailable
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="frosted-card rounded-[2rem] p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <History className="w-12 h-12" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Profile Snapshot</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/20">
                   {user?.email?.charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{user?.displayName || 'Client'}</p>
                   <p className="text-sm font-bold truncate max-w-[150px]">{user?.email}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-2xl font-black">{userLeads.length}</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Requests</p>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-2xl font-black text-indigo-400">100%</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Data Secure</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="frosted-card rounded-[2rem] p-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Support Hub</h3>
            <div className="space-y-2">
              <div className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group cursor-pointer">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Knowledge Base</p>
              </div>
              <div className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group cursor-pointer">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Privacy Policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
