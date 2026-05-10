import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, deleteDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../components/AuthContext';
import { 
  Users, 
  Search, 
  Filter, 
  Trash2,
  Mail,
  Phone,
  Bot,
  Sparkles,
  Loader2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import StatusBadge from '../components/StatusBadge';
import { getLeadInsights, AIInsights } from '../services/gemini';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source: string;
  status: 'new' | 'contacted' | 'converted';
  createdAt: any;
  updatedAt: any;
}

export default function Leads() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(leadsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });

    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedLead || !isAdmin) {
      setNotes([]);
      setAiInsights(null);
      setAiError(null);
      return;
    }

    const q = query(collection(db, 'leads', selectedLead.id, 'notes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `leads/${selectedLead.id}/notes`);
    });

    return () => unsubscribe();
  }, [selectedLead, isAdmin]);

  useEffect(() => {
    const fetchAIInsights = async () => {
      if (!selectedLead || !isAdmin) return;

      setLoadingAI(true);
      setAiError(null);
      try {
        const insights = await getLeadInsights({
          name: selectedLead.name,
          email: selectedLead.email,
          source: selectedLead.source,
          notes: notes.map(n => n.text)
        });
        setAiInsights(insights);
      } catch (err) {
        console.error("AI Insights Error:", err);
        setAiError("AI insights could not be generated.");
      } finally {
        setLoadingAI(false);
      }
    };

    if (selectedLead) fetchAIInsights();
  }, [selectedLead?.id, isAdmin, notes.length === 0]);

  const updateStatus = async (leadId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await deleteDoc(doc(db, 'leads', leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `leads/${leadId}`);
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNote.trim() || !user) return;
    setAddingNote(true);
    try {
      const noteId = crypto.randomUUID();
      await setDoc(doc(db, 'leads', selectedLead.id, 'notes', noteId), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Admin',
        text: newNote,
        createdAt: serverTimestamp()
      });
      setNewNote('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `leads/${selectedLead.id}/notes`);
    } finally {
      setAddingNote(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white font-display tracking-tight">Leads Management</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Track and manage your client pipeline</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm w-64 focus:ring-2 focus:ring-indigo-500/50 outline-none text-white transition-all"
            />
          </div>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-3 transition-all">
            <Filter className="w-4 h-4 text-slate-500 mr-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent py-2.5 text-sm outline-none cursor-pointer text-slate-300 font-bold"
            >
              <option value="all" className="bg-slate-900">All Status</option>
              <option value="new" className="bg-slate-900">New</option>
              <option value="contacted" className="bg-slate-900">Contacted</option>
              <option value="converted" className="bg-slate-900">Converted</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <div className="flex-1">
          <div className="frosted-card rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-6 py-4">Client Detail</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr className="animate-pulse">
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">Scanning Database...</td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic font-medium">No leads matching your criteria found.</td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <motion.tr 
                      key={lead.id}
                      layoutId={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={cn(
                        "group hover:bg-white/5 cursor-pointer transition-all",
                        selectedLead?.id === lead.id && "bg-indigo-500/10 border-l-2 border-l-indigo-500"
                      )}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-105",
                            lead.status === 'new' ? "bg-indigo-500/10 text-indigo-400" :
                            lead.status === 'contacted' ? "bg-amber-500/10 text-amber-400" :
                            "bg-emerald-500/10 text-emerald-400"
                          )}>
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-base">{lead.name}</div>
                            <div className="text-xs text-slate-500 font-medium">{lead.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                          className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {selectedLead && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-96 space-y-6"
            >
              <div className="frosted-card rounded-3xl p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-white">Focus: Lead</h2>
                  <button onClick={() => setSelectedLead(null)} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Dismiss</button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Pipeline Status</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => updateStatus(selectedLead.id, 'contacted')}
                        className="px-4 py-3 bg-amber-500/5 text-amber-400 border border-amber-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/10 transition-all"
                      >
                        Contacted
                      </button>
                      <button 
                        onClick={() => updateStatus(selectedLead.id, 'converted')}
                        className="px-4 py-3 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all"
                      >
                        Converted
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contact Card</h3>
                    <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3 text-sm font-medium">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-indigo-400" />
                        </div>
                        <a href={`mailto:${selectedLead.email}`} className="text-slate-300 hover:text-indigo-400 transition-colors truncate">{selectedLead.email}</a>
                      </div>
                      {selectedLead.phone && (
                        <div className="flex items-center gap-3 text-sm font-medium">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-indigo-400" />
                          </div>
                          <span className="text-slate-300">{selectedLead.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <Sparkles className="w-12 h-12 text-indigo-400" />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                      <Bot className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">GenAI Agent</h3>
                    </div>

                    {loadingAI ? (
                      <div className="flex flex-col items-center py-4 gap-2">
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Processing...</span>
                      </div>
                    ) : aiInsights ? (
                      <div className="space-y-4 relative z-10">
                        <p className="text-xs text-slate-400 leading-relaxed font-medium italic">"{aiInsights.summary}"</p>
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                          <h4 className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Recommendation</h4>
                          <p className="text-[11px] text-white leading-relaxed">{aiInsights.suggestedReply}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic text-center py-2">Select to analyze</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="frosted-card rounded-3xl p-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Follow-up Log</h3>
                <form onSubmit={addNote} className="space-y-2 mb-6">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter manual update..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
                    rows={2}
                  />
                  <button 
                    type="submit"
                    disabled={!newNote.trim() || addingNote}
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Log Note
                  </button>
                </form>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-2 font-medium">{note.text}</p>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{note.authorName} • {formatDate(note.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
