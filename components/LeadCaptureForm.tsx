import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User, Mail, Phone, MessageSquare, Send, CheckCircle2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const leadSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function LeadCaptureForm() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  React.useEffect(() => {
    if (user) {
      if (user.displayName) setValue('name', user.displayName);
      if (user.email) setValue('email', user.email);
    }
  }, [user, setValue]);

  const onSubmit = async (data: LeadFormData) => {
    setLoading(true);
    setError(null);
    try {
      const leadId = crypto.randomUUID();
      const leadRef = doc(db, 'leads', leadId);
      
      await setDoc(leadRef, {
        ...data,
        source: 'Website Contact Form',
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      setSubmitted(true);
      reset();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'leads');
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-8 frosted-card rounded-3xl">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 className="text-3xl font-bold text-white mb-2 font-display">Get in touch</h2>
            <p className="text-slate-400 mb-8 font-medium">We'll get back to you within 24 hours.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    {...register('name')}
                    className="w-full pl-12 pr-4 py-3 frosted-input rounded-2xl"
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && <p className="text-red-400 text-[10px] uppercase font-bold mt-1 ml-1 tracking-widest">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    {...register('email')}
                    className="w-full pl-12 pr-4 py-3 frosted-input rounded-2xl"
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-[10px] uppercase font-bold mt-1 ml-1 tracking-widest">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    {...register('phone')}
                    className="w-full pl-12 pr-4 py-3 frosted-input rounded-2xl"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Message</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                  <textarea
                    {...register('message')}
                    rows={4}
                    className="w-full pl-12 pr-4 py-3 frosted-input rounded-2xl resize-none"
                    placeholder="Tell us about your project..."
                  />
                </div>
                {errors.message && <p className="text-red-400 text-[10px] uppercase font-bold mt-1 ml-1 tracking-widest">{errors.message.message}</p>}
              </div>

              {error && <p className="text-red-400 py-2 text-xs font-bold uppercase tracking-widest text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending...' : (
                  <>
                    Send Message
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 font-display">Message Sent!</h2>
            <p className="text-slate-400 mb-8 font-medium">
              Thank you for reaching out. Your request has been logged and assigned to an agency representative.
            </p>
            
            <div className="space-y-4">
              {user ? (
                <Link
                  to="/portal"
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-2"
                >
                  <History className="w-5 h-5 text-indigo-400" />
                  Track In Portal
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-2"
                >
                   Sign In to Track Status
                </Link>
              )}
              
              <button
                onClick={() => setSubmitted(false)}
                className="text-slate-500 font-bold hover:text-white transition-colors uppercase text-[10px] tracking-widest pt-4"
              >
                Send another message
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
