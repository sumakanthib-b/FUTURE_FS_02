import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Chrome, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full frosted-card rounded-3xl p-8"
      >
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-white/5 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Admin Portal</h1>
          <p className="text-white/40 text-sm mt-1">Manage your leads and conversions</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors font-bold text-white shadow-sm shadow-indigo-500/10 group"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <Chrome className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                Continue with Google
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 rounded-2xl flex items-start gap-3 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 leading-relaxed font-medium">{error}</p>
            </div>
          )}

          <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest text-center">
              Authorized Access Only
            </p>
            <p className="text-[10px] text-indigo-300/40 text-center mt-2 leading-relaxed italic">
              New administrators must be manually authorized <br/> by a system owner.
            </p>
          </div>
        </div>

        <p className="mt-12 text-[10px] text-white/20 text-center uppercase tracking-[0.2em] font-black">
          LeadFlow CRM • Enterprise v1.0
        </p>
      </motion.div>
    </div>
  );
}
